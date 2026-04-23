import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  solveSillySlots,
  type Keyword,
  type Adjective,
  type Noun,
  type Slot,
} from "../../services/sillySlotsService";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverResult,
} from "../common";
import { cn } from "../../lib/cn";

interface SillySlotsSolverProps {
  bomb: BombEntity | null | undefined;
}

const KEYWORDS: { value: Keyword; label: string }[] = [
  { value: "SASSY", label: "Sassy" },
  { value: "BLUE", label: "Blue" },
  { value: "RED", label: "Red" },
  { value: "GREEN", label: "Green" },
  { value: "CHERRY", label: "Cherry" },
  { value: "GRAPE", label: "Grape" },
  { value: "BOMB", label: "Bomb" },
  { value: "COIN", label: "Coin" },
];

const ADJECTIVES: { value: Adjective; label: string }[] = [
  { value: "SASSY", label: "Sassy" },
  { value: "SILLY", label: "Silly" },
  { value: "SOGGY", label: "Soggy" },
];

const NOUNS: { value: Noun; label: string }[] = [
  { value: "SALLY", label: "Sally" },
  { value: "SIMON", label: "Simon" },
  { value: "SAUSAGE", label: "Sausage" },
  { value: "STEVEN", label: "Steven" },
];

/** Visual color for a colour-typed keyword when used as a slot's colour. */
const COLOUR_SWATCH: Record<Keyword, string> = {
  BLUE: "bg-blue-500",
  RED: "bg-red-500",
  GREEN: "bg-green-500",
  CHERRY: "bg-rose-500",
  GRAPE: "bg-purple-500",
  BOMB: "bg-neutral-800 dark:bg-neutral-200",
  COIN: "bg-amber-400",
  SASSY: "bg-muted",
};

const DEFAULT_SLOT: Slot = { adjective: "SASSY", noun: "SALLY", colour: "BLUE" };

function defaultSlots(): [Slot, Slot, Slot] {
  return [{ ...DEFAULT_SLOT }, { ...DEFAULT_SLOT }, { ...DEFAULT_SLOT }];
}

