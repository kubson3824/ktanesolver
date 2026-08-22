import { useCallback, useMemo, useState } from "react";
import { solveColorfulInsanity, type ColorfulInsanityOutput } from "../../services/colorfulInsanityService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

type ButtonEntry = { patternCell: number | null; blackRegionColor: string; otherRegionColor: string };
const COLORS = ["RED", "ORANGE", "YELLOW", "GREEN", "CYAN", "AZURE", "BLUE", "MAGENTA", "PURPLE"];
const PATTERNS = [17, 1, 2, 16, 0, 3, 23, 6, 15, 11, 13, 24, 8, 20, 12, 22, 18, 10, 14, 7, 19, 5, 21, 4, 9];
const blankButtons = (): ButtonEntry[] => Array.from({ length: 35 }, () => ({ patternCell: null, blackRegionColor: "", otherRegionColor: "" }));
const patternLabel = (cell: number) => `${String.fromCharCode(65 + cell % 5)}${Math.floor(cell / 5) + 1}`;
const buttonCoordinate = (index: number) => `${String.fromCharCode(65 + index % 7)}${Math.floor(index / 7) + 1}`;

export default function ColorfulInsanitySolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [buttons, setButtons] = useState<ButtonEntry[]>(blankButtons);
  const [result, setResult] = useState<ColorfulInsanityOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ buttons, result, twitchCommand }), [buttons, result, twitchCommand]);
  useSolverModulePersistence<typeof state, ColorfulInsanityOutput>({
    state,
    onRestoreState: useCallback(saved => { if (saved.buttons) setButtons(saved.buttons); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []),
    onRestoreSolution: useCallback((solution: ColorfulInsanityOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.COLORFUL_INSANITY, result: solution })); }, []),
    currentModule,
    setIsSolved,
  });
  const changed = () => { setResult(null); setTwitchCommand(""); setIsSolved(false); clearError(); };
  const update = (index: number, field: keyof ButtonEntry, value: string | number | null) => {
    setButtons(current => current.map((button, position) => position === index ? { ...button, [field]: value } : button)); changed();
  };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (buttons.some(button => button.patternCell === null || !button.blackRegionColor || !button.otherRegionColor)) return setError("Describe all 35 buttons");
    clearError(); setIsLoading(true);
    try {
      const response = await solveColorfulInsanity(round.id, bomb.id, currentModule.id, buttons as Array<{ patternCell: number; blackRegionColor: string; otherRegionColor: string }>);
      const command = generateTwitchCommand({ moduleType: ModuleType.COLORFUL_INSANITY, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { buttons, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Colorful Insanity"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setButtons(blankButtons()); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title="Default pattern table" description="Match each module button to one labeled pattern. For each pattern, ‘black region’ means the region that is black in this reference image.">
      <div className="grid grid-cols-5 gap-2">{PATTERNS.map((pattern, cell) => <figure key={cell} className="rounded border p-1 text-center"><img src={`https://ktane.timwi.de/HTML/img/Colorful%20Insanity/pattern${pattern}.png`} alt={`Pattern ${pattern} at ${patternLabel(cell)}`} className="mx-auto aspect-square w-full max-w-20" /><figcaption className="font-mono font-bold">{patternLabel(cell)}</figcaption></figure>)}</div>
    </SolverSection>
    <SolverSection title="5×7 module buttons" description="Enter buttons left-to-right, top-to-bottom. The special pairs are detected automatically.">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{buttons.map((button, index) => <fieldset key={index} className="rounded border p-2"><legend className="px-1 font-mono font-bold">{buttonCoordinate(index)}</legend><div className="grid grid-cols-3 gap-1"><label className="text-xs">Pattern<select aria-label={`${buttonCoordinate(index)} pattern`} value={button.patternCell ?? ""} onChange={event => update(index, "patternCell", event.target.value === "" ? null : Number(event.target.value))} className="mt-1 h-9 w-full rounded border bg-background px-1"><option value="">—</option>{PATTERNS.map((_, cell) => <option key={cell} value={cell}>{patternLabel(cell)}</option>)}</select></label><label className="text-xs">Black region<select aria-label={`${buttonCoordinate(index)} black region color`} value={button.blackRegionColor} onChange={event => update(index, "blackRegionColor", event.target.value)} className="mt-1 h-9 w-full rounded border bg-background px-1"><option value="">—</option>{COLORS.map(color => <option key={color}>{color.toLowerCase()}</option>)}</select></label><label className="text-xs">Other region<select aria-label={`${buttonCoordinate(index)} other region color`} value={button.otherRegionColor} onChange={event => update(index, "otherRegionColor", event.target.value)} className="mt-1 h-9 w-full rounded border bg-background px-1"><option value="">—</option>{COLORS.map(color => <option key={color}>{color.toLowerCase()}</option>)}</select></label></div></fieldset>)}</div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find buttons to press" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Press these buttons" className="border-emerald-500/40"><p className="font-mono text-3xl font-bold">{result.pressCoordinates.join(" · ")}</p><div className="mt-3 text-sm text-muted-foreground"><p>Reversed pair: {result.reversedPair.join(", ")}; identical pair: {result.identicalPair.join(", ")}.</p><p>Allowed patterns: {result.allowedPatternCells.map(patternLabel).join(", ")}; colors: {result.allowedColors.join(", ") || "any"}.</p>{result.pairFallback && <p>No normal button matched, so press both special pairs.</p>}</div></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>This implements the default rule seed shown in the manual. Press every returned coordinate once, in any order. Incorrect buttons strike but remain disabled-looking; correct progress is retained. Colorful Insanity is not a Souvenir candidate.</SolverInstructions>
  </SolverLayout>;
}
