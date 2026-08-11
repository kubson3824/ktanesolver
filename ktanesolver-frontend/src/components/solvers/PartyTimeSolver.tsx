import { useCallback, useMemo, useState } from "react";
import { PARTY_TIME_SPACE_TYPES, solvePartyTime, type PartyTimeOutput, type PartyTimeSpaceType } from "../../services/partyTimeService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const displayOrder=[0,1,2,3,4,9,8,7,6,5,10,11,12,13,14,19,18,17,16,15];
const labels:Record<PartyTimeSpaceType,string>={START:"Start",NORMAL:"Normal",D_BATTERY:"D battery",AA_BATTERY:"AA battery",INDICATOR:"Indicator",WATER:"Water",FIRE:"Fire",GOAL:"Goal"};
const initialBoard=():PartyTimeSpaceType[]=>Array.from({length:20},(_,index)=>index===0?"START":index===19?"GOAL":"NORMAL");

export default function PartyTimeSolver({bomb}:{bomb:BombEntity|null|undefined}){
  const[spaces,setSpaces]=useState<PartyTimeSpaceType[]>(initialBoard),[result,setResult]=useState<PartyTimeOutput|null>(null),[twitchCommand,setTwitchCommand]=useState("");
  const{isLoading,error,isSolved,setIsLoading,setError,setIsSolved,clearError,reset:resetSolverState,currentModule,round,markModuleSolved}=useSolver();
  const updateModuleAfterSolve=useRoundStore(state=>state.updateModuleAfterSolve);
  const state=useMemo(()=>({spaces,result,twitchCommand}),[spaces,result,twitchCommand]);
  useSolverModulePersistence<typeof state,PartyTimeOutput>({state,onRestoreState:useCallback(saved=>{if(Array.isArray(saved.spaces)&&saved.spaces.length===20)setSpaces(saved.spaces);if(saved.result)setResult(saved.result);if(saved.twitchCommand)setTwitchCommand(saved.twitchCommand);},[]),onRestoreSolution:useCallback((solution:PartyTimeOutput)=>{setResult(solution);setTwitchCommand(generateTwitchCommand({moduleType:ModuleType.PARTY_TIME,result:solution}));},[]),currentModule,setIsSolved});
  const solve=async()=>{if(!round?.id||!bomb?.id||!currentModule?.id)return setError("Missing required information");clearError();setIsLoading(true);try{const response=await solvePartyTime(round.id,bomb.id,currentModule.id,spaces);const command=generateTwitchCommand({moduleType:ModuleType.PARTY_TIME,result:response.output});setResult(response.output);setTwitchCommand(command);setIsSolved(response.solved);if(response.solved)markModuleSolved(bomb.id,currentModule.id);updateModuleAfterSolve(bomb.id,currentModule.id,{spaces,result:response.output,twitchCommand:command},response.output,response.solved);}catch(cause){setError(cause instanceof Error?cause.message:"Failed to solve Party Time");}finally{setIsLoading(false);}};
  const reset=()=>{setSpaces(initialBoard());setResult(null);setTwitchCommand("");resetSolverState();};
  return <SolverLayout>
    <SolverSection title="Serpentine board" description="Enter the four visible rows from left to right. The small number is the path-space number used by Twitch."><div className="grid grid-cols-5 gap-2">{displayOrder.map(index=><label key={index} className="text-xs font-medium">#{index}<select aria-label={`Space ${index}`} value={spaces[index]} disabled={isLoading||isSolved||index===0||index===19} onChange={event=>{setSpaces(current=>current.map((value,position)=>position===index?event.target.value as PartyTimeSpaceType:value));setResult(null);setTwitchCommand("");clearError();}} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-1 text-xs">{index===0||index===19?<option>{labels[spaces[index]]}</option>:PARTY_TIME_SPACE_TYPES.map(type=><option key={type} value={type}>{labels[type]}</option>)}</select></label>)}</div></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Program auto-roll"/><ErrorAlert error={error}/>
    {result&&<SolverSection title="Programmed stops" className="border-emerald-500/40"><p><b>Press die:</b> {result.dieSpaces.join(", ")||"none"}</p><p><b>Press space:</b> {result.pressSpaces.join(", ")||"none"}</p><p className="mt-2 font-semibold">Then start rolling.</p></SolverSection>}
    {twitchCommand&&<TwitchCommandDisplay command={twitchCommand}/>}<SolverInstructions>The command lists preload every water/fire decision and then enable automatic rolling. A wrong stop choice strikes but keeps the board; it disables auto-roll and consumes that stop from its list, so the successful preprogrammed route should be entered before starting.</SolverInstructions>
  </SolverLayout>;
}