const SELECT_CLASS =
  "rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export default function SillySlotsSolver({ bomb }: SillySlotsSolverProps) {
  const [keyword, setKeyword] = useState<Keyword>("SASSY");
  const [slots, setSlots] = useState<[Slot, Slot, Slot]>(defaultSlots());
  const [result, setResult] = useState<{
    legal: boolean;
    illegalRuleNumber?: number;
  } | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");

  const {
    isLoading,
    error,
    isSolved,
    setIsLoading,
    setError,
    setIsSolved,
    clearError,
    reset: resetSolverState,
    currentModule,
    round,
    markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((s) => s.updateModuleAfterSolve);

  const moduleState = useMemo(
    () => ({ keyword, slots, result, twitchCommand }),
    [keyword, slots, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      keyword?: Keyword;
      slots?: Slot[];
      result?: { legal: boolean; illegalRuleNumber?: number } | null;
      twitchCommand?: string;
    }) => {
      if (state.keyword != null && KEYWORDS.some((o) => o.value === state.keyword))
        setKeyword(state.keyword);
      if (Array.isArray(state.slots) && state.slots.length >= 3) {
        setSlots([
          {
            adjective: state.slots[0].adjective ?? "SASSY",
            noun: state.slots[0].noun ?? "SALLY",
            colour: state.slots[0].colour ?? "BLUE",
          },
          {
            adjective: state.slots[1].adjective ?? "SASSY",
            noun: state.slots[1].noun ?? "SALLY",
            colour: state.slots[1].colour ?? "BLUE",
          },
          {
            adjective: state.slots[2].adjective ?? "SASSY",
            noun: state.slots[2].noun ?? "SALLY",
            colour: state.slots[2].colour ?? "BLUE",
          },
        ]);
      }
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand != null) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (solution: { legal: boolean; illegalRuleNumber?: number }) => {
      setResult(solution);
      setTwitchCommand(
        generateTwitchCommand({
          moduleType: ModuleType.SILLY_SLOTS,
          result: solution,
        }),
      );
    },
    [],
  );

  useSolverModulePersistence<
    typeof moduleState,
    { legal: boolean; illegalRuleNumber?: number }
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null || typeof raw !== "object") return null;
      const o = raw as { output?: { legal?: boolean; illegalRuleNumber?: number } };
      if (o?.output && typeof o.output.legal === "boolean") {
        return { legal: o.output.legal, illegalRuleNumber: o.output.illegalRuleNumber };
      }
      const r = raw as { legal?: boolean; illegalRuleNumber?: number };
      if (typeof r.legal === "boolean") {
        return { legal: r.legal, illegalRuleNumber: r.illegalRuleNumber };
      }
      return null;
    },
    inferSolved: (_sol, mod) => Boolean((mod as { solved?: boolean })?.solved),
    currentModule,
    setIsSolved,
  });

  const setSlot = useCallback(
    (index: 0 | 1 | 2, field: keyof Slot, value: Adjective | Noun | Keyword) => {
      setSlots((prev) => {
        const next: [Slot, Slot, Slot] = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    },
    [],
  );

  const handleSolve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing round, bomb, or module");
      return;
    }
    setIsLoading(true);
    clearError();
    try {
      const response = await solveSillySlots(round.id, bomb.id, currentModule.id, {
        input: { keyword, slots },
      });
      if (response.reason) {
        setError(response.reason);
        return;
      }
      if (response.output != null) {
        setResult(response.output);
        const command = generateTwitchCommand({
          moduleType: ModuleType.SILLY_SLOTS,
          result: response.output,
        });
        setTwitchCommand(command);
        const solved = Boolean(response.solved);
        updateModuleAfterSolve(
          bomb.id,
          currentModule.id,
          moduleState,
          response.output,
          solved,
        );
        if (solved) {
          setIsSolved(true);
          markModuleSolved(bomb.id, currentModule.id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setKeyword("SASSY");
    setSlots(defaultSlots());
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  const disabled = isLoading || isSolved;

  return (
    <SolverLayout>
      <SolverSection
        title="Display keyword"
        description="Pick the keyword shown on the module display."
      >
        <select
          className={cn(SELECT_CLASS, "w-full max-w-xs")}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value as Keyword)}
          disabled={disabled}
          aria-label="Display keyword"
        >
          {KEYWORDS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </SolverSection>

      <SolverSection
        title="Current slot display"
        description="Read each slot left to right: adjective, noun, and background colour."
      >
        <div className="space-y-2">
          {([0, 1, 2] as const).map((i) => {
            const slot = slots[i];
            return (
              <div
                key={i}
                className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2"
              >
                <span className="w-12 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Slot {i + 1}
                </span>
                <select
                  className={SELECT_CLASS}
                  value={slot.adjective}
                  onChange={(e) => setSlot(i, "adjective", e.target.value as Adjective)}
                  disabled={disabled}
                  aria-label={`Slot ${i + 1} adjective`}
                >
                  {ADJECTIVES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  className={SELECT_CLASS}
                  value={slot.noun}
                  onChange={(e) => setSlot(i, "noun", e.target.value as Noun)}
                  disabled={disabled}
                  aria-label={`Slot ${i + 1} noun`}
                >
                  {NOUNS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="inline-flex items-center gap-2">
                  <span
                    aria-hidden
                    className={cn(
                      "h-4 w-4 rounded-full border border-border",
                      COLOUR_SWATCH[slot.colour],
                    )}
                  />
                  <select
                    className={SELECT_CLASS}
                    value={slot.colour}
                    onChange={(e) => setSlot(i, "colour", e.target.value as Keyword)}
                    disabled={disabled}
                    aria-label={`Slot ${i + 1} colour`}
                  >
                    {KEYWORDS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Check legality"
      />

      <ErrorAlert error={error} onDismiss={clearError} />

      {result != null && (
        <SolverResult
          variant={result.legal ? "success" : "warning"}
          title={result.legal ? "Press KEEP" : "Pull the LEVER"}
          description={
            result.legal
              ? "This slot display is legal — keep it."
              : `Illegal (rule ${result.illegalRuleNumber ?? "?"}). Pull the lever to re-roll.`
          }
        />
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        Enter the display keyword and the current slot reels each spin. The solver
        applies the rules in order and tells you whether to press KEEP or pull the
        lever. Four lever pulls defuse the module.
      </SolverInstructions>
    </SolverLayout>
  );
}
