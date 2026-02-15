import { useCallback, useEffect, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveForgetMeNot as solveForgetMeNotApi } from "../../services/forgetMeNotService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { 
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverControls
} from "../common";

interface ForgetMeNotSolverProps {
  bomb: BombEntity | null | undefined;
}

interface Stage {
  display: number;
  calculated: number;
}

export default function ForgetMeNotSolver({ bomb }: ForgetMeNotSolverProps) {
  const [display, setDisplay] = useState<string>("");
  const [stage, setStage] = useState<number>(1);
  const [stages, setStages] = useState<Stage[]>([]);
  const [sequence, setSequence] = useState<number[]>([]);
  const [showSequence, setShowSequence] = useState<boolean>(false);
  const [allModulesCompleted, setAllModulesCompleted] = useState<boolean>(false);
  const [twitchCommand, setTwitchCommand] = useState<string>("");
  const [reminderShown, setReminderShown] = useState<boolean>(false);

  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();

  // Show reminder when component mounts
  useEffect(() => {
    if (!reminderShown) {
      setReminderShown(true);
    }
  }, [reminderShown]);

  const moduleState = useMemo(
    () => ({ display, stage, stages, sequence, showSequence, allModulesCompleted, twitchCommand }),
    [display, stage, stages, sequence, showSequence, allModulesCompleted, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      display?: string;
      stage?: number;
      stages?: Stage[];
      sequence?: number[];
      showSequence?: boolean;
      allModulesCompleted?: boolean;
      twitchCommand?: string;
      displayNumbers?: number[];
      calculatedNumbers?: number[];
    }) => {
      if (state.display !== undefined) setDisplay(state.display);
      if (state.stage !== undefined) setStage(state.stage);
      if (state.showSequence !== undefined) setShowSequence(state.showSequence);
      if (state.allModulesCompleted !== undefined) setAllModulesCompleted(state.allModulesCompleted);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);

      if (state.stages && Array.isArray(state.stages)) {
        setStages(state.stages);
      }
      if (state.sequence && Array.isArray(state.sequence)) {
        setSequence(state.sequence);
      }

      if (
        (!state.stages || state.stages.length === 0) &&
        Array.isArray(state.displayNumbers) &&
        Array.isArray(state.calculatedNumbers) &&
        state.displayNumbers.length > 0
      ) {
        const restoredStages: Stage[] = state.displayNumbers.map((d, index) => ({
          display: d,
          calculated: state.calculatedNumbers[index] ?? 0,
        }));
        setStages(restoredStages);
        setSequence(state.calculatedNumbers);
        setStage(state.displayNumbers.length + 1);
      }
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (solution: { sequence: number[] } | number[]) => {
      const seq = Array.isArray(solution) ? solution : solution.sequence;
      if (!seq || !Array.isArray(seq) || seq.length === 0) return;
      setSequence(seq);
      setShowSequence(true);
      setAllModulesCompleted(true);
      setTwitchCommand(
        generateTwitchCommand({
          moduleType: ModuleType.FORGET_ME_NOT,
          result: { sequence: seq },
        }),
      );
    },
  []);

  useSolverModulePersistence<
    {
      display: string;
      stage: number;
      stages: Stage[];
      sequence: number[];
      showSequence: boolean;
      allModulesCompleted: boolean;
      twitchCommand: string;
    },
    { sequence: number[] } | number[]
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; sequence?: unknown };
        if (anyRaw.output && typeof anyRaw.output === "object") return anyRaw.output as { sequence: number[] };
        if (Array.isArray(anyRaw.sequence)) return { sequence: anyRaw.sequence as number[] };
      }
      if (Array.isArray(raw)) return raw as number[];
      return null;
    },
    inferSolved: (_solution, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    onlyRestoreSolutionWhenSolved: true,
    currentModule,
    setIsSolved,
  });

  const handleSolve = async () => {
    const displayValue = parseInt(display);
    
    if (display === "" || isNaN(displayValue) || displayValue < 0 || displayValue > 9) {
      setError("Please enter a valid digit (0-9)");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveForgetMeNotApi(round.id, bomb.id, currentModule.id, {
        input: {
          display: displayValue,
          stage: stage,
          allModulesCompleted: allModulesCompleted
        }
      });

      const newSequence = response.output.sequence;
      const newStage: Stage = {
        display: displayValue,
        calculated: stage === 1 ? newSequence[0] : (stage > 1 ? newSequence[stage - 1] : 0)
      };

      setStages([...stages, newStage]);
      setSequence(newSequence);

      if (allModulesCompleted && displayValue === -1) {
        // All modules completed, show final sequence
        setShowSequence(true);
        setIsSolved(true);
        setTwitchCommand(generateTwitchCommand({
          moduleType: ModuleType.FORGET_ME_NOT,
          result: { sequence: newSequence },
        }));

        if (bomb?.id && currentModule?.id) {
          markModuleSolved(bomb.id, currentModule.id);
        }
      } else {
        // Move to next stage
        setStage(stage + 1);
        setDisplay("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Forget Me Not");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisplayChange = (value: string) => {
    // Only allow numbers and limit to 1 digit
    if (value === "" || (/^\d$/.test(value))) {
      setDisplay(value);
      if (error) clearError();
    }
  };

  const handleAllModulesCompleted = async () => {
    setAllModulesCompleted(true);
    setDisplay("-1");
    
    // Automatically trigger the solve with display -1
    await handleFinalSolve();
  };

  const handleFinalSolve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveForgetMeNotApi(round.id, bomb.id, currentModule.id, {
        input: {
          display: -1,
          stage: stage,
          allModulesCompleted: true
        }
      });

      const newSequence = response.output.sequence;
      setSequence(newSequence);
      setShowSequence(true);
      setIsSolved(true);
      setTwitchCommand(generateTwitchCommand({
        moduleType: ModuleType.FORGET_ME_NOT,
        result: { sequence: newSequence },
      }));

      if (bomb?.id && currentModule?.id) {
        markModuleSolved(bomb.id, currentModule.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get final sequence");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setDisplay("");
    setStage(1);
    setStages([]);
    setSequence([]);
    setShowSequence(false);
    setAllModulesCompleted(false);
    setTwitchCommand("");
    resetSolverState();
  };

  return (
    <SolverLayout>
      
      {/* Reminder alert */}
      {reminderShown && (
        <div className="alert alert-warning mb-4">
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <h3 className="font-bold">Reminder: Check Forget Me Not!</h3>
            <p className="text-sm">Don't forget to check the Forget Me Not module display and enter the number shown.</p>
          </div>
        </div>
      )}

      {/* Module visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <div className="flex justify-center mb-6">
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="text-center mb-2">
              <span className="text-sm text-gray-400">Stage {stage}</span>
            </div>
            <input
              type="text"
              value={display}
              onChange={(e) => handleDisplayChange(e.target.value)}
              placeholder="0"
              className="text-6xl font-mono font-bold text-green-400 bg-transparent text-center w-full outline-none"
              maxLength={1}
              disabled={isLoading || showSequence}
            />
          </div>
        </div>

        {/* Stage history */}
        {stages.length > 0 && (
          <div className="mt-6">
            {stages.length > 10 ? (
              <details className="group" defaultOpen={false}>
                <summary className="text-sm font-medium text-gray-400 cursor-pointer list-none flex items-center gap-1">
                  <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                  Stage history ({stages.length})
                </summary>
                <div className="mt-2 max-h-48 overflow-y-auto rounded border border-gray-600 p-2 space-y-0.5">
                  {stages.map((s, index) => (
                    <div key={index} className="flex justify-center gap-2 text-xs">
                      <span className="text-gray-500">{index + 1}:</span>
                      <span className="text-green-400">{s.display}</span>
                      <span className="text-gray-500">→</span>
                      <span className="text-blue-400">{s.calculated}</span>
                    </div>
                  ))}
                </div>
              </details>
            ) : (
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Stage history:</h4>
                <div className="max-h-48 overflow-y-auto rounded border border-gray-600 p-2 space-y-0.5">
                  {stages.map((s, index) => (
                    <div key={index} className="flex justify-center gap-2 text-xs">
                      <span className="text-gray-500">{index + 1}:</span>
                      <span className="text-green-400">{s.display}</span>
                      <span className="text-gray-500">→</span>
                      <span className="text-blue-400">{s.calculated}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Final sequence */}
        {showSequence && sequence.length > 0 && (
          <div className="mt-6 p-4 bg-green-900/30 rounded-lg border border-green-500">
            <h4 className="text-lg font-bold text-green-400 mb-2 text-center">Final Sequence</h4>
            <div className="grid grid-cols-10 gap-1 justify-center mx-auto w-fit">
              {sequence.map((num, index) => (
                <div
                  key={index}
                  className={`bg-green-500 rounded flex items-center justify-center text-white font-bold ${
                    sequence.length > 20 ? "w-7 h-7 text-sm" : "w-10 h-10 text-lg"
                  }`}
                >
                  {num}
                </div>
              ))}
            </div>
            <p className="text-sm text-green-300 mt-2 text-center">Press the numbers in this order!</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={!display || isSolved}
        isLoading={isLoading}
        solveText={allModulesCompleted ? "Get Sequence" : "Calculate Stage"}
        loadingText={allModulesCompleted ? "Getting Sequence..." : "Calculating..."}
      />

      {/* All modules completed button */}
      {!allModulesCompleted && stages.length > 0 && !isSolved && (
        <div className="mb-4">
          <button
            onClick={handleAllModulesCompleted}
            className="btn btn-secondary w-full"
            disabled={isLoading}
          >
            {isLoading ? <span className="loading loading-spinner loading-sm"></span> : ""}
            {isLoading ? "Getting Sequence..." : "All Modules Solved"}
          </button>
        </div>
      )}

      {/* Error */}
      <ErrorAlert error={error} />

      {/* Twitch Command */}
      <TwitchCommandDisplay command={twitchCommand} />

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p>Enter the digit shown on the Forget Me Not module display. Click "All Modules Solved" when all other modules are solved to get the final sequence.</p>
      </div>
    </SolverLayout>
  );
}
