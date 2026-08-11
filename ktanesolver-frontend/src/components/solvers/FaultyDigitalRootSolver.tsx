import { useCallback, useMemo, useState } from "react";
import { solveFaultyDigitalRoot, type FaultyDigitalRootOutput } from "../../services/faultyDigitalRootService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const LABELS = ["First", "Second", "Third", "Broken"];

export default function FaultyDigitalRootSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [result, setResult] = useState<FaultyDigitalRootOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ digits, result, twitchCommand }), [digits, result, twitchCommand]);
  useSolverModulePersistence<typeof state, FaultyDigitalRootOutput>({
    state,
    onRestoreState: useCallback(saved => { if (saved.digits) setDigits(saved.digits); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []),
    onRestoreSolution: useCallback((solution: FaultyDigitalRootOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.FAULTY_DIGITAL_ROOT, result: solution })); }, []),
    currentModule, setIsSolved,
  });
  const setDigit = (index: number, value: string) => {
    setDigits(current => current.map((digit, position) => position === index ? value : digit));
    setResult(null); setTwitchCommand(""); setIsSolved(false); clearError();
  };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (digits.some(digit => !/^\d$/.test(digit))) return setError("Enter all four single displayed digits");
    clearError(); setIsLoading(true);
    try {
      const response = await solveFaultyDigitalRoot(round.id, bomb.id, currentModule.id,
        Number(digits[0]), Number(digits[1]), Number(digits[2]), Number(digits[3]));
      const command = generateTwitchCommand({ moduleType: ModuleType.FAULTY_DIGITAL_ROOT, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { digits, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Faulty Digital Root"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setDigits(["", "", "", ""]); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title="Displayed digits"><div className="grid grid-cols-4 gap-2">
      {digits.map((digit, index) => <label key={LABELS[index]}>{LABELS[index]}<input aria-label={`${LABELS[index]} display`} type="number" min={0} max={9} value={digit} onChange={event => setDigit(index, event.target.value)} className="mt-1 h-11 w-full rounded border bg-background px-3" /></label>)}
    </div></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Calculate root" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Press in order" className="border-emerald-500/40"><p className="font-mono text-4xl font-bold">{result.presses.join(" ")}</p><p className="mt-2 text-sm">Digital root {result.root} → binary {result.binary}</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>The broken display chooses the operation: even means additive digital root; odd means multiplicative digital root. Enter all four binary bits, including leading NO presses. The Twitch command is safe only before any manual button presses. A strike regenerates every displayed digit. Faulty Digital Root is not a Souvenir candidate.</SolverInstructions>
  </SolverLayout>;
}
