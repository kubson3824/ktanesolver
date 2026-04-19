import { useCallback, useMemo, useState } from "react";
import { Lightbulb, RotateCw } from "lucide-react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveKnob } from "../../services/knobsService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import { Alert } from "../ui/alert";
import { cn } from "../../lib/cn";

interface KnobsSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function KnobsSolver({ bomb }: KnobsSolverProps) {
  const [indicators, setIndicators] = useState<boolean[]>(Array(12).fill(false));
  const [result, setResult] = useState<string>("");
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

  const moduleState = useMemo(
    () => ({ indicators, result, twitchCommand }),
    [indicators, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: { indicators?: boolean[]; result?: string; twitchCommand?: string }) => {
      if (state.indicators && Array.isArray(state.indicators)) setIndicators(state.indicators);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback((solution: { position: string }) => {
    if (!solution?.position) return;
    const display =
      solution.position === "Unknown configuration"
        ? solution.position
        : `Turn knob ${solution.position}`;
    setResult(display);
    setTwitchCommand(
      generateTwitchCommand({
        moduleType: ModuleType.KNOBS,
        result: { position: solution.position },
      }),
    );
  }, []);

  useSolverModulePersistence<
    { indicators: boolean[]; result: string; twitchCommand: string },
    { position: string }
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; position?: unknown };
        if (anyRaw.output && typeof anyRaw.output === "object")
          return anyRaw.output as { position: string };
        if (typeof anyRaw.position === "string") return { position: anyRaw.position };
      }
      return null;
    },
    inferSolved: (_sol, currentModule) =>
      Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const toggleIndicator = (index: number) => {
    if (isSolved) return;
    const next = [...indicators];
    next[index] = !next[index];
    setIndicators(next);
    setResult("");
    setTwitchCommand("");
    clearError();
  };

  const handleSolve = async () => {
    if (isSolved) return;
    clearError();
    setIsLoading(true);
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      setIsLoading(false);
      return;
    }
    try {
      const response = await solveKnob(round.id, bomb.id, currentModule.id, { indicators });
      const position = response.position;
      setResult(position === "Unknown configuration" ? position : `Turn knob ${position}`);
      setIsSolved(true);
      setTwitchCommand(
        generateTwitchCommand({
          moduleType: ModuleType.KNOBS,
          result: { position },
        }),
      );
      markModuleSolved(bomb.id, currentModule.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve module");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIndicators(Array(12).fill(false));
    setResult("");
    setTwitchCommand("");
    resetSolverState();
  };

  const anyLit = indicators.some(Boolean);
  const isUnknown = result.includes("Unknown");

  return (
    <SolverLayout>
      <SolverSection
        title="Indicators"
        description="Toggle the indicators that are lit on the module. The knob has 6 rows of 2 LEDs each."
      >
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Indicator LEDs">
          {indicators.map((lit, index) => (
            <button
              key={index}
              type="button"
              onClick={() => toggleIndicator(index)}
              disabled={isSolved}
              aria-pressed={lit}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                lit
                  ? "border-amber-400 bg-amber-400/15 text-foreground"
                  : "border-border bg-muted/40 text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                isSolved && "cursor-not-allowed opacity-60",
              )}
            >
              <Lightbulb
                className={cn(
                  "h-4 w-4 shrink-0",
                  lit ? "text-amber-400 fill-amber-400/60" : "text-muted-foreground",
                )}
                aria-hidden
              />
              <span className="font-mono">LED {index + 1}</span>
            </button>
          ))}
        </div>
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={handleReset}
        isSolveDisabled={!anyLit}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Solve"
      />

      <ErrorAlert error={error} />

      {result &&
        (isUnknown ? (
          <Alert variant="warning" className="flex items-center gap-2">
            <span className="font-semibold">{result}</span>
          </Alert>
        ) : (
          <Alert variant="success" className="flex items-center gap-2">
            <RotateCw className="h-4 w-4 shrink-0" aria-hidden />
            <span className="font-semibold">{result}</span>
          </Alert>
        ))}

      <TwitchCommandDisplay command={twitchCommand} />

      <SolverInstructions>
        Select every indicator LED that is currently lit on the module, then
        press Solve.
      </SolverInstructions>
    </SolverLayout>
  );
}
