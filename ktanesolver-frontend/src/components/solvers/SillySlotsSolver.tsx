import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  solveSillySlots,
  type Keyword,
  type SlotColor,
  type SlotShape,
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
  { value: "SILLY", label: "Silly" },
  { value: "SOGGY", label: "Soggy" },
  { value: "SALLY", label: "Sally" },
  { value: "SIMON", label: "Simon" },
  { value: "SAUSAGE", label: "Sausage" },
  { value: "STEVEN", label: "Steven" },
];

const COLORS: { value: SlotColor; label: string }[] = [
  { value: "RED", label: "Red" },
  { value: "GREEN", label: "Green" },
  { value: "BLUE", label: "Blue" },
];

const SHAPES: { value: SlotShape; label: string }[] = [
  { value: "BOMB", label: "Bomb" },
  { value: "GRAPE", label: "Grape" },
  { value: "CHERRY", label: "Cherry" },
  { value: "COIN", label: "Coin" },
];

const COLOR_SWATCH: Record<SlotColor, string> = {
  BLUE: "bg-blue-500",
  RED: "bg-red-500",
  GREEN: "bg-green-500",
};

const DEFAULT_SLOT: Slot = { color: "RED", shape: "BOMB" };

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
            color: state.slots[0].color ?? "RED",
            shape: state.slots[0].shape ?? "BOMB",
          },
          {
            color: state.slots[1].color ?? "RED",
            shape: state.slots[1].shape ?? "BOMB",
          },
          {
            color: state.slots[2].color ?? "RED",
            shape: state.slots[2].shape ?? "BOMB",
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
    (index: 0 | 1 | 2, field: keyof Slot, value: SlotColor | SlotShape) => {
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
      const response = await solveSillySlots(round.id, bomb.id, currentModule.id, { keyword, slots });
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
          { keyword, slots, result: response.output, twitchCommand: command },
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
        description="Read each reel left to right: color and symbol."
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
                  value={slot.color}
                  onChange={(e) => setSlot(i, "color", e.target.value as SlotColor)}
                  disabled={disabled}
                  aria-label={`Slot ${i + 1} color`}
                >
                  {COLORS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <select
                  className={SELECT_CLASS}
                  value={slot.shape}
                  onChange={(e) => setSlot(i, "shape", e.target.value as SlotShape)}
                  disabled={disabled}
                  aria-label={`Slot ${i + 1} symbol`}
                >
                  {SHAPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span aria-hidden className={cn("h-4 w-4 rounded-full border border-border", COLOR_SWATCH[slot.color])} />
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
        Enter the display keyword and the three visible reels each spin. The solver
        applies the rules in order and tells you whether to press KEEP or pull the
        lever. Four lever pulls defuse the module.
      </SolverInstructions>
    </SolverLayout>
  );
}
