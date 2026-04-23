import { useCallback, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  solveCombinationLock,
  type CombinationLockInput,
  type CombinationLockOutput,
} from "../../services/combinationLockService";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverControls,
  SolverResult,
} from "../common";
import { cn } from "../../lib/cn";

interface CombinationLockSolverProps {
  bomb: BombEntity | null | undefined;
}

function DialDisplay({ value, direction, label }: { value: number; direction: "R" | "L"; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-muted/40">
        <span className="font-mono text-2xl font-bold tabular-nums text-foreground">{value}</span>
        <span
          className={cn(
            "absolute -top-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
            direction === "R"
              ? "bg-blue-500 text-white"
              : "bg-fuchsia-500 text-white",
          )}
        >
          {direction === "R" ? "RIGHT" : "LEFT"}
        </span>
      </div>
    </div>
  );
}

export default function CombinationLockSolver({ bomb }: CombinationLockSolverProps) {
  const [result, setResult] = useState<CombinationLockOutput | null>(null);
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

  const moduleState = useMemo(() => ({}), []);
  const onRestoreState = useCallback(() => {}, []);

  const onRestoreSolution = useCallback((solution: CombinationLockOutput) => {
    if (!solution?.instruction) return;

    setResult(solution);

    const command = generateTwitchCommand({
      moduleType: ModuleType.COMBINATION_LOCK,
      result: {
        combination: [solution.firstNumber, solution.secondNumber, solution.thirdNumber],
        instruction: solution.instruction,
      },
    });
    setTwitchCommand(command);
  }, []);

  useSolverModulePersistence<Record<string, never>, CombinationLockOutput>({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    persistState: false,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown };
        if (anyRaw.output && typeof anyRaw.output === "object")
          return anyRaw.output as CombinationLockOutput;
        return raw as CombinationLockOutput;
      }
      return null;
    },
    inferSolved: (_sol, currentModule) =>
      Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solveCombinationLockModule = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const input: CombinationLockInput = {};

      const response = await solveCombinationLock(round.id, bomb.id, currentModule.id, { input });

      setResult(response.output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);

      const command = generateTwitchCommand({
        moduleType: ModuleType.COMBINATION_LOCK,
        result: response.output,
      });
      setTwitchCommand(command);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve combination lock module");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  return (
    <SolverLayout>
      <SolverSection
        title="Combination Lock"
        description="The combination is derived from bomb edgework — no module input needed. Hit Solve."
      >
        {result ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-end justify-center gap-3 sm:gap-4">
              <DialDisplay value={result.firstNumber} direction="R" label="1st" />
              <ArrowRight className="mb-4 h-5 w-5 text-muted-foreground" aria-hidden />
              <DialDisplay value={result.secondNumber} direction="L" label="2nd" />
              <ArrowRight className="mb-4 h-5 w-5 text-muted-foreground" aria-hidden />
              <DialDisplay value={result.thirdNumber} direction="R" label="3rd" />
            </div>
            <p className="text-center font-mono text-base font-semibold tabular-nums text-foreground">
              {result.firstNumber} → {result.secondNumber} → {result.thirdNumber}
            </p>
          </div>
        ) : (
          <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
            The combination will appear here after solving.
          </div>
        )}
      </SolverSection>

      <SolverControls
        onSolve={solveCombinationLockModule}
        onReset={reset}
        isSolveDisabled={isSolved}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Solve"
      />

      <ErrorAlert error={error} />

      {result && (
        <SolverResult
          variant="success"
          title="Combination found"
          description={result.instruction}
        />
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        Turn the dial <strong>RIGHT</strong> to the 1st number, <strong>LEFT</strong> to the 2nd,
        <strong> RIGHT</strong> to the 3rd. If consecutive numbers match, make a full revolution
        past them before stopping.
      </SolverInstructions>
    </SolverLayout>
  );
}
