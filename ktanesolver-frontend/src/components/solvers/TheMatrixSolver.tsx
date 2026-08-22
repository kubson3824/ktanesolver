import { useState } from "react";
import { solveTheMatrix, type TheMatrixOutput } from "../../services/theMatrixService";
import type { BombEntity } from "../../types";
import { ErrorAlert, SolverControls, SolverLayout, SolverSection, useSolver } from "../common";

export default function TheMatrixSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [firstAccessCode, setFirstAccessCode] = useState("");
  const [secondAccessCode, setSecondAccessCode] = useState("");
  const [words, setWords] = useState(Array(6).fill(""));
  const [result, setResult] = useState<TheMatrixOutput | null>(null);
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, currentModule, round, markModuleSolved } = useSolver();
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    setIsLoading(true); clearError();
    try {
      const response = await solveTheMatrix(round.id, bomb.id, currentModule.id, { firstAccessCode, secondAccessCode, words });
      setResult(response.output); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve The Matrix"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setResult(null); setIsSolved(false); };
  return <SolverLayout>
    <SolverSection title="Access code"><div className="grid gap-3 sm:grid-cols-2">
      <label>First scrambled name<input value={firstAccessCode} onChange={e => setFirstAccessCode(e.target.value)} className="mt-1 block h-11 w-full rounded-md border bg-background px-3" /></label>
      <label>Second scrambled name<input value={secondAccessCode} onChange={e => setSecondAccessCode(e.target.value)} className="mt-1 block h-11 w-full rounded-md border bg-background px-3" /></label>
    </div></SolverSection>
    <SolverSection title="Displayed words"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{words.map((word, index) => <label key={index}>Word {index + 1}<input value={word} onChange={e => setWords(values => values.map((value, i) => i === index ? e.target.value : value))} className="mt-1 block h-11 w-full rounded-md border bg-background px-3" /></label>)}</div></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} solveText="Solve module" isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Solution"><div className="space-y-2 text-center"><p>Access code: <strong>{result.accessCodeNames.join(" / ")}</strong> — switch at <strong>{result.accessSeconds}</strong> seconds</p><p>Glitch: <strong>{result.glitchWord}</strong> (list {result.listNumber})</p><p className="text-3xl font-bold">Take the {result.pill} pill at a time ending in {result.timerDigit}</p></div></SolverSection>}
  </SolverLayout>;
}
