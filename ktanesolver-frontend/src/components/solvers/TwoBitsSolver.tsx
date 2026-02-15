import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { solveTwoBits, type TwoBitsInput, type TwoBitsOutput } from "../../services/twoBitsService";
import SolverLayout from "../common/SolverLayout";
import SolverControls from "../common/SolverControls";
import ErrorAlert from "../common/ErrorAlert";
import TwitchCommandDisplay from "../common/TwitchCommandDisplay";
import { useSolver, useSolverModulePersistence } from "../common";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface TwoBitsSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function TwoBitsSolver({ bomb }: TwoBitsSolverProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [inputNumber, setInputNumber] = useState("");
  const [result, setResult] = useState<TwoBitsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const currentModule = useRoundStore((state) => state.currentModule);
  const { isLoading, error, isSolved, clearError, reset, setIsLoading, setError, setIsSolved, round, markModuleSolved } = useSolver();

  const moduleState = useMemo(
    () => ({ currentStage, inputNumber, result, twitchCommand }),
    [currentStage, inputNumber, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: { currentStage?: number; inputNumber?: string; result?: TwoBitsOutput; twitchCommand?: string }) => {
      // Never restore to stage 3 unless the module is actually solved (avoids stale/partial backend state)
      const canRestoreStage3 = state.currentStage === 3 && currentModule?.solved;
      const stageToRestore =
        state.currentStage != null && (state.currentStage <= 2 || canRestoreStage3)
          ? state.currentStage
          : undefined;

      if (stageToRestore != null) setCurrentStage(stageToRestore);
      if (state.inputNumber !== undefined) setInputNumber(state.inputNumber);
      if (stageToRestore != null && state.result) setResult(state.result);
      if (currentModule?.solved && state.twitchCommand) setTwitchCommand(state.twitchCommand);
    },
    [currentModule?.solved],
  );

  const onRestoreSolution = useCallback(
    (solution: TwoBitsOutput) => {
      setResult(solution);

      const command = generateTwitchCommand({
        moduleType: ModuleType.TWO_BITS,
        result: solution,
      });
      setTwitchCommand(command);

      setCurrentStage(3);
    },
  []);

  useSolverModulePersistence<
    { currentStage: number; inputNumber: string; result: TwoBitsOutput | null; twitchCommand: string },
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
    inferSolved: () => true,
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

  return (
    <SolverLayout>
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-base-content/70 text-sm font-medium">
            TWO BITS MODULE
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stage indicator: visible stages with labels */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-center text-base-content/50 text-xs font-medium uppercase tracking-wider">
              Current stage
            </p>
            <p className="text-4xl font-bold text-primary tabular-nums">
              {currentStage} / 3
            </p>
            <div className="flex w-full items-center justify-center gap-2 sm:gap-4">
              {[
                { step: 1, label: "Calculate" },
                { step: 2, label: "Enter number" },
                { step: 3, label: "Final" },
              ].map(({ step, label }) => (
                <div
                  key={step}
                  className={`flex flex-1 flex-col items-center rounded-lg border-2 px-3 py-2 transition-colors ${
                    step === currentStage
                      ? "border-primary bg-primary/10"
                      : step < currentStage
                        ? "border-base-300 bg-base-200/50"
                        : "border-base-200 bg-base-200/30"
                  }`}
                >
                  <span className="text-lg font-bold tabular-nums">{step}</span>
                  <span className="text-xs text-base-content/70">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-base-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStage / 3) * 100}%` }}
            />
          </div>

          {currentStage === 1 ? (
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
              <p className="text-sm text-center text-base-content/80">
                Stage 1 uses a number calculated from bomb properties (serial letter, batteries, ports).
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-base-content/80 mb-2">
                Number on the module (0–99)
              </label>
              <input
                type="number"
                min="0"
                max="99"
                value={inputNumber}
                onChange={(e) => handleNumberChange(e.target.value)}
                className="input input-bordered w-full max-w-md mx-auto block text-center text-2xl tracking-widest"
                placeholder="00"
                disabled={isLoading || isSolved}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <SolverControls
        onSolve={solveTwoBitsModule}
        onReset={resetModule}
        isSolved={isSolved}
        isLoading={isLoading}
        solveButtonText={currentStage === 1 ? "Calculate Stage 1" : `Solve Stage ${currentStage}`}
        showReset={isSolved}
      />

      <ErrorAlert error={error} />

      {isSolved && (
        <div className="alert alert-success mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Module Solved!</span>
        </div>
      )}

      {result?.stages && result.stages.length > 0 && (
        <Card className="mb-4 border-base-300/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-center text-base-content/70 text-sm font-medium">
              Stage history
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.stages.map((stage, index) => (
                <li
                  key={index}
                  className="flex items-center justify-center gap-2 text-base font-mono"
                >
                  <span className="text-base-content/70">Stage {index + 1}:</span>
                  <span className="font-semibold tabular-nums">{stage.number}</span>
                  <span className="text-base-content/50">→</span>
                  <span className="font-semibold text-primary">{stage.letters}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="mb-4 border-success/30 bg-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-center text-success text-sm font-medium">
              SOLUTION
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl md:text-4xl font-mono font-semibold text-center text-success break-all">
              {result.letters}
            </p>
          </CardContent>
        </Card>
      )}

      {isSolved && twitchCommand && (
        <TwitchCommandDisplay command={twitchCommand} />
      )}

      <Card className="mt-4 border-base-300/50">
        <CardContent className="pt-4">
          <p className="text-sm text-base-content/60 mb-2">
            Enter the number displayed on the Two Bits module for each stage.
          </p>
          <ul className="text-sm text-base-content/60 space-y-1 list-disc list-inside">
            <li>Stage 1 is calculated automatically from bomb properties</li>
            <li>For stages 2 and 3, enter the number shown on the module</li>
            <li>The solver will provide the corresponding letter sequence</li>
          </ul>
        </CardContent>
      </Card>
    </SolverLayout>
  );
}
