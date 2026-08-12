import { useCallback, useMemo, useState } from "react";
import { solveRequestedModule } from "../../services/requestedModulesService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity, ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

export interface RequestedModuleSolverProps {
  bomb: BombEntity | null | undefined;
  moduleType: ModuleType;
  name: string;
  example: Record<string, unknown>;
  instructions: string;
  symbolImages?: string[];
}

export default function RequestedModuleSolver({ bomb, moduleType, name, example, instructions, symbolImages }: RequestedModuleSolverProps) {
  const initial = useMemo(() => JSON.stringify(example, null, 2), [example]);
  const [input, setInput] = useState(initial);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((s) => s.updateModuleAfterSolve);
  const state = useMemo(() => ({ input, result, twitchCommand }), [input, result, twitchCommand]);
  useSolverModulePersistence<typeof state, Record<string, unknown>>({
    state,
    onRestoreState: useCallback((saved) => { if (saved.input) setInput(saved.input); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []),
    onRestoreSolution: useCallback((solution: Record<string, unknown>) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType, result: solution })); }, [moduleType]),
    currentModule,
    setIsSolved,
  });
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    let payload: Record<string, unknown>;
    try { payload = JSON.parse(input) as Record<string, unknown>; } catch { return setError("Input must be valid JSON"); }
    clearError(); setIsLoading(true);
    try {
      const response = await solveRequestedModule(round.id, bomb.id, currentModule.id, payload);
      const command = generateTwitchCommand({ moduleType, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { input, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : `Failed to solve ${name}`); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setInput(initial); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    {symbolImages && <SolverSection title="Symbol reference"><div className="grid grid-cols-5 gap-2">{symbolImages.map((src, i) => <figure key={src} className="text-center"><img src={src} alt={`Symbol ${i + 1}`} className="mx-auto h-16 w-16 object-contain"/><figcaption>{i + 1}</figcaption></figure>)}</div></SolverSection>}
    <SolverSection title={`${name} input`}><textarea aria-label={`${name} input`} rows={Math.min(18, Math.max(7, input.split("\n").length + 1))} value={input} onChange={(e) => { setInput(e.target.value); setResult(null); setTwitchCommand(""); setIsSolved(false); clearError(); }} className="w-full rounded border bg-background p-3 font-mono text-sm" spellCheck={false}/></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved}/><ErrorAlert error={error}/>
    {result && <SolverSection title="Solution" className="border-emerald-500/40"><pre className="overflow-auto whitespace-pre-wrap text-sm">{JSON.stringify(result, null, 2)}</pre></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand}/>}<SolverInstructions>{instructions} The form is prefilled with the exact backend field structure; replace the sample values with the module's current display.</SolverInstructions>
  </SolverLayout>;
}
