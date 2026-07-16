import { useCallback, useMemo, useState } from "react";
import { Scissors, Star, Lightbulb } from "lucide-react";
import type { BombEntity } from "../../types";
import {
  solveComplicatedWires,
  type ComplicatedWire,
  type ComplicatedWiresSolveRequest,
} from "../../services/complicatedWiresService";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SegmentedControl,
  SolverControls,
  SolverResult,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import { cn } from "../../lib/cn";

interface ComplicatedWiresSolverProps {
  bomb: BombEntity | null | undefined;
}

interface WireState extends ComplicatedWire {
  id: number;
}

const DEFAULT_WIRES: WireState[] = [
  { id: 1, red: false, blue: false, led: false, star: false },
  { id: 2, red: false, blue: false, led: false, star: false },
  { id: 3, red: false, blue: false, led: false, star: false },
  { id: 4, red: false, blue: false, led: false, star: false },
  { id: 5, red: false, blue: false, led: false, star: false },
  { id: 6, red: false, blue: false, led: false, star: false },
];

const WIRE_COUNT_OPTIONS = [
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5" },
  { value: 6, label: "6" },
] as const;

const ORDINAL = ["1st", "2nd", "3rd", "4th", "5th", "6th"];

function wireGradient(wire: WireState): string {
  if (wire.red && wire.blue)
    return "bg-gradient-to-r from-red-600 via-fuchsia-500 to-blue-500";
  if (wire.red) return "bg-gradient-to-r from-red-600 to-red-500";
  if (wire.blue) return "bg-gradient-to-r from-blue-600 to-blue-500";
  return "bg-muted border border-dashed border-border";
}

function wireColorLabel(wire: WireState): string {
  if (wire.red && wire.blue) return "Red + Blue";
  if (wire.red) return "Red";
  if (wire.blue) return "Blue";
  return "No color";
}

