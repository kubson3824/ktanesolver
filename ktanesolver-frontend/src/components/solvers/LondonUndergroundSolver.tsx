import { useCallback, useMemo, useState } from "react";
import { solveLondonUnderground, type LondonUndergroundAction, type LondonUndergroundOutput } from "../../services/londonUndergroundService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

export default function LondonUndergroundSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [result, setResult] = useState<LondonUndergroundOutput | null>(null);
  const [stage, setStage] = useState(0);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(
    () => ({ departure, destination, result, stage, twitchCommand }),
    [departure, destination, result, stage, twitchCommand],
  );

  useSolverModulePersistence<typeof state, LondonUndergroundOutput>({
    state,
    onRestoreState: useCallback((saved: Partial<typeof state>) => {
      if (saved.departure !== undefined) setDeparture(saved.departure);
      if (saved.destination !== undefined) setDestination(saved.destination);
      if (saved.result !== undefined) setResult(saved.result);
      if (saved.stage !== undefined) setStage(saved.stage);
      if (saved.twitchCommand !== undefined) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: LondonUndergroundOutput) => {
      setResult(solution.journey.length ? solution : null);
      setStage(solution.stage);
      setTwitchCommand(solution.journey.length
        ? generateTwitchCommand({ moduleType: ModuleType.LONDON_UNDERGROUND, result: solution })
        : "");
    }, []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const request = useCallback(async (action: LondonUndergroundAction) => {
    if (!round?.id || !bomb?.id || !currentModule?.id) throw new Error("Missing required information");
    return solveLondonUnderground(round.id, bomb.id, currentModule.id, { action, departure, destination });
  }, [round?.id, bomb?.id, currentModule?.id, departure, destination]);

  const solveStage = useCallback(async () => {
    clearError(); setIsLoading(true);
    try {
      const response = await request("SOLVE_STAGE");
      const command = generateTwitchCommand({ moduleType: ModuleType.LONDON_UNDERGROUND, result: response.output });
      const nextDeparture = response.solved ? departure : destination;
      const nextDestination = response.solved ? destination : "";
      setResult(response.output); setStage(response.output.stage); setTwitchCommand(command);
      setDeparture(nextDeparture); setDestination(nextDestination); setIsSolved(Boolean(response.solved));
      if (response.solved) markModuleSolved(bomb!.id, currentModule!.id);
      updateModuleAfterSolve(bomb!.id, currentModule!.id, {
        departure: nextDeparture, destination: nextDestination, result: response.output,
        stage: response.output.stage, twitchCommand: command,
      }, response.output, Boolean(response.solved));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve The London Underground"); }
    finally { setIsLoading(false); }
  }, [bomb, currentModule, departure, destination, clearError, markModuleSolved, request, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(async () => {
    clearError(); setIsLoading(true);
    try {
      await request("RESET");
      setDeparture(""); setDestination(""); setResult(null); setStage(0); setTwitchCommand(""); resetSolverState();
      updateModuleAfterSolve(bomb!.id, currentModule!.id, {
        departure: "", destination: "", result: null, stage: 0, twitchCommand: "",
      }, {}, false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to reset The London Underground"); }
    finally { setIsLoading(false); }
  }, [bomb, currentModule, clearError, request, resetSolverState, setError, setIsLoading, updateModuleAfterSolve]);

  const disabled = isLoading || isSolved;
  return <SolverLayout>
    <SolverSection title={`Journey ${Math.min(stage + 1, 3)} of 3`} description="Enter the two station names exactly as displayed on the module.">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium">Departure station
          <input type="text" value={departure} onChange={(event) => setDeparture(event.target.value)} disabled={disabled}
            className="block h-10 w-full rounded-md border border-input bg-background px-3" />
        </label>
        <label className="space-y-1.5 text-sm font-medium">Destination station
          <input type="text" value={destination} onChange={(event) => setDestination(event.target.value)} disabled={disabled}
            className="block h-10 w-full rounded-md border border-input bg-background px-3" />
        </label>
      </div>
    </SolverSection>
    <SolverControls onSolve={solveStage} onReset={reset} isLoading={isLoading} isSolved={isSolved}
      isSolveDisabled={!departure.trim() || !destination.trim()} solveText={`Solve journey ${Math.min(stage + 1, 3)}`} />
    <ErrorAlert error={error} />
    {result && <SolverSection title={`Journey ${result.stage}`} className="border-emerald-500/40">
      <ol className="space-y-2">
        {result.journey.map((leg, index) => <li key={`${leg.line}-${leg.station}`} className="rounded-md border bg-muted/30 p-3">
          <span className="font-semibold">{index + 1}. {leg.line}</span>
          <span className="block text-sm text-muted-foreground">Travel to {leg.station}</span>
        </li>)}
      </ol>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Set each used box from top to bottom, leave the remaining boxes blank, then press Underground. After a correct journey, the destination is prefilled as the next departure. Use Reset after a strike because the module returns to journey one.</SolverInstructions>
  </SolverLayout>;
}
