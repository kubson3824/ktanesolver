import { useCallback, useMemo, useState } from "react";
import { QUINTUPLES_COLORS, solveQuintuples, type QuintuplesCell, type QuintuplesColor, type QuintuplesOutput } from "../../services/quintuplesService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const EMPTY = Array.from({ length: 25 }, (): QuintuplesCell => ({ digit: 0, color: "RED" }));
const ordinal = ["first", "second", "third", "fourth", "fifth"];

export default function QuintuplesSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
	const [cells, setCells] = useState<QuintuplesCell[]>(EMPTY), [result, setResult] = useState<QuintuplesOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
	const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
	const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
	const state = useMemo(() => ({ cells, result, twitchCommand }), [cells, result, twitchCommand]);
	useSolverModulePersistence<typeof state, QuintuplesOutput>({ state, onRestoreState: useCallback(saved => { if (saved.cells) setCells(saved.cells); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []), onRestoreSolution: useCallback((solution: QuintuplesOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.QUINTUPLES, result: solution })); }, []), currentModule, setIsSolved });
	const update = (index: number, patch: Partial<QuintuplesCell>) => { setCells(current => current.map((cell, cellIndex) => cellIndex === index ? { ...cell, ...patch } : cell)); clearError(); };
	const solve = async () => {
		if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
		clearError(); setIsLoading(true);
		try {
			const response = await solveQuintuples(round.id, bomb.id, currentModule.id, cells);
			const command = generateTwitchCommand({ moduleType: ModuleType.QUINTUPLES, result: response.output });
			setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
			if (response.solved) markModuleSolved(bomb.id, currentModule.id);
			updateModuleAfterSolve(bomb.id, currentModule.id, { cells, result: response.output, twitchCommand: command }, response.output, response.solved);
		} catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Quintuples"); } finally { setIsLoading(false); }
	};
	const reset = () => { setCells(EMPTY); setResult(null); setTwitchCommand(""); resetSolverState(); };
	return <SolverLayout><SolverSection title="Cycling observations"><p className="mb-3 text-sm text-muted-foreground">Columns are slots; rows are iterations. Enter displayed 0 as 0.</p><div className="grid grid-cols-5 gap-2">{cells.map((cell, index) => { const slot = Math.floor(index / 5), iteration = index % 5; return <label key={index} className="rounded border p-2 text-xs"><span className="block font-medium">Slot {slot + 1}, {ordinal[iteration]}</span><input aria-label={`Slot ${slot + 1} iteration ${iteration + 1} digit`} type="number" min={0} max={9} value={cell.digit} onChange={event => update(index, { digit: Number(event.target.value) })} className="mt-1 w-full rounded border p-1"/><select aria-label={`Slot ${slot + 1} iteration ${iteration + 1} color`} value={cell.color} onChange={event => update(index, { color: event.target.value as QuintuplesColor })} className="mt-1 w-full rounded border bg-background p-1">{QUINTUPLES_COLORS.map(color => <option key={color} value={color}>{color.toLowerCase()}</option>)}</select></label>; })}</div></SolverSection><SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved}/><ErrorAlert error={error}/>{result && <SolverSection title="Submit" className="border-emerald-500/40"><p className="text-3xl font-bold tracking-[.35em]">{result.answer}</p></SolverSection>}{twitchCommand && <TwitchCommandDisplay command={twitchCommand}/>}<SolverInstructions>A wrong submission leaves the flashes unchanged and colors each entered digit by correctness; adjust the entry without replacing the observations.</SolverInstructions></SolverLayout>;
}
