import { useCallback, useMemo, useState } from "react";
import { solveSimonSends, type SimonSendsInput, type SimonSendsOutput } from "../../services/simonSendsService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const COLORS = ["red", "green", "blue"] as const;
const LETTERS = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
const BUTTON_NAMES: Record<string, string> = {
  K: "Black", B: "Blue", G: "Green", C: "Cyan", R: "Red", M: "Magenta", Y: "Yellow", W: "White",
};

export default function SimonSendsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [letters, setLetters] = useState(["", "", ""]);
  const [result, setResult] = useState<SimonSendsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ letters, result, twitchCommand }), [letters, result, twitchCommand]);

  const onRestoreState = useCallback((state: Partial<typeof moduleState> & { input?: Partial<SimonSendsInput> }) => {
    const input = state.input;
    if (state.letters?.length === 3) setLetters(state.letters);
    else if (input) setLetters([input.redLetter ?? "", input.greenLetter ?? "", input.blueLetter ?? ""]);
    if (state.result !== undefined) setResult(state.result);
    if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
  }, []);

  const onRestoreSolution = useCallback((solution: SimonSendsOutput) => {
    if (!solution) return;
    setResult(solution);
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.SIMON_SENDS, result: solution }));
  }, []);

  useSolverModulePersistence<typeof moduleState, SimonSendsOutput>({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as SimonSendsOutput & { output?: SimonSendsOutput };
      return value.output ?? value;
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!letters.every(Boolean)) return setError("Select all three received letters");
    if (new Set(letters).size !== 3) return setError("The three received letters must be different");
    clearError();
    setIsLoading(true);
    try {
      const input = { redLetter: letters[0], greenLetter: letters[1], blueLetter: letters[2] };
      const response = await solveSimonSends(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.SIMON_SENDS, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { letters, result: response.output, twitchCommand: command }, response.output, true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Simon Sends");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, letters, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setLetters(["", "", ""]);
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Received letters" description="Separate the mixed flashes into red, green, and blue, then decode each as Morse.">
      <div className="grid gap-3 sm:grid-cols-3">
        {COLORS.map((color, index) => <label key={color} className="grid gap-1 text-sm font-medium capitalize">
          {color} letter
          <select
            aria-label={`${color} received letter`}
            value={letters[index]}
            onChange={(event) => { setLetters((current) => current.map((letter, position) => position === index ? event.target.value : letter)); clearError(); }}
            disabled={isLoading || isSolved}
            className="rounded-md border bg-background px-3 py-2"
          >
            <option value="">Select</option>
            {LETTERS.map((letter) => <option key={letter}>{letter}</option>)}
          </select>
        </label>)}
      </div>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={!letters.every(Boolean)} isLoading={isLoading} isSolved={isSolved} solveText="Calculate transmission" />
    <ErrorAlert error={error} />

    {result && <SolverSection title="Transmit" className="border-emerald-500/40">
      <p className="text-center">Derived letters: <strong className="font-mono text-xl tracking-widest">{result.solutionLetters}</strong></p>
      <ol className="mt-3 flex flex-wrap justify-center gap-2" aria-label="Button sequence">
        {result.transmission.split("").map((code, index) => <li key={index} className="rounded-md border px-2 py-1 font-medium">{BUTTON_NAMES[code]}</li>)}
      </ol>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>The returned sequence starts all three Morse codes together; other alignments may also be accepted by the module.</SolverInstructions>
  </SolverLayout>;
}
