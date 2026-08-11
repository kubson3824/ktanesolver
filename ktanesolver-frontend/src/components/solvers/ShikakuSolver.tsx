import { useCallback, useMemo, useState } from "react";
import { solveShikaku, type ShikakuClue, type ShikakuOutput } from "../../services/shikakuService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const EXAMPLE = "A1: 6\nC2: G/W\nF4: 3";
function parseClues(text: string): ShikakuClue[] {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const match = /^([a-f][1-6])\s*:\s*([2-7a-z])(?:\s*[/,]\s*([a-z]))?$/i.exec(line);
    if (!match) throw new Error(`Invalid clue line: ${line}`);
    return { cell: match[1].toUpperCase(), shown: match[2].toUpperCase(), alternate: match[3]?.toUpperCase() };
  });
}
export default function ShikakuSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [clueText, setClueText] = useState(EXAMPLE); const [result, setResult] = useState<ShikakuOutput | null>(null); const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ clueText, result, twitchCommand }), [clueText, result, twitchCommand]);
  useSolverModulePersistence<typeof state, ShikakuOutput>({ state, onRestoreState: useCallback((saved) => { if (saved.clueText) setClueText(saved.clueText); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []), onRestoreSolution: useCallback((solution: ShikakuOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.SHIKAKU, result: solution })); }, []), currentModule, setIsSolved });
  const solve = async () => { if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information"); clearError(); setIsLoading(true); try { const clues=parseClues(clueText); const response=await solveShikaku(round.id,bomb.id,currentModule.id,clues); const command=generateTwitchCommand({moduleType:ModuleType.SHIKAKU,result:response.output}); setResult(response.output);setTwitchCommand(command);setIsSolved(response.solved);if(response.solved)markModuleSolved(bomb.id,currentModule.id);updateModuleAfterSolve(bomb.id,currentModule.id,{clueText,result:response.output,twitchCommand:command},response.output,response.solved); } catch(cause){setError(cause instanceof Error?cause.message:"Failed to solve Shikaku");} finally{setIsLoading(false);} };
  const reset=()=>{setClueText("");setResult(null);setTwitchCommand("");resetSolverState();};
  return <SolverLayout><SolverSection title="Grid clues" description="One clue per line. Put the currently shown symbol first, then the symbol revealed by toggling it."><textarea aria-label="Shikaku clues" rows={10} value={clueText} onChange={(event)=>{setClueText(event.target.value);setResult(null);setTwitchCommand("");clearError();}} disabled={isLoading||isSolved} placeholder={EXAMPLE} className="w-full rounded-md border border-input bg-background p-3 font-mono" /></SolverSection><SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Partition grid"/><ErrorAlert error={error}/>{result&&<SolverSection title="Regions" className="border-emerald-500/40"><div className="space-y-2">{result.regions.map((region)=><p key={region.clue}><span className="font-semibold">{region.clue} ({region.correctHint})</span>: {region.cells.join(" ")}</p>)}</div></SolverSection>}{twitchCommand&&<TwitchCommandDisplay command={twitchCommand}/>}<SolverInstructions>Use `A1: 4` for a number. For a symbol, enter both toggle states with the currently visible letter first, such as `C2: G/W`. The solver selects the correct symbol from the numbered sum, partitions all 36 cells, toggles where needed, and paints every region.</SolverInstructions></SolverLayout>;
}
