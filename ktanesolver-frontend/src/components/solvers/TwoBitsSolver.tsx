import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  solveTwoBits,
  type TwoBitsInput,
  type TwoBitsOutput,
} from "../../services/twoBitsService";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  StageIndicator,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverResult,
} from "../common";
import { Input } from "../ui/input";

interface TwoBitsSolverProps {
  bomb: BombEntity | null | undefined;
}

const STAGE_LABELS: Record<number, string> = {
  1: "Calculate",
  2: "Enter number",
  3: "Enter number",
  4: "Submit",
};

export default function TwoBitsSolver({ bomb }: TwoBitsSolverProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [inputNumber, setInputNumber] = useState("");
  const [result, setResult] = useState<TwoBitsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const {
    isLoading,
    error,
    isSolved,
    clearError,
    reset,
    setIsLoading,
    setError,
    setIsSolved,
    currentModule,
    round,
    markModuleSolved,
  } = useSolver();

  const moduleState = useMemo(
    () => ({ currentStage, inputNumber, result, twitchCommand }),
    [currentStage, inputNumber, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      currentStage?: number;
      inputNumber?: string;
      result?: TwoBitsOutput | null;
      twitchCommand?: string;
    }) => {
      const stageToRestore =
        state.currentStage != null && state.currentStage >= 1 && state.currentStage <= 4
          ? state.currentStage
          : undefined;

      if (stageToRestore != null) setCurrentStage(stageToRestore);
      if (state.inputNumber !== undefined) setInputNumber(state.inputNumber);
      if (stageToRestore != null && state.result) setResult(state.result);
      if (currentModule?.solved && state.twitchCommand) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (solution: TwoBitsOutput) => {
      setResult(solution);

      const command = generateTwitchCommand({
        moduleType: ModuleType.TWO_BITS,
        result: solution,
      });
      setTwitchCommand(command);

      const solved = Boolean(currentModule?.solved);
      if (solved) {
        setCurrentStage(4);
        return;
      }
      const completed = solution.stages?.length;
      if (typeof completed === "number") {
        setCurrentStage(Math.min(4, Math.max(1, completed + 1)));
      }
    },
    [currentModule?.solved],
  );

  useSolverModulePersistence<
    {
      currentStage: number;
      inputNumber: string;
      result: TwoBitsOutput | null;
      twitchCommand: string;
    },
    TwoBitsOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const o = raw as TwoBitsOutput;
      if (typeof o.letters !== "string" || o.letters.length === 0) return null;
      return o;
    },
    inferSolved: (_sol, currentModule) =>
      Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solveTwoBitsModule = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const input: TwoBitsInput = {
        stage: currentStage,
        number: currentStage === 1 ? 0 : parseInt(inputNumber) || 0,
      };

      const response = await solveTwoBits(round.id, bomb.id, currentModule.id, { input });

      setResult(response.output);
      const command = generateTwitchCommand({
        moduleType: ModuleType.TWO_BITS,
        result: response.output,
      });
      setTwitchCommand(command);

      if (response.solved) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
      } else {
        setCurrentStage(currentStage + 1);
      }
      setInputNumber("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve module");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNumberChange = (value: string) => {
    const num = parseInt(value);
    if (value === "" || (num >= 0 && num <= 99)) {
      setInputNumber(value);
      clearError();
    }
  };

  const resetModule = () => {
    setCurrentStage(1);
    setInputNumber("");
    setResult(null);
    setTwitchCommand("");
    reset();
  };

  const disabled = isLoading || isSolved;
  const stageIsAutomatic = currentStage === 1;
  const canSolve = stageIsAutomatic || inputNumber.trim().length > 0;

  return (
    <SolverLayout>
      <SolverSection
        title="Stage progress"
        description={
          isSolved
            ? "All 4 steps complete."
            : `Currently on stage ${currentStage}: ${STAGE_LABELS[currentStage] ?? ""}`
        }
      >
        <StageIndicator
          total={4}
          current={isSolved ? 5 : currentStage}
          completedThrough={isSolved ? 4 : currentStage - 1}
        />
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[1, 2, 3, 4].map((step) => {
            const isDone = step < currentStage || isSolved;
            const isCurrent = step === currentStage && !isSolved;
            return (
              <div
                key={step}
                className={
                  isCurrent
                    ? "flex flex-col items-center rounded-md border border-accent bg-accent/10 px-2 py-2 text-center"
                    : isDone
                      ? "flex flex-col items-center rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-2 text-center"
                      : "flex flex-col items-center rounded-md border border-border bg-muted/20 px-2 py-2 text-center"
                }
              >
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                  Stage {step}
                </span>
                <span className="text-xs font-medium text-foreground">
                  {STAGE_LABELS[step]}
                </span>
              </div>
            );
          })}
        </div>
      </SolverSection>

      {!isSolved && (
        <SolverSection
          title={stageIsAutomatic ? "Stage 1 input" : "Module display"}
          description={
            stageIsAutomatic
              ? "Stage 1 derives its number from bomb edgework (serial letter, batteries, ports). Just press Calculate."
              : `Enter the two-digit number currently on the module for stage ${currentStage}.`
          }
        >
          {stageIsAutomatic ? (
            <p className="rounded-md border border-border bg-muted/20 px-3 py-3 text-center text-sm text-muted-foreground">
              No input required — press Calculate Stage 1 below.
            </p>
          ) : (
            <Input
              type="number"
              min={0}
              max={99}
              value={inputNumber}
              onChange={(e) => handleNumberChange(e.target.value)}
              placeholder="00"
              disabled={disabled}
              aria-label={`Stage ${currentStage} number`}
              className="mx-auto block w-full max-w-sm text-center font-mono text-3xl tracking-widest"
            />
          )}
        </SolverSection>
      )}

      <SolverControls
        onSolve={solveTwoBitsModule}
        onReset={resetModule}
        isSolveDisabled={!canSolve}
        isSolved={isSolved}
        isLoading={isLoading}
        solveButtonText={
          stageIsAutomatic ? "Calculate stage 1" : `Solve stage ${currentStage}`
        }
      />

      <ErrorAlert error={error} />

      {isSolved && <SolverResult variant="success" title="Module solved!" />}

      {result?.stages && result.stages.length > 0 && (
        <SolverSection title="Stage history">
          <ul className="space-y-1.5">
            {result.stages.map((stage, index) => (
              <li
                key={index}
                className="flex items-center justify-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-1.5 font-mono text-sm"
              >
                <span className="text-muted-foreground">Stage {index + 1}:</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {stage.number}
                </span>
                <span aria-hidden className="text-muted-foreground">
                  →
                </span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {stage.letters}
                </span>
              </li>
            ))}
          </ul>
        </SolverSection>
      )}

      {result && (
        <SolverSection title="Solution" className="border-emerald-500/40">
          <p className="break-all text-center font-mono text-3xl font-semibold text-emerald-700 dark:text-emerald-400 md:text-4xl">
            {result.letters}
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Type these letters, then {result.stages?.length === 4 ? "submit" : "query"}.
          </p>
        </SolverSection>
      )}

      {isSolved && twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        Stage 1 calculates the initial query. Enter each of the module’s three response
        numbers in stages 2–4; query the first three letter pairs and submit the fourth.
      </SolverInstructions>
    </SolverLayout>
  );
}
