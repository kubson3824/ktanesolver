import { useCallback, useMemo, useState } from "react";
import { solveTheHexabutton, type TheHexabuttonOutput } from "../../services/theHexabuttonService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const LABELS = ["JUMP", "BOOM", "CLAIM", "BUTTON", "HOLD", "BLUE"], COLORS = ["BLACK", "BLUE", "RED", "YELLOW", "GREEN"], LIGHT_COLORS = ["BLUE", "CYAN", "GRAY", "GREEN", "MAGENTA", "PURPLE", "WHITE"];
export default function TheHexabuttonSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [label, setLabel] = useState("JUMP"), [buttonColor, setButtonColor] = useState("BLACK"), [twoFactorText, setTwoFactorText] = useState(""), [lightType, setLightType] = useState(""), [lightColor, setLightColor] = useState("BLUE"), [morseLetter, setMorseLetter] = useState("A"), [result, setResult] = useState<TheHexabuttonOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ label, buttonColor, twoFactorText, lightType, lightColor, morseLetter, result, twitchCommand }), [label, buttonColor, twoFactorText, lightType, lightColor, morseLetter, result, twitchCommand]);
  useSolverModulePersistence<typeof state, TheHexabuttonOutput>({ state, onRestoreState: useCallback(saved => { if (saved.label) setLabel(saved.label); if (saved.buttonColor) setButtonColor(saved.buttonColor); if (saved.twoFactorText !== undefined) setTwoFactorText(saved.twoFactorText); if (saved.lightType !== undefined) setLightType(saved.lightType); if (saved.lightColor) setLightColor(saved.lightColor); if (saved.morseLetter) setMorseLetter(saved.morseLetter); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []), onRestoreSolution: useCallback((solution: TheHexabuttonOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.THE_HEXABUTTON, result: solution })); }, []), currentModule, setIsSolved });
  const changed = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    const twoFactorCodes = twoFactorText.split(/[ ,]+/).filter(Boolean).map(Number);
    if (twoFactorCodes.some(Number.isNaN)) return setError("Two-factor codes must be numbers");
    clearError(); setIsLoading(true);
    try {
      const response = await solveTheHexabutton(round.id, bomb.id, currentModule.id, { label, buttonColor, twoFactorCodes, lightType: lightType || null, lightColor: lightType && lightType !== "MORSE" ? lightColor : null, morseLetter: lightType === "MORSE" ? morseLetter : null });
      const command = generateTwitchCommand({ moduleType: ModuleType.THE_HEXABUTTON, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...state, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve The Hexabutton"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setLabel("JUMP"); setButtonColor("BLACK"); setTwoFactorText(""); setLightType(""); setLightColor("BLUE"); setMorseLetter("A"); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title="Button and widgets"><div className="grid gap-3 sm:grid-cols-3"><label>Label<select aria-label="Button label" value={label} onChange={event => { setLabel(event.target.value); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3">{LABELS.map(value => <option key={value}>{value.toLowerCase()}</option>)}</select></label><label>Button color<select aria-label="Button color" value={buttonColor} onChange={event => { setButtonColor(event.target.value); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3">{COLORS.map(value => <option key={value}>{value.toLowerCase()}</option>)}</select></label><label>Two-factor codes (optional)<input aria-label="Two-factor codes" value={twoFactorText} onChange={event => { setTwoFactorText(event.target.value); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3" placeholder="123456, 654321" /></label></div></SolverSection>
    {(result?.needsLightObservation || lightType) && <SolverSection title="Held-button observation"><div className="grid gap-3 sm:grid-cols-3"><label>Behavior<select aria-label="Light behavior" value={lightType} onChange={event => { setLightType(event.target.value); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3"><option value="">select after holding</option><option value="SOLID">solid</option><option value="FLICKERING">flickering</option><option value="MORSE">Morse</option></select></label>{lightType && lightType !== "MORSE" && <label>Light color<select aria-label="Light color" value={lightColor} onChange={event => { setLightColor(event.target.value); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3">{LIGHT_COLORS.map(value => <option key={value}>{value.toLowerCase()}</option>)}</select></label>}{lightType === "MORSE" && <label>Morse letter<input aria-label="Morse letter" maxLength={1} value={morseLetter} onChange={event => { setMorseLetter(event.target.value.replace(/[^a-z]/gi, "").toUpperCase()); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3 uppercase" /></label>}</div></SolverSection>}
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText={lightType ? "Calculate release" : "Determine action"} />
    <ErrorAlert error={error} />
    {result && <SolverSection title={result.action} className="border-emerald-500/40"><p className="text-4xl font-bold">{result.action}{result.suggestedTime ? ` AT ${result.suggestedTime}` : ""}</p><p className="mt-2">{result.timingCondition}</p>{result.needsLightObservation && <p className="mt-2 text-sm text-muted-foreground">Hold for at least 1.3 seconds, observe the light, enter it above, then calculate again.</p>}</SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Suggested Twitch times are parser-valid examples, but the command is conditional: use one only while that countdown value is still ahead. For a hold, send Hold first, observe the light, then calculate and send Release. Souvenir asks no question when the button is tapped; after a hold it asks for the color/behavior or Morse letter.</SolverInstructions>
  </SolverLayout>;
}
