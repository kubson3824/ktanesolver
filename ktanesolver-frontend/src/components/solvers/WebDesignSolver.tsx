import { useCallback, useMemo, useState } from "react";

import { cn } from "../../lib/cn";
import { solveWebDesign, type WebDesignOutput } from "../../services/webDesignService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverResult, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const APPEARANCES = [
  { value: true, label: "Colored / white", colors: ["bg-emerald-500", "bg-amber-500", "bg-red-500"] },
  { value: false, label: "Gray / black", colors: ["bg-gray-500", "bg-gray-500", "bg-gray-500"] },
];

export default function WebDesignSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [css, setCss] = useState("");
  const [coloredButtons, setColoredButtons] = useState<boolean | null>(null);
  const [result, setResult] = useState<WebDesignOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ css, coloredButtons, result }), [css, coloredButtons, result]);

  useSolverModulePersistence<typeof moduleState, WebDesignOutput>({
    state: moduleState,
    onRestoreState: useCallback((state) => {
      if (state.css) setCss(state.css);
      if (state.coloredButtons !== undefined) setColoredButtons(state.coloredButtons);
      if (state.result !== undefined) setResult(state.result);
    }, []),
    onRestoreSolution: useCallback((solution: WebDesignOutput) => setResult(solution), []),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!css.trim() || coloredButtons === null) return setError("Enter the CSS and select the button appearance");
    clearError(); setIsLoading(true);
    try {
      const input = { css, coloredButtons };
      const response = await solveWebDesign(round.id, bomb.id, currentModule.id, input);
      setResult(response.output); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Web Design"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, css, coloredButtons, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setCss(""); setColoredButtons(null); setResult(null); resetSolverState();
  }, [resetSolverState]);

  const disabled = isLoading || isSolved;
  const twitchCommand = result ? `!number ${result.answer === "ACCEPT" ? "acc" : result.answer === "CONSIDER" ? "con" : "rej"}` : "";

  return <SolverLayout>
    <SolverSection title="CSS snippet" description="Copy the selector, curly braces, and every displayed property.">
      <textarea
        value={css}
        onChange={(event) => { setCss(event.target.value); clearError(); }}
        rows={9}
        disabled={disabled}
        aria-label="Displayed CSS snippet"
        placeholder={'body.post {\n  color: blue;\n  margin: 1em;\n}'}
        spellCheck={false}
        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
      />
    </SolverSection>
    <SolverSection title="Button appearance" description="In colorblind mode, white means colored and black means gray.">
      <fieldset className="grid gap-2 sm:grid-cols-2">
        <legend className="sr-only">Button appearance</legend>
        {APPEARANCES.map((appearance) => <label key={String(appearance.value)} className={cn(
          "cursor-pointer rounded-lg border p-3 text-center text-sm font-medium",
          coloredButtons === appearance.value && "border-primary bg-primary/5",
        )}>
          <input className="sr-only" type="radio" name="buttonAppearance" checked={coloredButtons === appearance.value} onChange={() => { setColoredButtons(appearance.value); clearError(); }} disabled={disabled} />
          <span className="mb-2 flex justify-center gap-2" aria-hidden>
            {appearance.colors.map((color, index) => <span key={index} className={cn("h-8 w-8 rounded border border-black/30", color)} />)}
          </span>
          {appearance.label}
        </label>)}
      </fieldset>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={!css.trim() || coloredButtons === null} isLoading={isLoading} isSolved={isSolved} solveText="Score CSS" />
    <ErrorAlert error={error} />
    {result && <SolverResult
      title={result.answer[0] + result.answer.slice(1).toLowerCase()}
      description={`${result.site} · target ${result.colorTarget}\nScore ${result.rawScore}${result.adjustedScore !== result.rawScore ? ` → ${result.adjustedScore}` : ""} · digit ${result.digitalRoot}`}
    />}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Press ✓ for Accept, △ for Consider, or ✕ for Reject.</SolverInstructions>
  </SolverLayout>;
}