export default function ComplicatedWiresSolver({ bomb }: ComplicatedWiresSolverProps) {
  const [wires, setWires] = useState<WireState[]>(DEFAULT_WIRES);
  const [wireCount, setWireCount] = useState(6);
  const [solution, setSolution] = useState<number[]>([]);
  const [twitchCommands, setTwitchCommands] = useState<string[]>([]);

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

  const moduleState = useMemo(
    () => ({ wires, wireCount, solution, twitchCommands }),
    [wires, wireCount, solution, twitchCommands],
  );

  const onRestoreState = useCallback(
    (state: { wires?: ComplicatedWire[]; wireCount?: number; solution?: number[]; twitchCommands?: string[] } | { input?: { wires?: ComplicatedWire[]; wireCount?: number } }) => {
      console.log("ComplicatedWiresSolver onRestoreState", state);

      if ('input' in state) {
        if (state.input?.wires && Array.isArray(state.input.wires)) {
          const restoredWires: WireState[] = state.input.wires.map((wire, index) => ({
            ...wire,
            id: index + 1,
          }));
          setWires(restoredWires);
          setWireCount(state.input.wires.length);
        } else if (state.input?.wireCount !== undefined) {
          setWireCount(state.input.wireCount);
        }
      } else if ('wires' in state) {
        if (state.wires && Array.isArray(state.wires)) {
          const restoredWires: WireState[] = state.wires.map((wire, index) => ({
            ...wire,
            id: index + 1,
          }));
          setWires(restoredWires);
          setWireCount(state.wires.length);
        } else if (state.wireCount !== undefined) {
          setWireCount(state.wireCount);
        }
        if (state.solution && Array.isArray(state.solution)) {
          setSolution(state.solution);
        }
        if (state.twitchCommands && Array.isArray(state.twitchCommands)) {
          setTwitchCommands(state.twitchCommands);
        }
      }
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (restored: { cutWires: number[] } | number[]) => {
      const cutWires = Array.isArray(restored) ? restored : restored.cutWires;
      if (!cutWires || !Array.isArray(cutWires)) return;

      setSolution(cutWires);

      const commands = cutWires.map((wireNum) =>
        generateTwitchCommand({
          moduleType: ModuleType.COMPLICATED_WIRES,
          result: { action: "cut", wire: wireNum },
        }),
      );
      setTwitchCommands(commands);
    },
    [],
  );

  useSolverModulePersistence<
    { wires: WireState[]; wireCount: number; solution: number[]; twitchCommands: string[] },
    { cutWires: number[] } | number[]
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      console.log("ComplicatedWiresSolver extractSolution raw:", raw);
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; cutWires?: unknown; solution?: unknown };
        if ('solution' in anyRaw && Array.isArray(anyRaw.solution)) {
          return anyRaw.solution as number[];
        }
        if (anyRaw.output && typeof anyRaw.output === "object") {
          return (anyRaw.output as { cutWires: number[] }).cutWires;
        }
        if (Array.isArray(anyRaw.cutWires)) {
          return anyRaw.cutWires as number[];
        }
        if (Array.isArray(raw)) {
          return raw as number[];
        }
      }
      return null;
    },
    inferSolved: (_sol, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const updateWire = (wireId: number, property: keyof ComplicatedWire, value: boolean) => {
    setWires((prev) =>
      prev.map((wire) => (wire.id === wireId ? { ...wire, [property]: value } : wire)),
    );
    clearError();
    setSolution([]);
    setTwitchCommands([]);
    setIsSolved(false);
  };

  const handleWireCountChange = (count: number) => {
    setWireCount(count);
    setWires(DEFAULT_WIRES.slice(0, count));
    clearError();
    setSolution([]);
    setTwitchCommands([]);
    setIsSolved(false);
  };

  const handleSolve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    if (wireCount === 0) {
      setError("Please select at least one wire");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const request: ComplicatedWiresSolveRequest = {
        input: {
          wires: wires.slice(0, wireCount).map(({ red, blue, led, star }) => ({ red, blue, led, star })),
        },
      };

      const response = await solveComplicatedWires(round.id, bomb.id, currentModule.id, request);

      setSolution(response.output.cutWires);

      const commands = response.output.cutWires.map((wireNum) =>
        generateTwitchCommand({
          moduleType: ModuleType.COMPLICATED_WIRES,
          result: { action: "cut", wire: wireNum },
        }),
      );
      setTwitchCommands(commands);

      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Complicated Wires");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setWires(DEFAULT_WIRES);
    setWireCount(6);
    setSolution([]);
    setTwitchCommands([]);
    resetSolverState();
  };

  const activeWires = wires.slice(0, wireCount);

  const resultDescription =
    isSolved
      ? solution.length === 0
        ? "Don't cut any wires."
        : `Cut wires: ${solution.map((n) => `#${n}`).join(", ")}`
      : undefined;

  return (
    <SolverLayout>
      <SolverSection
        title="Complicated Wires"
        description="For each wire, toggle its attributes: red/blue color, LED above, star below."
        actions={
          <SegmentedControl
            value={wireCount}
            onChange={(v) => handleWireCountChange(v as number)}
            options={WIRE_COUNT_OPTIONS}
            size="sm"
            ariaLabel="Number of wires"
            disabled={isSolved || isLoading}
          />
        }
      >
        <ul className="space-y-2">
          {activeWires.map((wire) => {
            const isCut = isSolved && solution.includes(wire.id);
            return (
              <li
                key={wire.id}
                className={cn(
                  "rounded-lg border border-border bg-muted/40 p-3 transition-colors",
                  isCut && "border-emerald-500 bg-emerald-500/10",
                )}
              >
                {/* Header row: ordinal + current color label */}
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {ORDINAL[wire.id - 1]} wire
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {wireColorLabel(wire)}
                  </span>
                </div>

                {/* Wire visual: terminals + bar */}
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="h-3 w-3 shrink-0 rounded-full bg-muted-foreground/30 ring-2 ring-muted-foreground/20"
                  />
                  <div
                    className={cn(
                      "relative h-7 flex-1 rounded-full transition-all",
                      wireGradient(wire),
                    )}
                  >
                    {isCut && (
                      <span
                        className="absolute inset-0 flex items-center justify-center"
                        aria-label="Cut this wire"
                      >
                        <span className="flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          <Scissors className="h-3 w-3" aria-hidden />
                          CUT
                        </span>
                      </span>
                    )}
                  </div>
                  <span
                    aria-hidden
                    className="h-3 w-3 shrink-0 rounded-full bg-muted-foreground/30 ring-2 ring-muted-foreground/20"
                  />
                </div>

                {/* Attribute toggles: Red / Blue / LED / Star */}
                <div className="mt-2 grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => updateWire(wire.id, "red", !wire.red)}
                    disabled={isSolved || isLoading}
                    aria-pressed={wire.red}
                    aria-label={`Toggle red on ${ORDINAL[wire.id - 1]} wire`}
                    className={cn(
                      "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border text-xs font-medium transition-colors",
                      wire.red
                        ? "border-red-500 bg-red-500/15 text-red-700 dark:text-red-400"
                        : "border-border bg-background text-muted-foreground hover:text-foreground",
                      (isSolved || isLoading) && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "h-3 w-3 rounded-full",
                        wire.red ? "bg-red-500" : "bg-muted-foreground/30",
                      )}
                    />
                    Red
                  </button>
                  <button
                    type="button"
                    onClick={() => updateWire(wire.id, "blue", !wire.blue)}
                    disabled={isSolved || isLoading}
                    aria-pressed={wire.blue}
                    aria-label={`Toggle blue on ${ORDINAL[wire.id - 1]} wire`}
                    className={cn(
                      "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border text-xs font-medium transition-colors",
                      wire.blue
                        ? "border-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-400"
                        : "border-border bg-background text-muted-foreground hover:text-foreground",
                      (isSolved || isLoading) && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "h-3 w-3 rounded-full",
                        wire.blue ? "bg-blue-500" : "bg-muted-foreground/30",
                      )}
                    />
                    Blue
                  </button>
                  <button
                    type="button"
                    onClick={() => updateWire(wire.id, "led", !wire.led)}
                    disabled={isSolved || isLoading}
                    aria-pressed={wire.led}
                    aria-label={`Toggle LED on ${ORDINAL[wire.id - 1]} wire`}
                    className={cn(
                      "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border text-xs font-medium transition-colors",
                      wire.led
                        ? "border-amber-400 bg-amber-400 text-amber-950 shadow"
                        : "border-border bg-background text-muted-foreground hover:text-foreground",
                      (isSolved || isLoading) && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <Lightbulb className="h-3.5 w-3.5" aria-hidden />
                    LED
                  </button>
                  <button
                    type="button"
                    onClick={() => updateWire(wire.id, "star", !wire.star)}
                    disabled={isSolved || isLoading}
                    aria-pressed={wire.star}
                    aria-label={`Toggle star on ${ORDINAL[wire.id - 1]} wire`}
                    className={cn(
                      "inline-flex h-8 items-center justify-center gap-1.5 rounded-md border text-xs font-medium transition-colors",
                      wire.star
                        ? "border-fuchsia-500 bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-400"
                        : "border-border bg-background text-muted-foreground hover:text-foreground",
                      (isSolved || isLoading) && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <Star
                      className={cn("h-3.5 w-3.5", wire.star && "fill-current")}
                      aria-hidden
                    />
                    Star
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={wireCount === 0}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Solve wires"
      />

      <ErrorAlert error={error} />

      {isSolved && (
        <SolverResult
          variant={solution.length === 0 ? "warning" : "success"}
          title={solution.length === 0 ? "No wires to cut" : "Cut these wires"}
          description={resultDescription}
        />
      )}

      {twitchCommands.length > 0 && (
        <TwitchCommandDisplay command={twitchCommands.join(", ")} />
      )}

      <SolverInstructions>
        Toggle each wire's attributes: <strong>Red</strong>/<strong>Blue</strong> color (a wire can
        be both), <strong>LED</strong> above, and <strong>Star</strong> below.
      </SolverInstructions>
    </SolverLayout>
  );
}
