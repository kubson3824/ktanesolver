import { useCallback, useMemo, useState } from "react";
import PatternCubeSymbol, { PATTERN_CUBE_SYMBOLS } from "../common/PatternCubeSymbol";
import { solvePatternCube, type PatternCubeInput, type PatternCubeOutput, type PatternCubeSymbolInput } from "../../services/patternCubeService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const ORIENTATIONS = ["N", "E", "S", "W"];
const INITIAL_SELECTIONS: PatternCubeSymbolInput[] = ["A", "B", "C", "D", "E"].map((symbol) => ({ symbol, orientation: 0 }));
type SavedState = {
  group1?: number; group2?: number; netCellsText?: string; cellLettersText?: string;
  givenCell?: string; givenSymbol?: string; givenOrientation?: number;
  highlightedCell?: string; highlightedSymbol?: string; selections?: PatternCubeSymbolInput[];
  result?: PatternCubeOutput | null; twitchCommand?: string;
};

export default function PatternCubeSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [group1, setGroup1] = useState(1);
  const [group2, setGroup2] = useState(1);
  const [netCellsText, setNetCellsText] = useState("B1,A2,B2,C2,B3,B4");
  const [cellLettersText, setCellLettersText] = useState("B1=A,A2=B,B2=C,C2=D,B3=E,B4=F");
  const [givenCell, setGivenCell] = useState("B1");
  const [givenSymbol, setGivenSymbol] = useState("A");
  const [givenOrientation, setGivenOrientation] = useState(0);
  const [highlightedCell, setHighlightedCell] = useState("B2");
  const [highlightedSymbol, setHighlightedSymbol] = useState("B");
  const [selections, setSelections] = useState<PatternCubeSymbolInput[]>(INITIAL_SELECTIONS);
  const [result, setResult] = useState<PatternCubeOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ group1, group2, netCellsText, cellLettersText, givenCell, givenSymbol,
    givenOrientation, highlightedCell, highlightedSymbol, selections, result, twitchCommand }),
  [group1, group2, netCellsText, cellLettersText, givenCell, givenSymbol, givenOrientation, highlightedCell, highlightedSymbol, selections, result, twitchCommand]);

  useSolverModulePersistence<SavedState, PatternCubeOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      if (saved.group1) setGroup1(saved.group1); if (saved.group2) setGroup2(saved.group2);
      if (saved.netCellsText) setNetCellsText(saved.netCellsText); if (saved.cellLettersText) setCellLettersText(saved.cellLettersText);
      if (saved.givenCell) setGivenCell(saved.givenCell); if (saved.givenSymbol) setGivenSymbol(saved.givenSymbol);
      if (saved.givenOrientation !== undefined) setGivenOrientation(saved.givenOrientation);
      if (saved.highlightedCell) setHighlightedCell(saved.highlightedCell); if (saved.highlightedSymbol) setHighlightedSymbol(saved.highlightedSymbol);
      if (saved.selections?.length === 5) setSelections(saved.selections);
      if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: PatternCubeOutput) => {
      setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.PATTERN_CUBE, result: solution }));
    }, []), currentModule, setIsSolved,
  });

  const clearResult = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const updateSelection = (index: number, patch: Partial<PatternCubeSymbolInput>) => {
    setSelections((current) => current.map((value, position) => position === index ? { ...value, ...patch } : value)); clearResult();
  };
  const parseInput = (): PatternCubeInput => {
    const netCells = netCellsText.toUpperCase().split(",").map((value) => value.trim()).filter(Boolean);
    const cellLetters = Object.fromEntries(cellLettersText.toUpperCase().split(",").map((entry) => entry.split("=").map((value) => value.trim())).filter((entry) => entry.length === 2));
    return { group1, group2, netCells, cellLetters, givenCell: givenCell.toUpperCase(), givenSymbol,
      givenOrientation, highlightedCell: highlightedCell.toUpperCase(), highlightedSymbol, selections };
  };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    const input = parseInput(); clearError(); setIsLoading(true);
    try {
      const response = await solvePatternCube(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.PATTERN_CUBE, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...state, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Pattern Cube"); }
    finally { setIsLoading(false); }
  };
  const reset = () => {
    setGroup1(1); setGroup2(1); setNetCellsText("B1,A2,B2,C2,B3,B4"); setCellLettersText("B1=A,A2=B,B2=C,C2=D,B3=E,B4=F");
    setGivenCell("B1"); setGivenSymbol("A"); setGivenOrientation(0); setHighlightedCell("B2"); setHighlightedSymbol("B");
    setSelections(INITIAL_SELECTIONS); setResult(null); setTwitchCommand(""); resetSolverState();
  };
  const symbolSelect = (value: string, onChange: (value: string) => void, label: string) => <select aria-label={label} value={value} onChange={(event) => { onChange(event.target.value); clearResult(); }} disabled={isLoading || isSolved} className="h-10 rounded-md border border-input bg-background px-2">
    {PATTERN_CUBE_SYMBOLS.map((symbol) => <option key={symbol}>{symbol}</option>)}
  </select>;

  return <SolverLayout>
    <SolverSection title="Default symbol legend" description="Use these labels for the matching symbols in the manual and on the module.">
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">{PATTERN_CUBE_SYMBOLS.map((symbol) => <div key={symbol} className="text-center text-xs"><PatternCubeSymbol symbol={symbol} className="mx-auto h-9 w-9" />{symbol}</div>)}</div>
    </SolverSection>
    <SolverSection title="Reference cubes" description="Choose the matching picture number (reading order 1–24) from each manual group.">
      <div className="grid grid-cols-2 gap-3">{([1, 2] as const).map((group) => <label key={group} className="text-sm font-medium">Group {group}
        <input type="number" min={1} max={24} value={group === 1 ? group1 : group2} onChange={(event) => { (group === 1 ? setGroup1 : setGroup2)(Number(event.target.value)); clearResult(); }} disabled={isLoading || isSolved} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3" />
      </label>)}</div>
    </SolverSection>
    <SolverSection title="Cube net" description="Name grid columns A–E and rows 1–5. Enter six cells, then each cell’s TP letter.">
      <label className="text-sm font-medium">Net cells<input aria-label="Net cells" value={netCellsText} onChange={(event) => { setNetCellsText(event.target.value); clearResult(); }} disabled={isLoading || isSolved} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 font-mono" /></label>
      <label className="mt-3 block text-sm font-medium">Cell letters<input aria-label="Cell Twitch letters" value={cellLettersText} onChange={(event) => { setCellLettersText(event.target.value); clearResult(); }} disabled={isLoading || isSolved} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 font-mono" /></label>
    </SolverSection>
    <SolverSection title="Given and highlighted clues">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid grid-cols-3 gap-2"><input aria-label="Given cell" value={givenCell} onChange={(event) => { setGivenCell(event.target.value); clearResult(); }} className="h-10 rounded-md border border-input bg-background px-2" />{symbolSelect(givenSymbol, setGivenSymbol, "Given symbol")}<select aria-label="Given orientation" value={givenOrientation} onChange={(event) => { setGivenOrientation(Number(event.target.value)); clearResult(); }} className="h-10 rounded-md border border-input bg-background px-2">{ORIENTATIONS.map((value, index) => <option key={value} value={index}>{value}</option>)}</select></div>
        <div className="grid grid-cols-2 gap-2"><input aria-label="Highlighted cell" value={highlightedCell} onChange={(event) => { setHighlightedCell(event.target.value); clearResult(); }} className="h-10 rounded-md border border-input bg-background px-2" />{symbolSelect(highlightedSymbol, setHighlightedSymbol, "Highlighted symbol")}</div>
      </div>
    </SolverSection>
    <SolverSection title="Selection bar" description="Enter the five symbols top-to-bottom and their current rotations.">
      <div className="space-y-2">{selections.map((selection, index) => <div key={index} className="grid grid-cols-[2rem_1fr_1fr] items-center gap-2"><span>{index + 1}</span>{symbolSelect(selection.symbol, (symbol) => updateSelection(index, { symbol }), `Selection ${index + 1} symbol`)}<select aria-label={`Selection ${index + 1} orientation`} value={selection.orientation} onChange={(event) => updateSelection(index, { orientation: Number(event.target.value) })} className="h-10 rounded-md border border-input bg-background px-2">{ORIENTATIONS.map((value, orientation) => <option key={value} value={orientation}>{value}</option>)}</select></div>)}</div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Fold cube" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Placements" className="border-emerald-500/40"><ol className="space-y-2">{result.placements.map((placement) => <li key={placement.selection} className="flex items-center gap-2"><PatternCubeSymbol symbol={placement.symbol} className="h-8 w-8" /><span>{placement.selection}. {placement.rotation === "none" ? "Do not rotate" : `Rotate ${placement.rotation.toUpperCase()}`}, then place in {placement.targetCell} (TP {placement.targetLetter})</span></li>)}</ol></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Coordinates are only local labels; Twitch uses the six letters printed over the net. A rotation is clockwise as viewed on the selection bar.</SolverInstructions>
  </SolverLayout>;
}
