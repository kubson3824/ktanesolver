import { useCallback, useMemo, useState } from "react";
import { solveFlashingLights, type FlashingLightsColor, type FlashingLightsOutput } from "../../services/flashingLightsService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const COLORS: FlashingLightsColor[] = ["CYAN", "GREEN", "RED", "PURPLE", "ORANGE"];
const INITIAL: FlashingLightsColor[] = Array.from({ length: 12 }, (_, index) => COLORS[index % COLORS.length]);

export default function FlashingLightsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [top, setTop] = useState<FlashingLightsColor[]>(INITIAL);
  const [bottom, setBottom] = useState<FlashingLightsColor[]>(INITIAL);
  const [result, setResult] = useState<FlashingLightsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ top, bottom, result, twitchCommand }), [top, bottom, result, twitchCommand]);
  useSolverModulePersistence<typeof state, FlashingLightsOutput>({ state,
    onRestoreState: useCallback((saved) => { if (saved.top) setTop(saved.top); if (saved.bottom) setBottom(saved.bottom); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []),
    onRestoreSolution: useCallback((solution: FlashingLightsOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.FLASHING_LIGHTS, result: solution })); }, []), currentModule, setIsSolved,
  });
  const change = (which: "top" | "bottom", index: number, color: FlashingLightsColor) => {
    const sequence = [...(which === "top" ? top : bottom)]; sequence[index] = color;
    (which === "top" ? setTop : setBottom)(sequence); setResult(null); setTwitchCommand(""); clearError();
  };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const input = { top, bottom };
      const response = await solveFlashingLights(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.FLASHING_LIGHTS, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Flashing Lights"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setTop(INITIAL); setBottom(INITIAL); setResult(null); setTwitchCommand(""); resetSolverState(); };
  const row = (label: string, which: "top" | "bottom", sequence: FlashingLightsColor[]) => <SolverSection title={`${label} LED — 12 flashes`}><div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{sequence.map((color, index) => <label key={index} className="text-xs font-medium">{index + 1}<select aria-label={`${label} flash ${index + 1}`} value={color} onChange={(event) => change(which, index, event.target.value as FlashingLightsColor)} disabled={isLoading || isSolved} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-1">{COLORS.map((option) => <option key={option}>{option}</option>)}</select></label>)}</div></SolverSection>;

  return <SolverLayout>{row("Top", "top", top)}{row("Bottom", "bottom", bottom)}
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Calculate buttons" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Press in order" className="border-emerald-500/40"><p className="text-3xl font-bold">{result.presses.join(" → ")}</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Press the top LED’s result first, then the bottom LED’s result. A wrong button regenerates both complete sequences, so reset this solver and replace every flash before retrying.</SolverInstructions>
  </SolverLayout>;
}
