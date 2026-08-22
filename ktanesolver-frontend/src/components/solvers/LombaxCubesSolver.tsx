import { useState } from "react";
import { solveLombaxCubes, type LombaxCubesOutput } from "../../services/lombaxCubesService";
import type { BombEntity } from "../../types";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver } from "../common";

const colors = ["Red", "Blue", "Green", "Yellow", "Purple", "White"];
export default function LombaxCubesSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [letters,setLetters]=useState(""),[buttonColor,setButtonColor]=useState("Red"),[faces,setFaces]=useState(Array(6).fill(""));
  const [result,setResult]=useState<LombaxCubesOutput|null>(null);
  const {isLoading,error,isSolved,setIsLoading,setError,setIsSolved,clearError,reset:resetSolver,currentModule,round,markModuleSolved}=useSolver();
  const solve=async()=>{if(!round?.id||!bomb?.id||!currentModule?.id)return setError("Missing required information");clearError();setIsLoading(true);try{const r=await solveLombaxCubes(round.id,bomb.id,currentModule.id,letters,buttonColor,faces);setResult(r.output);setIsSolved(r.solved);if(r.solved)markModuleSolved(bomb.id,currentModule.id);}catch(e){setError(e instanceof Error?e.message:"Failed to solve Lombax Cubes");}finally{setIsLoading(false)}};
  const reset=()=>{setLetters("");setButtonColor("Red");setFaces(Array(6).fill(""));setResult(null);resetSolver()};
  return <SolverLayout><SolverSection title="Observed glyphs"><div className="grid gap-3 sm:grid-cols-2"><label>Button letters<input value={letters} maxLength={2} onChange={e=>setLetters(e.target.value.toUpperCase())} className="mt-1 h-11 w-full rounded border bg-background px-2" /></label><label>Button color<select value={buttonColor} onChange={e=>setButtonColor(e.target.value)} className="mt-1 h-11 w-full rounded border bg-background px-2">{colors.map(c=><option key={c}>{c}</option>)}</select></label>{colors.map((c,i)=><label key={c}>{c} cube A-F letters<input value={faces[i]} maxLength={6} onChange={e=>setFaces(faces.map((v,j)=>j===i?e.target.value.toUpperCase():v))} className="mt-1 h-11 w-full rounded border bg-background px-2" /></label>)}</div></SolverSection><SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved}/><ErrorAlert error={error}/>{result&&<SolverSection title="Press"><p>Cube X: {result.cubeX}; cube Y: {result.cubeY}</p><p className="text-2xl font-semibold">Press when the timer ends in {result.timerDigit}</p></SolverSection>}{result&&<TwitchCommandDisplay command={`press ${result.timerDigit}`}/>}<SolverInstructions>Enter each cube's face letters in manual A–F order, not screen orientation.</SolverInstructions></SolverLayout>;
}
