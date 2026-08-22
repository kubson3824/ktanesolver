import { useState } from "react";
import {
  SEVEN_DEADLY_SINS,
  solveSevenDeadlySins,
  type SevenDeadlySin,
  type SevenDeadlySinsOutput,
} from "../../services/sevenDeadlySinsService";
import type { BombEntity } from "../../types";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver,
} from "../common";

const label = (sin: SevenDeadlySin) => sin[0] + sin.slice(1).toLowerCase();

export default function SevenDeadlySinsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [sins, setSins] = useState<SevenDeadlySin[]>([...SEVEN_DEADLY_SINS]);
  const [result, setResult] = useState<SevenDeadlySinsOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolver, currentModule, round, markModuleSolved,
  } = useSolver();
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError();
    setIsLoading(true);
    try {
      const response = await solveSevenDeadlySins(round.id, bomb.id, currentModule.id, sins);
      setResult(response.output);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to solve Seven Deadly Sins");
    } finally {
      setIsLoading(false);
    }
  };
  const reset = () => { setSins([...SEVEN_DEADLY_SINS]); setResult(null); resetSolver(); };
  return <SolverLayout>
    <SolverSection title="Buttons clockwise from the top-left">
      <div className="grid gap-2 sm:grid-cols-2">
        {sins.map((sin, position) => <label key={position} className="flex items-center gap-2">
          <span className="w-24">Position {position + 1}</span>
          <select
            aria-label={`Position ${position + 1} sin`}
            value={sin}
            onChange={event => setSins(sins.map((value, index) => index === position ? event.target.value as SevenDeadlySin : value))}
            className="h-11 flex-1 rounded border bg-background px-2"
          >
            {SEVEN_DEADLY_SINS.map(option => <option key={option} value={option}>{label(option)}</option>)}
          </select>
        </label>)}
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved}/>
    <ErrorAlert error={error}/>
    {result && <SolverSection title="Press order">
      <p className="font-mono text-2xl">{result.pressPositions.map((position, index) => `${position} (${label(result.pressSequence[index])})`).join(" → ")}</p>
    </SolverSection>}
    {result && <TwitchCommandDisplay command={result.twitchCommand}/>}
    <SolverInstructions>Number the buttons 1–7 clockwise from the top-left and enter the sin shown on each button.</SolverInstructions>
  </SolverLayout>;
}
