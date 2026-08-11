import { useCallback, useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import { solveCrackbox, type CrackboxOutput } from "../../services/crackboxService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const emptyGrid = () => Array<string>(16).fill("EMPTY");
const CELL_OPTIONS = ["EMPTY", "BLACK", ...Array.from({ length: 10 }, (_, index) => String(index + 1))];

export default function CrackboxSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [cells, setCells] = useState(emptyGrid), [selectedCell, setSelectedCell] = useState(1);
  const [result, setResult] = useState<CrackboxOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ cells, selectedCell, result, twitchCommand }), [cells, selectedCell, result, twitchCommand]);
  useSolverModulePersistence<typeof state, CrackboxOutput>({
    state,
    onRestoreState: useCallback(saved => { if (saved.cells) setCells(saved.cells); if (saved.selectedCell) setSelectedCell(saved.selectedCell); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []),
    onRestoreSolution: useCallback((solution: CrackboxOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.CRACKBOX, result: solution })); }, []),
    currentModule, setIsSolved,
  });
  const changed = () => { setResult(null); setTwitchCommand(""); setIsSolved(false); clearError(); };
  const setCell = (index: number, value: string) => { setCells(current => current.map((cell, position) => position === index ? value : cell)); changed(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveCrackbox(round.id, bomb.id, currentModule.id, cells, selectedCell);
      const command = generateTwitchCommand({ moduleType: ModuleType.CRACKBOX, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { cells, selectedCell, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Crackbox"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setCells(emptyGrid()); setSelectedCell(1); setResult(null); setTwitchCommand(""); resetSolverState(); };
  const complete = cells.filter(cell => cell === "BLACK").length === 6
    && cells.filter(cell => /^(?:10|[1-9])$/.test(cell)).length === 2 && cells[selectedCell - 1] !== "BLACK";
  return <SolverLayout>
    <SolverSection title="Initial 4×4 grid" description="Mark six black cells, leave eight empty, and enter the two fixed numbers.">
      <div className="mx-auto grid max-w-sm grid-cols-4 gap-2">{cells.map((cell, index) => <label key={index} className="text-center text-xs">{index + 1}
        <select aria-label={`Cell ${index + 1}`} value={cell} onChange={event => setCell(index, event.target.value)} className="mt-1 h-10 w-full rounded border bg-background px-1 text-center">
          {CELL_OPTIONS.map(option => <option key={option} value={option}>{option.toLowerCase()}</option>)}
        </select>
      </label>)}</div>
      <label className="mt-4 block">Currently highlighted cell
        <select aria-label="Currently highlighted cell" value={selectedCell} onChange={event => { setSelectedCell(Number(event.target.value)); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3">
          {cells.map((_, index) => <option key={index} value={index + 1}>Cell {index + 1}</option>)}
        </select>
      </label>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={!complete} solveText="Solve grid" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Completed grid" className="border-emerald-500/40"><div className="mx-auto grid max-w-sm grid-cols-4 gap-2">{result.solution.map((value, index) => <div key={index} className={cn("flex aspect-square items-center justify-center rounded border font-semibold", value === "BLACK" ? "bg-foreground text-background" : "bg-background")}>{value === "BLACK" ? "■" : value}</div>)}</div></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Do not move the highlight after recording it. The generated Twitch path fills every editable cell and then checks the grid. In-game arrows wrap across grid edges; black cells may be crossed but cannot receive a number.</SolverInstructions>
  </SolverLayout>;
}
