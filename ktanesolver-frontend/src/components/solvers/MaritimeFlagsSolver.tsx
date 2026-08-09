import { useCallback, useMemo, useState } from "react";
import { solveMaritimeFlags, type MaritimeFlagsInput, type MaritimeFlagsOutput } from "../../services/maritimeFlagsService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

type SavedState = Partial<MaritimeFlagsInput> & { input?: Partial<MaritimeFlagsInput>; result?: MaritimeFlagsOutput | null; twitchCommand?: string };

export default function MaritimeFlagsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [callsign, setCallsign] = useState("");
  const [signalledBearing, setSignalledBearing] = useState(0);
  const [result, setResult] = useState<MaritimeFlagsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ callsign, signalledBearing, result, twitchCommand }),
    [callsign, signalledBearing, result, twitchCommand]);

  useSolverModulePersistence<SavedState, MaritimeFlagsOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      const input = saved.input ?? saved;
      if (input.callsign) setCallsign(input.callsign);
      if (input.signalledBearing !== undefined) setSignalledBearing(input.signalledBearing);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: MaritimeFlagsOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.MARITIME_FLAGS, result: solution }));
    }, []),
    currentModule,
    setIsSolved,
  });

  const clearResult = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    const input: MaritimeFlagsInput = { callsign: callsign.trim().toUpperCase(), signalledBearing };
    clearError(); setIsLoading(true);
    try {
      const response = await solveMaritimeFlags(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.MARITIME_FLAGS, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Maritime Flags"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setCallsign(""); setSignalledBearing(0); setResult(null); setTwitchCommand(""); resetSolverState(); };

  return <SolverLayout>
    <SolverSection title="Decoded flag messages" description="Apply repeater flags, then enter the seven-character callsign and separate 0–359 bearing.">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Callsign
          <input aria-label="Decoded callsign" value={callsign} onChange={(event) => { setCallsign(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7)); clearResult(); }} disabled={isLoading || isSolved} maxLength={7} placeholder="CAPTAIN" className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3 font-mono uppercase" />
        </label>
        <label className="text-sm font-medium">Signalled bearing
          <input aria-label="Signalled bearing" type="number" min={0} max={359} value={signalledBearing} onChange={(event) => { setSignalledBearing(Number(event.target.value)); clearResult(); }} disabled={isLoading || isSolved} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3" />
        </label>
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Calculate direction" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Compass direction" className="border-emerald-500/40">
      <p className="text-center text-4xl font-bold">{result.direction}</p>
      <p className="mt-2 text-center text-sm text-muted-foreground">{signalledBearing} + {result.callsignBearing} = {result.finalBearing}°</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Click the compass until the red needle points to the generated direction, then leave it untouched for about five seconds to submit.</SolverInstructions>
  </SolverLayout>;
}
