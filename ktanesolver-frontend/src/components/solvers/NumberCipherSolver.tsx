import { useCallback, useMemo, useState } from "react";
import {
  NUMBER_CIPHER_LIGHTS, solveNumberCipher,
  type NumberCipherInput, type NumberCipherLight, type NumberCipherOutput,
} from "../../services/numberCipherService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

type SavedState = Partial<NumberCipherInput> & { input?: Partial<NumberCipherInput>; result?: NumberCipherOutput | null; twitchCommand?: string };

export default function NumberCipherSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [digits, setDigits] = useState([1, 1, 1]);
  const [lights, setLights] = useState<NumberCipherLight[]>(["OFF", "OFF", "OFF"]);
  const [result, setResult] = useState<NumberCipherOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ digits, lights, result, twitchCommand }), [digits, lights, result, twitchCommand]);

  useSolverModulePersistence<SavedState, NumberCipherOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      const input = saved.input ?? saved;
      if (input.digits?.length === 3) setDigits(input.digits);
      if (input.lights?.length === 3) setLights(input.lights);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: NumberCipherOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.THE_NUMBER_CIPHER, result: solution }));
    }, []),
    currentModule,
    setIsSolved,
  });

  const clearResult = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    const input: NumberCipherInput = { digits, lights };
    clearError(); setIsLoading(true);
    try {
      const response = await solveNumberCipher(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.THE_NUMBER_CIPHER, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve The Number Cipher"); }
    finally { setIsLoading(false); }
  };
  const reset = () => {
    setDigits([1, 1, 1]); setLights(["OFF", "OFF", "OFF"]);
    setResult(null); setTwitchCommand(""); resetSolverState();
  };

  return <SolverLayout>
    <SolverSection title="Current display" description="Enter the three currently visible cube digits and each light from left to right.">
      <div className="grid grid-cols-3 gap-3">
        {digits.map((digit, index) => <label key={`digit-${index}`} className="text-sm font-medium">Cube {index + 1}
          <input aria-label={`Cube ${index + 1} digit`} type="number" min={1} max={9} value={digit} onChange={(event) => { const next = [...digits]; next[index] = Number(event.target.value); setDigits(next); clearResult(); }} disabled={isLoading || isSolved} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3" />
        </label>)}
        {lights.map((light, index) => <label key={`light-${index}`} className="text-sm font-medium">Light {index + 1}
          <select aria-label={`Light ${index + 1} color`} value={light} onChange={(event) => { const next = [...lights]; next[index] = event.target.value as NumberCipherLight; setLights(next); clearResult(); }} disabled={isLoading || isSolved} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3">
            {NUMBER_CIPHER_LIGHTS.map((color) => <option key={color}>{color}</option>)}
          </select>
        </label>)}
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Calculate digit" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Answer" className="border-emerald-500/40">
      <p className="text-center text-4xl font-bold">{result.answer}</p>
      <p className="mt-2 text-center text-sm text-muted-foreground">Venn region {result.rule}</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>The module can rotate its cubes and change its lights every 20–40 seconds. If it resets—or locks after a strike—replace all six observations and solve again.</SolverInstructions>
  </SolverLayout>;
}
