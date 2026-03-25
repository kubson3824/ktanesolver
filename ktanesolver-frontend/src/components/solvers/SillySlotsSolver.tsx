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
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

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

const DEFAULT_SLOT: Slot = { adjective: "SASSY", noun: "SALLY", colour: "BLUE" };

function defaultSlots(): [Slot, Slot, Slot] {
  return [
    { ...DEFAULT_SLOT },
    { ...DEFAULT_SLOT },
    { ...DEFAULT_SLOT },
  ];
}

interface SillySlotsSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function SillySlotsSolver({ bomb }: SillySlotsSolverProps) {
  const [keyword, setKeyword] = useState<Keyword>("SASSY");
  const [slots, setSlots] = useState<[Slot, Slot, Slot]>(defaultSlots());
  const [result, setResult] = useState<{ legal: boolean; illegalRuleNumber?: number } | null>(null);
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
    [keyword, slots, result, twitchCommand]
  );

  const onRestoreState = useCallback(
    (state: { keyword?: Keyword; slots?: Slot[]; result?: { legal: boolean; illegalRuleNumber?: number } | null; twitchCommand?: string }) => {
      if (state.keyword != null && KEYWORDS.some((o) => o.value === state.keyword)) setKeyword(state.keyword);
      if (Array.isArray(state.slots) && state.slots.length >= 3) {
        setSlots([
          { ...state.slots[0], adjective: state.slots[0].adjective ?? "SASSY", noun: state.slots[0].noun ?? "SALLY", colour: state.slots[0].colour ?? "BLUE" },
          { ...state.slots[1], adjective: state.slots[1].adjective ?? "SASSY", noun: state.slots[1].noun ?? "SALLY", colour: state.slots[1].colour ?? "BLUE" },
          { ...state.slots[2], adjective: state.slots[2].adjective ?? "SASSY", noun: state.slots[2].noun ?? "SALLY", colour: state.slots[2].colour ?? "BLUE" },
        ]);
      }
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand != null) setTwitchCommand(state.twitchCommand);
    },
    []
  );

  const onRestoreSolution = useCallback(
    (solution: { legal: boolean; illegalRuleNumber?: number }) => {
      setResult(solution);
      setTwitchCommand(
        generateTwitchCommand({ moduleType: ModuleType.SILLY_SLOTS, result: solution })
      );
    },
    []
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
      if (o?.output && typeof o.output.legal === "boolean") return o.output;
      const r = raw as { legal?: boolean; illegalRuleNumber?: number };
      if (typeof r.legal === "boolean") return r;
      return null;
    },
    inferSolved: (_sol, mod) => Boolean((mod as { solved?: boolean })?.solved),
    currentModule,
    setIsSolved,
  });

  const setSlot = useCallback((index: 0 | 1 | 2, field: keyof Slot, value: Adjective | Noun | Keyword) => {
    setSlots((prev) => {
      const next: [Slot, Slot, Slot] = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }, []);

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
        updateModuleAfterSolve(bomb.id, currentModule.id, moduleState, response.output, solved);
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

  return (
    <SolverLayout>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Silly Slots</CardTitle>
          <CardDescription>
            Enter the keyword on the display and the three slots (adjective + noun + colour). Press KEEP when legal, pull the lever when illegal. Module defuses after 4 lever pulls.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Keyword (display)</span>
            </label>
            <select
              className="select select-bordered w-full max-w-xs"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value as Keyword)}
            >
              {KEYWORDS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="label">
              <span className="label-text">Slots (left to right)</span>
            </label>
            {([0, 1, 2] as const).map((i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-base-200/50">
                <span className="text-sm font-medium w-6">Slot {i + 1}</span>
                <select
                  className="select select-bordered select-sm"
                  value={slots[i].adjective}
                  onChange={(e) => setSlot(i, "adjective", e.target.value as Adjective)}
                >
                  {ADJECTIVES.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <select
                  className="select select-bordered select-sm"
                  value={slots[i].noun}
                  onChange={(e) => setSlot(i, "noun", e.target.value as Noun)}
                >
                  {NOUNS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <select
                  className="select select-bordered select-sm"
                  value={slots[i].colour}
                  onChange={(e) => setSlot(i, "colour", e.target.value as Keyword)}
                >
                  {KEYWORDS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <ErrorAlert error={error} onDismiss={clearError} />

          {result != null && (
            <div
              className={`p-4 rounded-lg font-semibold text-center ${
                result.legal ? "bg-success/20 text-success-content" : "bg-error/20 text-error-content"
              }`}
            >
              {result.legal ? "Press KEEP" : "Pull the LEVER"}
              {result.illegalRuleNumber != null && !result.legal && (
                <span className="block text-sm font-normal mt-1">Rule {result.illegalRuleNumber}</span>
              )}
            </div>
          )}

          {twitchCommand && (
            <TwitchCommandDisplay command={twitchCommand} />
          )}
        </CardContent>
      </Card>

      <SolverControls onSolve={handleSolve} onReset={reset} isLoading={isLoading} />
    </SolverLayout>
  );
}
