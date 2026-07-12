import { useCallback, useMemo, useState } from "react";
import { solveRockPaperScissorsLizardSpock, type RockPaperScissorsLizardSpockOutput, type RpslsSign } from "../../services/rockPaperScissorsLizardSpockService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { Button } from "../ui/button";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const SIGNS: RpslsSign[] = ["ROCK", "PAPER", "SCISSORS", "LIZARD", "SPOCK"];
const LABELS: Record<RpslsSign, string> = { ROCK: "Rock", PAPER: "Paper", SCISSORS: "Scissors", LIZARD: "Lizard", SPOCK: "Spock" };

export default function RockPaperScissorsLizardSpockSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [decoy, setDecoy] = useState<RpslsSign | null>(null);
  const [result, setResult] = useState<RockPaperScissorsLizardSpockOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ decoy, result, twitchCommand }), [decoy, result, twitchCommand]);

  useSolverModulePersistence<typeof moduleState, RockPaperScissorsLizardSpockOutput>({
    state: moduleState,
    onRestoreState: useCallback((state) => {
      if (state.decoy === null || SIGNS.includes(state.decoy)) setDecoy(state.decoy);
      if (state.result) setResult(state.result);
      if (state.twitchCommand) setTwitchCommand(state.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: RockPaperScissorsLizardSpockOutput) => {
      setResult(solution);
      setTwitchCommand(`press ${solution.signsToPress.map((sign) => sign.toLowerCase()).join(" ")}`);
    }, []),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveRockPaperScissorsLizardSpock(round.id, bomb.id, currentModule.id, decoy);
      const command = `press ${response.output.signsToPress.map((sign) => sign.toLowerCase()).join(" ")}`;
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { decoy, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Rock-Paper-Scissors-Lizard-Spock"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, decoy, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => { setDecoy(null); setResult(null); setTwitchCommand(""); resetSolverState(); }, [resetSolverState]);
  const chooseDecoy = (value: RpslsSign | null) => { setDecoy(value); setResult(null); setTwitchCommand(""); clearError(); };

  return <SolverLayout>
    <SolverSection title="Decoy sign" description="Choose the sign in the middle. If the signs form a regular pentagon, choose None.">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Decoy sign">
        <Button type="button" role="radio" aria-checked={decoy === null} variant={decoy === null ? "default" : "outline"} onClick={() => chooseDecoy(null)} disabled={isLoading || isSolved}>None</Button>
        {SIGNS.map((sign) => <Button key={sign} type="button" role="radio" aria-checked={decoy === sign} variant={decoy === sign ? "default" : "outline"} onClick={() => chooseDecoy(sign)} disabled={isLoading || isSolved}>{LABELS[sign]}</Button>)}
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find signs" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Press these signs" className="border-emerald-500/40">
      <div className="flex flex-wrap justify-center gap-2">{result.signsToPress.map((sign) => <span key={sign} className="rounded-md border-2 border-emerald-500 bg-emerald-500/15 px-3 py-2 font-bold text-emerald-700 dark:text-emerald-400">{LABELS[sign]}</span>)}</div>
      <p className="mt-3 text-center text-sm text-muted-foreground">{result.targetSign ? `${result.scoringRule}: beat ${LABELS[result.targetSign]}` : "No scoring row applied; press every non-decoy sign."}</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>The decoy is the centered sign, or the middle sign in any line of three. The solver uses the bomb's recorded serial number, ports, and indicators.</SolverInstructions>
  </SolverLayout>;
}
