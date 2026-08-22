import { useCallback, useMemo, useState } from "react";
import { solveUnfairCipher, type UnfairCipherOutput } from "../../services/unfairCipherService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

export default function UnfairCipherSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [encryptedMessage, setEncryptedMessage] = useState("");
  const [displayedModuleId, setDisplayedModuleId] = useState(1);
  const [strikeCount, setStrikeCount] = useState(bomb?.strikes ?? 0);
  const [result, setResult] = useState<UnfairCipherOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ encryptedMessage, displayedModuleId, strikeCount, result, twitchCommand }), [encryptedMessage, displayedModuleId, strikeCount, result, twitchCommand]);
  useSolverModulePersistence<typeof state, UnfairCipherOutput>({
    state,
    onRestoreState: useCallback(saved => {
      if (saved.encryptedMessage) setEncryptedMessage(saved.encryptedMessage);
      if (saved.displayedModuleId) setDisplayedModuleId(saved.displayedModuleId);
      if (saved.strikeCount !== undefined) setStrikeCount(saved.strikeCount);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: UnfairCipherOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.UNFAIR_CIPHER, result: solution }));
    }, []),
    currentModule,
    setIsSolved,
  });
  const changed = () => { setResult(null); setTwitchCommand(""); setIsSolved(false); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!/^[A-Za-z]{12}$/.test(encryptedMessage)) return setError("Enter the 12-letter encrypted message");
    clearError(); setIsLoading(true);
    try {
      const response = await solveUnfairCipher(round.id, bomb.id, currentModule.id, encryptedMessage, displayedModuleId, strikeCount);
      const command = generateTwitchCommand({ moduleType: ModuleType.UNFAIR_CIPHER, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { encryptedMessage, displayedModuleId, strikeCount, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Unfair Cipher"); }
    finally { setIsLoading(false); }
  };
  const reset = () => {
    setEncryptedMessage(""); setDisplayedModuleId(1); setStrikeCount(bomb?.strikes ?? 0); setResult(null); setTwitchCommand(""); resetSolverState();
  };
  return <SolverLayout>
    <SolverSection title="Displayed cipher">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="sm:col-span-3">Encrypted message<input aria-label="Encrypted message" value={encryptedMessage} maxLength={12} onChange={event => { setEncryptedMessage(event.target.value.replace(/[^a-z]/gi, "").toUpperCase()); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3 font-mono uppercase tracking-[0.25em]" placeholder="ABCDEFGHIJKL" /></label>
        <label>Module ID<input aria-label="Module ID" type="number" min={1} value={displayedModuleId} onChange={event => { setDisplayedModuleId(Number(event.target.value)); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3" /></label>
        <label>Current strikes<input aria-label="Current strikes" type="number" min={0} value={strikeCount} onChange={event => { setStrikeCount(Number(event.target.value)); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3" /></label>
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Decrypt instructions" />
    <ErrorAlert error={error} />
    {result && <>
      <SolverSection title="Keys and decrypted instructions" className="border-emerald-500/40">
        <div className="grid gap-2 text-sm sm:grid-cols-4"><p><span className="text-muted-foreground">Key A</span><br /><strong className="font-mono">{result.keyA}</strong></p><p><span className="text-muted-foreground">Key B</span><br /><strong className="font-mono">{result.keyB}</strong></p><p><span className="text-muted-foreground">Key C</span><br /><strong className="font-mono">{result.keyC}</strong></p><p><span className="text-muted-foreground">Caesar offset</span><br /><strong>{result.caesarOffset}</strong></p></div>
        <p className="mt-4 font-mono text-2xl font-bold">{result.instructions.join(" · ")}</p>
      </SolverSection>
      <SolverSection title={result.instantSolve ? "Press until BOB solves the module" : "Press in order"}>
        <ol className="space-y-2">{result.actions.map((action, index) => <li key={index}><strong>{index + 1}. {action.button}</strong> <span className="font-mono text-muted-foreground">({action.instruction})</span>{action.timerSeconds.length > 0 && <span className="block text-sm">when seconds show {action.timerSeconds.join(", ")}</span>}</li>)}</ol>
      </SolverSection>
    </>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Use the module ID shown above the center button and the current bomb strike count. The date key comes from the round start time. A strike resets the module, so update the strike count and re-enter the newly encrypted message. Souvenir may ask for any of the twelve original encrypted letters.</SolverInstructions>
  </SolverLayout>;
}
