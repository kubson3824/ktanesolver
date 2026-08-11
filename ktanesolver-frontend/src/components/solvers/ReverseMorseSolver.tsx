import { useCallback, useMemo, useState } from "react";
import {
  REVERSE_MORSE_COLORS, REVERSE_MORSE_SYMBOLS, solveReverseMorse,
  type ReverseMorseColor, type ReverseMorseObservation, type ReverseMorseOutput, type ReverseMorseSymbol,
} from "../../services/reverseMorseService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const initialMessage = (): ReverseMorseObservation[] =>
  Array.from({ length: 6 }, () => ({ symbol: "A", color: "RED" }));

export default function ReverseMorseSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [firstMessage, setFirstMessage] = useState<ReverseMorseObservation[]>(initialMessage);
  const [secondMessage, setSecondMessage] = useState<ReverseMorseObservation[]>(initialMessage);
  const [currentStage, setCurrentStage] = useState(1);
  const [result, setResult] = useState<ReverseMorseOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ firstMessage, secondMessage, currentStage, result, twitchCommand }), [firstMessage, secondMessage, currentStage, result, twitchCommand]);

  useSolverModulePersistence<typeof state, ReverseMorseOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      if (Array.isArray(saved.firstMessage) && saved.firstMessage.length === 6) setFirstMessage(saved.firstMessage);
      if (Array.isArray(saved.secondMessage) && saved.secondMessage.length === 6) setSecondMessage(saved.secondMessage);
      if (saved.currentStage === 1 || saved.currentStage === 2) setCurrentStage(saved.currentStage);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: ReverseMorseOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.REVERSE_MORSE, result: solution }));
    }, []),
    currentModule, setIsSolved,
  });

  const changed = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const updateObservation = (message: 1 | 2, index: number, update: Partial<ReverseMorseObservation>) => {
    const setter = message === 1 ? setFirstMessage : setSecondMessage;
    setter((current) => current.map((observation, position) => position === index ? { ...observation, ...update } : observation));
    changed();
  };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const input = { firstMessage, secondMessage, currentStage };
      const response = await solveReverseMorse(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.REVERSE_MORSE, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Reverse Morse"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setFirstMessage(initialMessage()); setSecondMessage(initialMessage()); setCurrentStage(1); setResult(null); setTwitchCommand(""); resetSolverState(); };

  const messageEditor = (message: 1 | 2, observations: ReverseMorseObservation[]) => <fieldset className="rounded-md border border-border p-3" disabled={isLoading || isSolved}>
    <legend className="px-1 text-sm font-semibold">{message === 1 ? "First" : "Second"} message</legend>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{observations.map((observation, index) => <div key={index} className="grid grid-cols-2 gap-2">
      <label className="text-sm font-medium">Symbol {index + 1}<select aria-label={`${message === 1 ? "First" : "Second"} message symbol ${index + 1}`} value={observation.symbol} onChange={(event) => updateObservation(message, index, { symbol: event.target.value as ReverseMorseSymbol })} className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3">{REVERSE_MORSE_SYMBOLS.map((symbol) => <option key={symbol}>{symbol}</option>)}</select></label>
      <label className="text-sm font-medium">Color<select aria-label={`${message === 1 ? "First" : "Second"} message color ${index + 1}`} value={observation.color} onChange={(event) => updateObservation(message, index, { color: event.target.value as ReverseMorseColor })} className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3">{REVERSE_MORSE_COLORS.map((color) => <option key={color}>{color}</option>)}</select></label>
    </div>)}</div>
  </fieldset>;

  return <SolverLayout>
    <SolverSection title="Cycling screen observations" description="Record each six-character cycle from left to right in playback order."><div className="space-y-4">{messageEditor(1, firstMessage)}{messageEditor(2, secondMessage)}</div></SolverSection>
    <SolverSection title="Active transmission"><label className="text-sm font-medium">Current stage<select aria-label="Current transmission stage" value={currentStage} onChange={(event) => { setCurrentStage(Number(event.target.value)); changed(); }} disabled={isLoading || isSolved} className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3"><option value={1}>First message (then second)</option><option value={2}>Second message only (retry)</option></select></label></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Decode and transmit" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Decoded messages" className="border-emerald-500/40"><div className="grid gap-3 sm:grid-cols-2"><div><p className="text-sm text-muted-foreground">First</p><p className="font-mono text-2xl font-bold">{result.firstMessage}</p></div><div><p className="text-sm text-muted-foreground">Second</p><p className="font-mono text-2xl font-bold">{result.secondMessage}</p></div></div></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Each colored symbol decodes through the manual table. The command enters Morse, presses Br after every character, and Tx after each message. A strike clears only the current six-character entry; choose “Second message only” after a stage-two strike so the accepted first message is not replayed.</SolverInstructions>
  </SolverLayout>;
}
