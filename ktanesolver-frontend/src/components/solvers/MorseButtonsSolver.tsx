import { useState } from "react";
import { solveMorseButtons, type MorseButton, type MorseButtonsOutput } from "../../services/morseButtonsService";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver } from "../common";

const colors = ["red","blue","green","yellow","orange","purple"];
export default function MorseButtonsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [buttons, setButtons] = useState<MorseButton[]>(Array.from({ length: 6 }, () => ({ color: "red", morse: "" })));
  const [result, setResult] = useState<MorseButtonsOutput | null>(null), [command, setCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, currentModule, round, markModuleSolved } = useSolver();
  const update = (index: number, patch: Partial<MorseButton>) => setButtons(values => values.map((value, i) => i === index ? { ...value, ...patch } : value));
  const solve = async () => { if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information"); setIsLoading(true); clearError();
    try { const response = await solveMorseButtons(round.id, bomb.id, currentModule.id, { buttons }); setResult(response.output); const next = generateTwitchCommand({ moduleType: ModuleType.MORSE_BUTTONS, result: response.output }); setCommand(next); setIsSolved(response.solved); if (response.solved) markModuleSolved(bomb.id, currentModule.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Morse Buttons"); } finally { setIsLoading(false); } };
  return <SolverLayout><SolverSection title="Buttons in reading order" description="Enter dots and dashes exactly as each LED flashes them."><div className="grid gap-3 sm:grid-cols-3">{buttons.map((button, i) => <div key={i} className="rounded-md border p-3"><p className="font-medium">Button {i + 1}</p><select value={button.color} onChange={(e) => update(i, { color: e.target.value })} className="mt-2 h-10 w-full rounded-md border bg-background px-2">{colors.map(color => <option key={color}>{color}</option>)}</select><input aria-label={`Button ${i + 1} Morse`} value={button.morse} onChange={(e) => update(i, { morse: e.target.value })} placeholder=".-" className="mt-2 h-10 w-full rounded-md border bg-background px-2 font-mono" /></div>)}</div></SolverSection>
    <SolverControls onSolve={solve} onReset={() => { setResult(null); setCommand(""); setIsSolved(false); }} isLoading={isLoading} isSolved={isSolved} /><ErrorAlert error={error} />
    {result && <SolverSection title="Press"><p className="text-center text-2xl font-bold">{result.pressPositions.join(" → ")}</p><p className="text-center text-sm text-muted-foreground">Rules: {result.ruleNumbers.join(", ")}</p></SolverSection>}{command && <TwitchCommandDisplay command={command} />}</SolverLayout>;
}
