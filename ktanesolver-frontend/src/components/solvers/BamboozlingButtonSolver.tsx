import { useState } from "react";
import { solveBamboozlingButton, type BamboozlingButtonColor, type BamboozlingButtonInput, type BamboozlingButtonOutput, type BamboozlingQuoteStyle } from "../../services/bamboozlingButtonService";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver } from "../common";

const firstTexts = ["A LETTER", "A WORD", "THE LETTER", "THE WORD", "1 LETTER", "1 WORD", "ONE LETTER", "ONE WORD"];
const closingTexts = ["B", "C", "D", "E", "G", "K", "N", "P", "Q", "T", "V", "W", "Y", "BRAVO", "CHARLIE", "DELTA", "ECHO", "GOLF", "KILO", "NOVEMBER", "PAPA", "QUEBEC", "TANGO", "VICTOR", "WHISKEY", "YANKEE", "COLOUR", "RED", "ORANGE", "YELLOW", "LIME", "GREEN", "JADE", "CYAN", "AZURE", "BLUE", "VIOLET", "MAGENTA", "ROSE", "IN RED", "IN YELLOW", "IN GREEN", "IN CYAN", "IN BLUE", "IN MAGENTA", "QUOTE", "END QUOTE"];
const allTexts = [...firstTexts, ...closingTexts];
const colors: BamboozlingButtonColor[] = ["WHITE", "RED", "ORANGE", "YELLOW", "LIME", "GREEN", "JADE", "GREY", "CYAN", "AZURE", "BLUE", "VIOLET", "MAGENTA", "ROSE", "BLACK"];
const displayColors = colors.slice(0, -1);
const initial: BamboozlingButtonInput = { buttonColor: "WHITE", firstDisplay: firstTexts[0], commaAfterFirst: false, thirdDisplay: firstTexts[0], fourthDisplay: closingTexts[0], fourthDisplayColor: "WHITE", fifthDisplay: closingTexts[0], fifthDisplayColor: "WHITE", topLabel: allTexts[0], bottomLabel: allTexts[0], quoteStyle: "NONE" };

export default function BamboozlingButtonSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [input, setInput] = useState(initial), [stage, setStage] = useState(1), [result, setResult] = useState<BamboozlingButtonOutput | null>(null), [command, setCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, currentModule, round, markModuleSolved } = useSolver();
  const set = <K extends keyof BamboozlingButtonInput>(key: K, value: BamboozlingButtonInput[K]) => setInput(previous => ({ ...previous, [key]: value }));
  const solve = async () => { if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information"); setIsLoading(true); clearError(); try { const response = await solveBamboozlingButton(round.id, bomb.id, currentModule.id, input); setResult(response.output); setCommand(generateTwitchCommand({ moduleType: ModuleType.BAMBOOZLING_BUTTON, result: response.output })); setStage(response.output.nextStage); setIsSolved(response.solved); if (response.solved) markModuleSolved(bomb.id, currentModule.id); } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Bamboozling Button"); } finally { setIsLoading(false); } };
  const select = "mt-1 block h-10 w-full rounded-md border bg-background px-2";
  return <SolverLayout>
    <SolverSection title={`Stage ${stage}`} description="Read the five-part cycling message without its quotes, then enter its punctuation, colors, and both button labels.">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Button color<select className={select} value={input.buttonColor} onChange={e => set("buttonColor", e.target.value as BamboozlingButtonColor)}>{colors.map(x => <option key={x}>{x}</option>)}</select></label>
        <label className="text-sm">Quote style<select className={select} value={input.quoteStyle} onChange={e => set("quoteStyle", e.target.value as BamboozlingQuoteStyle)}><option value="NONE">None</option><option value="SINGLE">Single quotes</option><option value="DOUBLE">Double quotes</option></select></label>
        <label className="text-sm">Display 1<select className={select} value={input.firstDisplay} onChange={e => set("firstDisplay", e.target.value)}>{firstTexts.map(x => <option key={x}>{x}</option>)}</select></label>
        <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={input.commaAfterFirst} onChange={e => set("commaAfterFirst", e.target.checked)} />Comma after display 1</label>
        <label className="text-sm">Display 3 (before colon)<select className={select} value={input.thirdDisplay} onChange={e => set("thirdDisplay", e.target.value)}>{firstTexts.map(x => <option key={x}>{x}</option>)}</select></label><span />
        <label className="text-sm">Display 4<select className={select} value={input.fourthDisplay} onChange={e => set("fourthDisplay", e.target.value)}>{closingTexts.map(x => <option key={x}>{x}</option>)}</select></label>
        <label className="text-sm">Display 4 color<select className={select} value={input.fourthDisplayColor} onChange={e => set("fourthDisplayColor", e.target.value as BamboozlingButtonColor)}>{displayColors.map(x => <option key={x}>{x}</option>)}</select></label>
        <label className="text-sm">Display 5<select className={select} value={input.fifthDisplay} onChange={e => set("fifthDisplay", e.target.value)}>{closingTexts.map(x => <option key={x}>{x}</option>)}</select></label>
        <label className="text-sm">Display 5 color<select className={select} value={input.fifthDisplayColor} onChange={e => set("fifthDisplayColor", e.target.value as BamboozlingButtonColor)}>{displayColors.map(x => <option key={x}>{x}</option>)}</select></label>
        <label className="text-sm">Top label<select className={select} value={input.topLabel} onChange={e => set("topLabel", e.target.value)}>{allTexts.map(x => <option key={x}>{x}</option>)}</select></label>
        <label className="text-sm">Bottom label<select className={select} value={input.bottomLabel} onChange={e => set("bottomLabel", e.target.value)}>{allTexts.map(x => <option key={x}>{x}</option>)}</select></label>
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={() => { setInput(initial); setStage(1); setResult(null); setCommand(""); setIsSolved(false); }} solveText="Calculate presses" isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverSection title={`Stage ${result.stage} answer`}><p className="text-center text-lg font-semibold">{result.instruction}</p></SolverSection>}
    {command && <TwitchCommandDisplay command={command} />}
  </SolverLayout>;
}
