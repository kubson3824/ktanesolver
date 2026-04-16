import { useCallback, useMemo, useRef, useState } from "react";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { solveAlphabet, type AlphabetSolveResponse } from "../../services/alphabetService";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import { Input } from "../ui/input";
import { Alert } from "../ui/alert";
import { Badge } from "../ui/badge";

interface AlphabetSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function AlphabetSolver({ bomb }: AlphabetSolverProps) {
  const [letters, setLetters] = useState<string[]>(["", "", "", ""]);
  const [result, setResult] = useState<AlphabetSolveResponse["output"] | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

  const {
    isLoading,
    error,
    isSolved,
    setIsLoading,
    setError,
    setIsSolved,
    clearError,
    reset: resetSolverState,
    currentModule,
    round,
    markModuleSolved,
  } = useSolver();

  const updateModuleAfterSolve = useRoundStore((s) => s.updateModuleAfterSolve);

  const moduleState = useMemo(
    () => ({ letters, result, twitchCommand }),
    [letters, result, twitchCommand]
  );

  const onRestoreState = useCallback(
    (state: { letters?: string[]; result?: AlphabetSolveResponse["output"] | null; twitchCommand?: string } | { input?: { letters?: string[] } }) => {
      if ("input" in state && state.input?.letters) {
        setLetters(state.input.letters);
      } else if ("letters" in state && state.letters !== undefined) {
        setLetters(state.letters);
      }
      if ("result" in state && state.result !== undefined) setResult(state.result);
      if ("twitchCommand" in state && state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    []
  );

  const onRestoreSolution = useCallback(
    (solution: AlphabetSolveResponse["output"]) => {
      if (!solution?.pressOrder) return;
      setResult(solution);
      const command = generateTwitchCommand({ moduleType: ModuleType.ALPHABET, result: solution });
      setTwitchCommand(command);
    },
    []
  );

  useSolverModulePersistence<
    { letters: string[]; result: AlphabetSolveResponse["output"] | null; twitchCommand: string },
    AlphabetSolveResponse["output"]
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; result?: unknown };
        if ("result" in anyRaw) return anyRaw.result as AlphabetSolveResponse["output"];
        if (anyRaw.output && typeof anyRaw.output === "object") return anyRaw.output as AlphabetSolveResponse["output"];
        return raw as AlphabetSolveResponse["output"];
      }
      return null;
    },
    inferSolved: (_sol, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleLetterChange = (index: number, value: string) => {
    const upper = value.toUpperCase().replace(/[^A-Z]/g, "");
    const updated = [...letters];
    updated[index] = upper.slice(-1); // keep only the last typed char
    setLetters(updated);
    if (error) clearError();
    if (upper && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const solveAlphabetModule = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }
    if (letters.some((l) => l.length !== 1)) {
      setError("Please enter all 4 letters");
      return;
    }

    clearError();
    setIsLoading(true);

    try {
      const response = await solveAlphabet(round.id, bomb.id, currentModule.id, {
        input: { letters },
      });

      const output = response.output;
      setResult(output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);

      const command = generateTwitchCommand({
        moduleType: ModuleType.ALPHABET,
        result: output,
      });
      setTwitchCommand(command);

      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { letters, result: output, twitchCommand: command },
        output,
        true,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Alphabet");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, letters, clearError, setIsLoading, setError, setIsSolved, markModuleSolved, updateModuleAfterSolve, error]);

  const reset = useCallback(() => {
    setLetters(["", "", "", ""]);
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  const allFilled = letters.every((l) => l.length === 1);

  return (
    <SolverLayout>
      {/* Module visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">ALPHABET MODULE</h3>

        {/* 4 letter button slots */}
        <div className="flex justify-center gap-3 mb-6">
          {letters.map((letter, i) => (
            <div
              key={i}
              className={`h-14 w-12 border-2 rounded flex items-center justify-center text-2xl font-bold ${
                letter
                  ? "bg-blue-600 border-blue-400 text-white"
                  : "bg-gray-700 border-gray-600 text-gray-400"
              }`}
            >
              {letter || "?"}
            </div>
          ))}
        </div>

        {/* Inputs */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 text-center">
            Enter the 4 letters shown on the module:
          </label>
          <div className="flex justify-center gap-2">
            {letters.map((letter, i) => (
              <Input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                value={letter}
                onChange={(e) => handleLetterChange(i, e.target.value)}
                className="w-12 text-center text-xl tracking-widest"
                maxLength={1}
                disabled={isLoading || isSolved}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <SolverControls
        onSolve={solveAlphabetModule}
        onReset={reset}
        isSolveDisabled={!allFilled}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Solve"
      />

      {/* Error */}
      <ErrorAlert error={error} />

      {/* Result */}
      {result && (
        <Alert variant="success" className="mb-4">
          <p className="font-semibold mb-2">Press order:</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {result.pressOrder.map((step, i) => (
              <div key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-gray-400">→</span>}
                <Badge variant="default">{step}</Badge>
              </div>
            ))}
          </div>
        </Alert>
      )}

      {/* Twitch */}
      <TwitchCommandDisplay command={twitchCommand} />

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Enter the 4 letter buttons shown on the Alphabet module.</p>
        <p>• The solver spells the longest possible word from the bank first</p>
        <p>• On ties, it picks the alphabetically earlier word</p>
        <p>• Remaining letters are pressed in alphabetical order</p>
      </div>
    </SolverLayout>
  );
}
