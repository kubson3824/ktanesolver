import { useCallback, useMemo, useState } from "react";
import { Scissors, X } from "lucide-react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveWires as solveWiresApi } from "../../services/wiresService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SegmentedControl,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import { Alert } from "../ui/alert";
import { cn } from "../../lib/cn";

type WireColor = "RED" | "BLUE" | "BLACK" | "YELLOW" | "WHITE";

interface WireSolverProps {
  bomb: BombEntity | null | undefined;
}

interface ColorSpec {
  color: WireColor;
  label: string;
  swatch: string; // tailwind bg for swatch/button
  wire: string; // tailwind bg for the wire bar (slight gradient feel)
  onColor: string; // text color to use on top of this color
}

const COLORS: readonly ColorSpec[] = [
  {
    color: "RED",
    label: "Red",
    swatch: "bg-red-500",
    wire: "bg-gradient-to-r from-red-600 to-red-500",
    onColor: "text-white",
  },
  {
    color: "BLUE",
    label: "Blue",
    swatch: "bg-blue-500",
    wire: "bg-gradient-to-r from-blue-600 to-blue-500",
    onColor: "text-white",
  },
  {
    color: "BLACK",
    label: "Black",
    swatch: "bg-neutral-900",
    wire: "bg-gradient-to-r from-neutral-900 to-neutral-700",
    onColor: "text-white",
  },
  {
    color: "YELLOW",
    label: "Yellow",
    swatch: "bg-yellow-400",
    wire: "bg-gradient-to-r from-yellow-500 to-yellow-400",
    onColor: "text-neutral-900",
  },
  {
    color: "WHITE",
    label: "White",
    swatch: "bg-white border border-border",
    wire: "bg-gradient-to-r from-neutral-100 to-white border border-border",
    onColor: "text-neutral-900",
  },
] as const;

const WIRE_COUNT_OPTIONS = [
  { value: 3, label: "3 wires" },
  { value: 4, label: "4 wires" },
  { value: 5, label: "5 wires" },
  { value: 6, label: "6 wires" },
] as const;

const ORDINAL = ["1st", "2nd", "3rd", "4th", "5th", "6th"];

function colorSpec(c: WireColor | null): ColorSpec | undefined {
  return c ? COLORS.find((s) => s.color === c) : undefined;
}

