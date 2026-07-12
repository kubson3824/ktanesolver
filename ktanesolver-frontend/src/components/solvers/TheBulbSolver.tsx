import { useCallback, useMemo, useState } from "react";
import { solveTheBulb, type BulbColor, type TheBulbInput, type TheBulbOutput } from "../../services/theBulbService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, useSolver, useSolverModulePersistence } from "../common";
import { Button } from "../ui/button";

const COLORS: BulbColor[] = ["BLUE", "GREEN", "PURPLE", "RED", "WHITE", "YELLOW"];
const COLOR_CLASS: Record<BulbColor, string> = {
  BLUE: "#3b82f6", GREEN: "#22c55e", PURPLE: "#a855f7", RED: "#ef4444", WHITE: "#f8fafc", YELLOW: "#eab308",
};

function Bulb({ color, opaque, lightOn }: { color: BulbColor; opaque: boolean; lightOn: boolean }) {
  return <div className={`mx-auto w-44 rounded-xl border p-3 text-center transition-all ${lightOn ? "border-amber-400/70 bg-amber-100/40 shadow-[0_0_28px_rgba(250,204,21,.35)] dark:bg-amber-400/10" : "bg-muted/60"}`}>
    <svg viewBox="0 0 120 150" className="mx-auto h-36 w-28" style={{ filter: lightOn ? `drop-shadow(0 0 12px ${COLOR_CLASS[color]})` : "grayscale(.45)" }} role="img" aria-label={`${color.toLowerCase()} ${opaque ? "opaque" : "see-through"} bulb, light ${lightOn ? "on" : "off"}`}>
      {lightOn && <><circle cx="60" cy="52" r="50" fill={COLOR_CLASS[color]} opacity=".35" /><path d="M60 0v12M10 15l10 10M110 15l-10 10M0 58h14M120 58h-14" stroke={COLOR_CLASS[color]} strokeWidth="5" strokeLinecap="round" /></>}
      <path d="M60 8c-27 0-44 19-44 42 0 18 10 29 22 41 5 5 7 10 7 16h30c0-6 2-11 7-16 12-12 22-23 22-41C104 27 87 8 60 8Z" fill={COLOR_CLASS[color]} fillOpacity={lightOn ? (opaque ? ".95" : ".7") : (opaque ? ".45" : ".16")} stroke="currentColor" strokeWidth="3" />
      <path d="M43 108h34M45 119h30M49 130h22M53 140h14" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    </svg>
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-widest ${lightOn ? "bg-amber-400 text-amber-950" : "bg-slate-700 text-white"}`}>LIGHT {lightOn ? "ON" : "OFF"}</span>
  </div>;
}

export default function TheBulbSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [color, setColor] = useState<BulbColor>("BLUE");
  const [opaque, setOpaque] = useState(false);
  const [lightOn, setLightOn] = useState(true);
  const [result, setResult] = useState<TheBulbOutput | null>(null);
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ color, opaque, lightOn, result }), [color, opaque, lightOn, result]);

  useSolverModulePersistence<typeof moduleState, TheBulbOutput>({
    state: moduleState,
    onRestoreState: useCallback((state) => {
      if (state.color && COLORS.includes(state.color)) setColor(state.color);
      if (typeof state.opaque === "boolean") setOpaque(state.opaque);
      if (typeof state.lightOn === "boolean") setLightOn(state.lightOn);
      if (state.result) setResult(state.result);
    }, []),
    onRestoreSolution: useCallback((solution: TheBulbOutput) => setResult(solution), []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule, setIsSolved,
  });

  const submit = useCallback(async (input: TheBulbInput) => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveTheBulb(round.id, bomb.id, currentModule.id, input);
      setResult(response.output); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { color, opaque, lightOn, result: response.output }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve The Bulb"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, color, opaque, lightOn, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => { setColor("BLUE"); setOpaque(false); setLightOn(true); setResult(null); resetSolverState(); }, [resetSolverState]);
  const disabled = isLoading || isSolved || result !== null;

  return <SolverLayout>
    <SolverSection title="Bulb appearance" description="Enter the bulb's initial state before touching the module.">
      <Bulb color={color} opaque={opaque} lightOn={lightOn} />
      <fieldset disabled={disabled} className="mt-3">
        <legend className="mb-2 text-sm font-medium">Color</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {COLORS.map((value) => <Button key={value} type="button" className="h-12 justify-center gap-2 px-2" variant={color === value ? "default" : "outline"} onClick={() => setColor(value)} aria-pressed={color === value}><span className="h-5 w-5 shrink-0 rounded-full border border-black/30 shadow-sm" style={{ backgroundColor: COLOR_CLASS[value] }} aria-hidden />{value[0] + value.slice(1).toLowerCase()}</Button>)}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button type="button" variant={!opaque ? "default" : "outline"} onClick={() => setOpaque(false)} aria-pressed={!opaque}>See-through</Button>
          <Button type="button" variant={opaque ? "default" : "outline"} onClick={() => setOpaque(true)} aria-pressed={opaque}>Opaque</Button>
          <Button type="button" variant={lightOn ? "default" : "outline"} onClick={() => setLightOn(true)} aria-pressed={lightOn}>Light on</Button>
          <Button type="button" variant={!lightOn ? "default" : "outline"} onClick={() => setLightOn(false)} aria-pressed={!lightOn}>Light off</Button>
        </div>
      </fieldset>
    </SolverSection>

    <SolverControls onSolve={() => submit({ color, opaque, lightOn, observation: null })} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={result !== null} solveText="Start procedure" />
    <ErrorAlert error={error} />

    {result && <SolverSection title={isSolved ? "Procedure complete" : "Follow these actions"} className={isSolved ? "border-emerald-500/40" : ""}>
      <ol className="space-y-2">
        {result.actions.map((action, index) => <li key={`${index}-${action}`} className={`rounded-md border px-3 py-2 ${index < result.continueFrom ? "text-muted-foreground line-through" : "border-primary/40 bg-primary/5 font-semibold"}`}><span className="mr-2 tabular-nums">{index + 1}.</span>{action}</li>)}
      </ol>
      {result.prompt && <div className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
        <p className="mb-3 text-center font-semibold">{result.prompt}</p>
        <div className="grid grid-cols-2 gap-2"><Button onClick={() => submit({ color: null, opaque: null, lightOn: null, observation: true })} disabled={isLoading}>Yes</Button><Button variant="outline" onClick={() => submit({ color: null, opaque: null, lightOn: null, observation: false })} disabled={isLoading}>No</Button></div>
      </div>}
      {isSolved && <p className="mt-3 text-center font-semibold text-emerald-700 dark:text-emerald-400">Module solved.</p>}
    </SolverSection>}
    <SolverInstructions>Perform each instruction in order. If a wrong button causes a strike, ignore it and continue; if the bulb was moved at the wrong time, undo that move before continuing.</SolverInstructions>
  </SolverLayout>;
}
