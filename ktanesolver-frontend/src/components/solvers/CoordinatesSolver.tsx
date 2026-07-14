import { useCallback, useMemo, useState } from "react";

import { solveCoordinates, type CoordinatesOutput } from "../../services/coordinatesService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverSection,
  TwitchCommandDisplay,
  useSolver,
  useSolverModulePersistence,
} from "../common";
import { Input } from "../ui/input";

const emptyClues = () => Array<string>(9).fill("");

export default function CoordinatesSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [clues, setClues] = useState(emptyClues);
  const [result, setResult] = useState<CoordinatesOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const complete = clues.every((clue) => clue.trim());
  const moduleState = useMemo(() => ({ clues, result, twitchCommand }), [clues, result, twitchCommand]);

  useSolverModulePersistence<typeof moduleState | { input?: { clues?: string[] } }, CoordinatesOutput>({
    state: moduleState,
    onRestoreState: useCallback((state) => {
      if ("input" in state && state.input?.clues) setClues(state.input.clues);
      else if ("clues" in state && state.clues) setClues(state.clues);
      if ("result" in state && state.result) setResult(state.result);
      if ("twitchCommand" in state && state.twitchCommand) setTwitchCommand(state.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: CoordinatesOutput) => {
      if (!solution?.matchingClues) return;
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.COORDINATES, result: solution }));
    }, []),
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as CoordinatesOutput & { output?: CoordinatesOutput };
      return value.output ?? (value.matchingClues ? value : null);
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const changeClue = (index: number, value: string) => {
    setClues((old) => old.map((clue, i) => i === index ? value : clue));
    setResult(null);
    setTwitchCommand("");
    clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!complete) return setError("Enter all 9 clues");
    clearError();
    setIsLoading(true);
    try {
      const response = await solveCoordinates(round.id, bomb.id, currentModule.id, clues);
      const command = generateTwitchCommand({ moduleType: ModuleType.COORDINATES, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { clues, result: response.output, twitchCommand: command },
        response.output,
        true,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Coordinates");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, complete, clues, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setClues(emptyClues());
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Clues" description="Cycle through the module and enter all nine clues in any order.">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {clues.map((clue, index) => <Input
          key={index}
          value={clue}
          onChange={(event) => changeClue(index, event.target.value)}
          placeholder={index === 0 ? "e.g. 5×4" : index === 1 ? "e.g. [2,3]" : `Clue ${index + 1}`}
          aria-label={`Clue ${index + 1}`}
          autoComplete="off"
          disabled={isLoading || isSolved}
          className="font-mono"
        />)}
      </div>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={!complete} />
    <ErrorAlert error={error} />

    {result && <SolverSection title={`Matching clues on the ${result.width} × ${result.height} grid`} className="border-emerald-500/40">
      <div className="grid gap-3 sm:grid-cols-2">
        {result.matchingClues.map((clue, index) => <div key={`${clue}-${index}`} className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-center">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Submit {index + 1}</div>
          <div className="mt-1 whitespace-pre-line font-mono text-xl font-bold text-emerald-700 dark:text-emerald-300">{clue}</div>
        </div>)}
      </div>
    </SolverSection>}

    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Enter the displayed notation exactly; ordinary x is accepted in place of ×, and line breaks in word clues may be typed as spaces.</SolverInstructions>
  </SolverLayout>;
}
