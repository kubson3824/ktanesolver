import { useCallback, useMemo, useState } from "react";
import { solveLightspeed, type LightspeedInput, type LightspeedOutput } from "../../services/lightspeedService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";
import { Input } from "../ui";

const initial: LightspeedInput = { symbol:"C", symbolColor:"YELLOW", greenPoint:"NW", antimatter:40, dilithium:40, shields:20, stardate:34127, subStardate:0, planets:["","",""], officers:Array(8).fill("") };
const ranks = ["Crewman 1","Crewman 2","Ensign 1","Ensign 2","Lieutenant","Lieutenant Commander","Commander","Captain"];

export default function LightspeedSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [input,setInput]=useState<LightspeedInput>(initial);
  const [result,setResult]=useState<LightspeedOutput|null>(null);
  const [twitchCommand,setTwitchCommand]=useState("");
  const { isLoading,error,isSolved,setIsLoading,setError,setIsSolved,clearError,reset:resetSolverState,currentModule,round,markModuleSolved }=useSolver();
  const updateModuleAfterSolve=useRoundStore((state)=>state.updateModuleAfterSolve);
  const state=useMemo(()=>({...input,result,twitchCommand}),[input,result,twitchCommand]);
  const change=<K extends keyof LightspeedInput>(key:K,value:LightspeedInput[K])=>{setInput((current)=>({...current,[key]:value}));clearError();};
  const listChange=(key:"planets"|"officers",index:number,value:string)=>change(key,input[key].map((item,position)=>position===index?value:item));

  useSolverModulePersistence<typeof state,LightspeedOutput>({
    state,
    onRestoreState:useCallback((saved:any)=>{const value=saved.input??saved;setInput((current)=>({...current,...value}));if(saved.result!==undefined)setResult(saved.result);if(saved.twitchCommand!==undefined)setTwitchCommand(saved.twitchCommand);},[]),
    onRestoreSolution:useCallback((solution:LightspeedOutput)=>{setResult(solution);setTwitchCommand(generateTwitchCommand({moduleType:ModuleType.LIGHTSPEED,result:solution}));},[]),
    extractSolution:(raw)=>{if(!raw||typeof raw!=="object")return null;const value=raw as LightspeedOutput&{output?:LightspeedOutput};return value.output??value;},
    inferSolved:(_solution,module)=>Boolean((module as {solved?:boolean}|undefined)?.solved),currentModule,setIsSolved,
  });

  const solve=useCallback(async()=>{
    if(!round?.id||!bomb?.id||!currentModule?.id)return setError("Missing required information");
    if(input.planets.some((value)=>!value.trim())||input.officers.some((value)=>!value.trim()))return setError("Enter all three planets and eight officers");
    clearError();setIsLoading(true);
    try{const response=await solveLightspeed(round.id,bomb.id,currentModule.id,input);const command=generateTwitchCommand({moduleType:ModuleType.LIGHTSPEED,result:response.output});setResult(response.output);setTwitchCommand(command);setIsSolved(response.solved);if(response.solved)markModuleSolved(bomb.id,currentModule.id);updateModuleAfterSolve(bomb.id,currentModule.id,{...input,result:response.output,twitchCommand:command},response.output,response.solved);}
    catch(cause){setError(cause instanceof Error?cause.message:"Failed to solve Lightspeed");}finally{setIsLoading(false);}
  },[round?.id,bomb?.id,currentModule?.id,input,clearError,markModuleSolved,setError,setIsLoading,setIsSolved,updateModuleAfterSolve]);
  const reset=()=>{setInput(initial);setResult(null);setTwitchCommand("");resetSolverState();};
  const selectClass="mt-1 h-11 w-full rounded-md border border-input bg-background px-3";

  return <SolverLayout>
    <SolverSection title="Home screen" description="Read the symbol, its color, the green point clockwise from northwest, and ship levels.">
      <div className="grid gap-3 sm:grid-cols-3">
        {[["symbol",["C","L","P"]],["symbolColor",["YELLOW","ORANGE","PURPLE"]],["greenPoint",["NW","NE","SE","SW"]]].map(([key,options])=><label key={key as string} className="text-sm font-medium">{key as string}<select aria-label={key as string} value={input[key as keyof LightspeedInput] as string} onChange={(e)=>change(key as keyof LightspeedInput,e.target.value as never)} className={selectClass} disabled={isLoading||isSolved}>{(options as string[]).map((option)=><option key={option}>{option}</option>)}</select></label>)}
        {(["antimatter","dilithium","shields"] as const).map((key)=><label key={key} className="text-sm font-medium">{key}<Input type="number" min={0} max={100} value={input[key]} onChange={(e)=>change(key,Number(e.target.value))} disabled={isLoading||isSolved} className="mt-1"/></label>)}
        <label className="text-sm font-medium">Stardate<Input type="number" min={10000} max={99999} value={input.stardate} onChange={(e)=>change("stardate",Number(e.target.value))} className="mt-1"/></label>
        <label className="text-sm font-medium">Sub-stardate<Input type="number" min={0} max={9} value={input.subStardate} onChange={(e)=>change("subStardate",Number(e.target.value))} className="mt-1"/></label>
      </div>
    </SolverSection>
    <SolverSection title="Map planets" description="Enter the three displayed planets that belong to your calculated quadrant."><div className="grid gap-3 sm:grid-cols-3">{input.planets.map((value,index)=><Input key={index} aria-label={`Planet ${index+1}`} value={value} onChange={(e)=>listChange("planets",index,e.target.value)} disabled={isLoading||isSolved}/>)}</div></SolverSection>
    <SolverSection title="Available officers" description="Enter names in the displayed rank slots."><div className="grid gap-3 sm:grid-cols-2">{input.officers.map((value,index)=><label key={ranks[index]} className="text-sm font-medium">{ranks[index]}<Input value={value} onChange={(e)=>listChange("officers",index,e.target.value)} disabled={isLoading||isSolved} className="mt-1"/></label>)}</div></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Plot course"/>
    <ErrorAlert error={error}/>
    {result&&<SolverSection title="Course solution" className="border-emerald-500/40"><p className="text-center text-lg">Warp {result.warpSpeed} to {result.planet} ({result.planetClass}-class) in the {result.quadrant} quadrant.</p><p className="mt-2 text-center">Assign {result.officerRank} {result.officer}; encrypt with <strong>{result.encryptionCode}</strong>, then engage.</p></SolverSection>}
    {twitchCommand&&<TwitchCommandDisplay command={twitchCommand}/>}
    <SolverInstructions>Planet and officer names may be entered exactly as shown in the manual or module display.</SolverInstructions>
  </SolverLayout>;
}
