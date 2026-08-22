import { useState } from "react";
import { solveForgetThemAll, type ForgetThemAllOutput } from "../../services/forgetThemAllService";
import type { BombEntity } from "../../types";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver } from "../common";

const parseColors = (value: string) => value.split(",").map(item => item.trim()).filter(Boolean);

export default function ForgetThemAllSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [minutes, setMinutes] = useState(5), [history, setHistory] = useState(""), [alreadyCut, setAlreadyCut] = useState("");
  const [result, setResult] = useState<ForgetThemAllOutput | null>(null);
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset, currentModule, round, markModuleSolved } = useSolver();
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    const stages = history.split(/\r?\n/).filter(line => line.trim()).map(line => { const [moduleName = "", colors = ""] = line.split("|"); return { moduleName: moduleName.trim(), litLeds: parseColors(colors) }; });
    clearError(); setIsLoading(true);
    try {
      const response = await solveForgetThemAll(round.id, bomb.id, currentModule.id, minutes, stages, parseColors(alreadyCut));
      setResult(response.output); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Forget Them All"); }
    finally { setIsLoading(false); }
  };
  return <SolverLayout>
    <SolverSection title="Starting bomb time"><input aria-label="Starting bomb time in whole minutes" type="number" min={0} value={minutes} onChange={event => { setMinutes(Number(event.target.value)); setResult(null); }} className="h-11 w-full rounded border bg-background px-2" /></SolverSection>
    <SolverSection title="Stage history"><textarea aria-label="Stage history" rows={8} value={history} onChange={event => { setHistory(event.target.value); setResult(null); }} placeholder={'Wire Sequence | red, blue\nThe Maze | yellow'} className="w-full rounded border bg-background p-2 font-mono text-sm" /><p className="mt-1 text-xs text-muted-foreground">One stage per line: advancing module name | comma-separated LEDs that appeared on.</p></SolverSection>
    <SolverSection title="Already cut colors (optional)"><input aria-label="Already cut colors" value={alreadyCut} onChange={event => { setAlreadyCut(event.target.value); setResult(null); }} placeholder="red, blue" className="h-11 w-full rounded border bg-background px-2" /></SolverSection>
    <SolverControls onSolve={solve} onReset={() => { setMinutes(5); setHistory(""); setAlreadyCut(""); setResult(null); reset(); }} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverSection title={`Key stage ${result.keyStage}: ${result.keyModule}`} className="border-emerald-500/40"><p>{result.cutColors.length ? result.cutColors.join(" → ") : "No uncut wire remains"}</p><p className="text-xs text-muted-foreground">Final value: {result.finalValue}</p></SolverSection>}
    {result?.command && <TwitchCommandDisplay command={`!number ${result.command}`} />}
    <SolverInstructions>Record the LEDs as initially shown. The solver applies each advancing module name’s broken-LED toggle before totaling the thirteen multipliers.</SolverInstructions>
  </SolverLayout>;
}