export default function WireSolver({ bomb }: WireSolverProps) {
  const [wireCount, setWireCount] = useState<number>(3);
  const [wires, setWires] = useState<(WireColor | null)[]>(
    Array(6).fill(null) as (WireColor | null)[],
  );
  const [result, setResult] = useState<string>("");
  const [wireToCut, setWireToCut] = useState<number>(-1);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

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

  const activeWires = wires.slice(0, wireCount);

  const moduleState = useMemo(
    () => ({ wireCount, wires, result, wireToCut, twitchCommand }),
    [wireCount, wires, result, wireToCut, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      wireCount?: number;
      wires?: (WireColor | null)[];
      result?: string;
      wireToCut?: number;
      twitchCommand?: string;
    }) => {
      if (typeof state.wireCount === "number") setWireCount(state.wireCount);
      if (state.wires && Array.isArray(state.wires)) {
        const padded = [...state.wires];
        while (padded.length < 6) padded.push(null);
        setWires(padded);
      }
      if (state.result !== undefined) setResult(state.result);
      if (state.wireToCut !== undefined) setWireToCut(state.wireToCut);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (solution: { instruction: string; wirePosition: number }) => {
      if (!solution) return;

      setResult(solution.instruction);
      setWireToCut(solution.wirePosition);

      const command = generateTwitchCommand({
        moduleType: ModuleType.WIRES,
        result: {
          instruction: solution.instruction,
          wirePosition: solution.wirePosition,
        },
      });
      setTwitchCommand(command);
    },
    [],
  );

  useSolverModulePersistence<
    {
      wireCount: number;
      wires: (WireColor | null)[];
      result: string;
      wireToCut: number;
      twitchCommand: string;
    },
    { instruction: string; wirePosition: number }
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as {
          output?: unknown;
          instruction?: unknown;
          wirePosition?: unknown;
        };
        if (anyRaw.output && typeof anyRaw.output === "object")
          return anyRaw.output as { instruction: string; wirePosition: number };
        if (
          typeof anyRaw.instruction === "string" &&
          typeof anyRaw.wirePosition === "number"
        ) {
          return {
            instruction: anyRaw.instruction,
            wirePosition: anyRaw.wirePosition,
          };
        }
      }
      return null;
    },
    inferSolved: (_sol, currentModule) =>
      Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const clearSolutionState = () => {
    setIsSolved(false);
    setResult("");
    setWireToCut(-1);
    setTwitchCommand("");
    setError("");
  };

  const setWire = (index: number, color: WireColor | null) => {
    const next = [...wires];
    next[index] = color;
    setWires(next);
    clearSolutionState();
  };

  const changeWireCount = (count: number) => {
    setWireCount(count);
    // Clear any wires that are now out of range.
    const next = [...wires];
    for (let i = count; i < next.length; i++) next[i] = null;
    setWires(next);
    clearSolutionState();
  };

  const solveWires = async () => {
    const filled = activeWires.filter((w): w is WireColor => w !== null);
    if (filled.length !== wireCount) {
      setError(`Set a color for all ${wireCount} wires.`);
      return;
    }
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveWiresApi(round.id, bomb.id, currentModule.id, {
        input: { wires: filled },
      });

      setResult(response.output.instruction);
      setWireToCut(response.output.wirePosition);
      setIsSolved(true);

      const command = generateTwitchCommand({
        moduleType: ModuleType.WIRES,
        result: response.output,
      });
      setTwitchCommand(command);

      markModuleSolved(bomb.id, currentModule.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve wires");
    } finally {
      setIsLoading(false);
    }
  };

  const allWiresFilled = activeWires.every((w) => w !== null);

  return (
    <SolverLayout>
      <SolverSection
        title="Wires"
        description="Pick each wire's color from top to bottom."
        actions={
          <SegmentedControl
            value={wireCount}
            onChange={(v) => changeWireCount(v as number)}
            options={WIRE_COUNT_OPTIONS}
            size="sm"
            ariaLabel="Number of wires"
            disabled={isSolved}
          />
        }
      >
        <ul className="space-y-2">
          {activeWires.map((wire, index) => {
            const spec = colorSpec(wire);
            const isCut = isSolved && wireToCut === index;
            return (
              <li
                key={index}
                className={cn(
                  "rounded-lg border border-border bg-muted/40 p-3 transition-colors",
                  isCut && "border-emerald-500 bg-emerald-500/10",
                )}
              >
                {/* Header row: ordinal + current color name */}
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {ORDINAL[index]} wire
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {spec ? spec.label : "—"}
                  </span>
                </div>

                {/* Wire visual: terminals + bar, full width */}
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="h-3 w-3 shrink-0 rounded-full bg-muted-foreground/30 ring-2 ring-muted-foreground/20"
                  />
                  <div
                    className={cn(
                      "relative h-7 flex-1 rounded-full transition-all",
                      spec
                        ? spec.wire
                        : "bg-muted border border-dashed border-border",
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
                    {!spec && !isCut && (
                      <span className="absolute inset-0 flex items-center justify-center text-[11px] text-muted-foreground">
                        No color
                      </span>
                    )}
                  </div>
                  <span
                    aria-hidden
                    className="h-3 w-3 shrink-0 rounded-full bg-muted-foreground/30 ring-2 ring-muted-foreground/20"
                  />
                </div>

                {/* Color palette: below the wire, full width, evenly spaced */}
                <div className="mt-2 flex items-center justify-between gap-1.5">
                  <div className="flex flex-1 items-center gap-1.5">
                    {COLORS.map((c) => {
                      const selected = wire === c.color;
                      return (
                        <button
                          key={c.color}
                          type="button"
                          onClick={() => setWire(index, c.color)}
                          disabled={isSolved}
                          aria-label={`Set ${ORDINAL[index]} wire to ${c.label}`}
                          aria-pressed={selected}
                          title={c.label}
                          className={cn(
                            "h-7 w-7 rounded-full transition-all",
                            c.swatch,
                            selected
                              ? "ring-2 ring-ring ring-offset-2 ring-offset-card"
                              : "opacity-70 hover:opacity-100",
                            isSolved && "cursor-not-allowed",
                          )}
                        />
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setWire(index, null)}
                    disabled={isSolved || wire === null}
                    aria-label={`Clear ${ORDINAL[index]} wire`}
                    title="Clear"
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors",
                      "hover:text-foreground hover:border-foreground/40",
                      "disabled:opacity-40 disabled:cursor-not-allowed",
                    )}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </SolverSection>

      <SolverControls
        onSolve={solveWires}
        onReset={resetSolverState}
        isSolveDisabled={!allWiresFilled}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Solve wires"
      />

      <ErrorAlert error={error} />

      {result && (
        <Alert
          variant="success"
          className="flex items-center gap-2"
          role="status"
          aria-live="polite"
        >
          <Scissors className="h-4 w-4 shrink-0" aria-hidden />
          <span className="font-semibold">{result}</span>
        </Alert>
      )}

      <TwitchCommandDisplay command={twitchCommand} />

      <SolverInstructions>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-medium text-foreground">Colors:</span>
          {COLORS.map((c) => (
            <span key={c.color} className="inline-flex items-center gap-1.5">
              <span className={cn("inline-block h-3 w-3 rounded-full", c.swatch)} />
              {c.label}
            </span>
          ))}
        </div>
      </SolverInstructions>
    </SolverLayout>
  );
}
