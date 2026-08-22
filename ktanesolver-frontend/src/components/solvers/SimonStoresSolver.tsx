import {useState} from "react";
import {SIMON_STORES_COLORS,solveSimonStores,type SimonStoresColor,type SimonStoresOutput} from "../../services/simonStoresService";
import type {BombEntity} from "../../types";
import {ErrorAlert,SolverControls,SolverInstructions,SolverLayout,SolverSection,TwitchCommandDisplay,useSolver} from "../common";

const names:Record<SimonStoresColor,string>={R:"Red",G:"Green",B:"Blue",C:"Cyan",M:"Magenta",Y:"Yellow"};
const initialButtons=()=>[...SIMON_STORES_COLORS];

export default function SimonStoresSolver({bomb}:{bomb:BombEntity|null|undefined}) {
  const [stage,setStage]=useState(1),[buttons,setButtons]=useState<SimonStoresColor[]>(initialButtons),[flashes,setFlashes]=useState(["R","G","B","",""]),[result,setResult]=useState<SimonStoresOutput|null>(null);
  const {isLoading,error,isSolved,setIsLoading,setError,setIsSolved,clearError,reset:resetSolver,currentModule,round,markModuleSolved}=useSolver();
  const solve=async()=>{if(!round?.id||!bomb?.id||!currentModule?.id)return setError("Missing required information");clearError();setIsLoading(true);try{const response=await solveSimonStores(round.id,bomb.id,currentModule.id,stage,buttons,flashes.slice(0,stage+2));setResult(response.output);setIsSolved(response.solved);if(response.solved)markModuleSolved(bomb.id,currentModule.id)}catch(e){setError(e instanceof Error?e.message:"Failed to solve Simon Stores")}finally{setIsLoading(false)}};
  const reset=()=>{setStage(1);setButtons(initialButtons());setFlashes(["R","G","B","",""]);setResult(null);resetSolver()};
  return <SolverLayout><SolverSection title="Current stage"><label>Stage <select value={stage} onChange={e=>setStage(Number(e.target.value))} className="ml-2 h-10 rounded border bg-background px-2"><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option></select></label></SolverSection>
    <SolverSection title="Colored buttons clockwise from white"><div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{buttons.map((color,i)=><label key={i}>Position {i+1}<select value={color} onChange={e=>setButtons(buttons.map((v,j)=>j===i?e.target.value as SimonStoresColor:v))} className="block h-10 w-full rounded border bg-background">{SIMON_STORES_COLORS.map(v=><option key={v} value={v}>{names[v]}</option>)}</select></label>)}</div></SolverSection>
    <SolverSection title="Cumulative flash sequence"><div className="grid gap-2 sm:grid-cols-5">{flashes.slice(0,stage+2).map((flash,i)=><label key={i}>Flash {i+1}<input value={flash} onChange={e=>setFlashes(flashes.map((v,j)=>j===i?e.target.value.toUpperCase():v))} maxLength={3} placeholder="RG" aria-label={`Flash ${i+1} colors`} className="block h-10 w-full rounded border bg-background px-2 uppercase"/></label>)}</div></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved}/><ErrorAlert error={error}/>
    {result&&<SolverSection title={`Stage ${result.stage} submission`}><p className="font-mono text-3xl">{result.signedPresses.join(" ")||"No colored buttons"}</p><p>Value {result.result} · balanced ternary {result.balancedTernary} · power colors {result.executionOrder}</p></SolverSection>}{result&&<TwitchCommandDisplay command={result.twitchCommand}/>}<SolverInstructions>Use “cycle” in Twitch or hover the buttons to record their colors clockwise from white. Enter every flash seen so far. Execute the result, then advance to the next stage and append the new flash.</SolverInstructions>
  </SolverLayout>;
}
