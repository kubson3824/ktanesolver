import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveEmojiMath, type EmojiMathOutput, type EmojiMathInput } from "../../services/emojiMathService";
import { generateTwitchCommand } from "../../utils/twitchCommands";

function isValidEmojiMathOutput(obj: unknown): obj is EmojiMathOutput {
  return (
    obj != null &&
    typeof obj === "object" &&
    "result" in obj &&
    typeof (obj as EmojiMathOutput).result === "number" &&
    "translatedEquation" in obj &&
    typeof (obj as EmojiMathOutput).translatedEquation === "string"
  );
}
import { 
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverControls
} from "../common";

interface EmojiMathSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function EmojiMathSolver({ bomb }: EmojiMathSolverProps) {
  const [emojiEquation, setEmojiEquation] = useState<string>("");
  const [result, setResult] = useState<EmojiMathOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  // Use the common solver hook for shared state
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

  const moduleState = useMemo(
    () => ({ emojiEquation, result, twitchCommand }),
    [emojiEquation, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      emojiEquation?: string;
      input?: { emojiEquation?: string };
      result?: EmojiMathOutput | null;
      twitchCommand?: string;
    }) => {
      const equation = state.input?.emojiEquation ?? state.emojiEquation;
      if (equation !== undefined) setEmojiEquation(equation);
      if (state.result !== undefined && isValidEmojiMathOutput(state.result)) {
        setResult(state.result);
        if (state.twitchCommand) setTwitchCommand(state.twitchCommand);
      } else {
        if (state.result !== undefined) setResult(null);
        setTwitchCommand("");
      }
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (solution: EmojiMathOutput) => {
      if (!isValidEmojiMathOutput(solution)) return;
      setResult(solution);
      const command = generateTwitchCommand({
        moduleType: ModuleType.EMOJI_MATH,
        result: { answer: String(solution.result) },
      });
      setTwitchCommand(command);
    },
  []);

  useSolverModulePersistence<
    { emojiEquation: string; result: EmojiMathOutput | null; twitchCommand: string },
    EmojiMathOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw !== "object") return null;
      const anyRaw = raw as { output?: unknown; result?: unknown; solution?: unknown };
      let candidate: unknown = null;
      if (anyRaw.output && typeof anyRaw.output === "object") candidate = anyRaw.output;
      else if (anyRaw.result && typeof anyRaw.result === "object") candidate = anyRaw.result;
      else if (anyRaw.solution && typeof anyRaw.solution === "object") candidate = anyRaw.solution;
      else candidate = raw;
      return isValidEmojiMathOutput(candidate) ? candidate : null;
    },
    inferSolved: (_solution, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleEmojiEquationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow emojis and operators
    setEmojiEquation(value);
    clearError();
  };

  const solveEmojiMathModule = async () => {
    if (!emojiEquation.trim()) {
      setError("Please enter an emoji equation");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const input: EmojiMathInput = {
        emojiEquation: emojiEquation.trim()
      };
      
      const response = await solveEmojiMath(round.id, bomb.id, currentModule.id, { input });
      
      if (response.output && isValidEmojiMathOutput(response.output)) {
        setResult(response.output);
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
        const command = generateTwitchCommand({
          moduleType: ModuleType.EMOJI_MATH,
          result: { answer: String(response.output.result) },
        });
        setTwitchCommand(command);
      } else {
        setResult(null);
        setTwitchCommand("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve emoji math");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setEmojiEquation("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && !isSolved) {
      solveEmojiMathModule();
    }
  };

  const insertEmoji = (emoji: string) => {
    if (!isLoading && !isSolved) {
      setEmojiEquation(prev => prev + emoji);
      clearError();
    }
  };

  return (
    <SolverLayout>
      {/* Emoji Math Module Visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">EMOJI MATH MODULE</h3>
        
        {/* Display area */}
        <div className="bg-black rounded-lg p-4 mb-4 min-h-[120px] flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">Enter Emoji Equation</div>
            <input
              type="text"
              value={emojiEquation}
              onChange={handleEmojiEquationChange}
              onKeyPress={handleKeyPress}
              placeholder="e.g., )::(+)=:("
              className="input input-bordered input-lg font-mono text-center text-2xl w-full max-w-xs bg-gray-900 text-gray-100 border-gray-700 focus:border-primary"
              disabled={isLoading || isSolved}
            />
            <div className="text-xs text-gray-500 mt-2">
              Format: emoji [+,-,*,/] emoji
            </div>
          </div>
        </div>

        {/* Emoji buttons */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          <button 
            onClick={() => insertEmoji(":)")} 
            className="btn btn-sm bg-gray-700 hover:bg-gray-600 text-xl"
            disabled={isLoading || isSolved}
          >:)</button>
          <button 
            onClick={() => insertEmoji("=(")} 
            className="btn btn-sm bg-gray-700 hover:bg-gray-600 text-xl"
            disabled={isLoading || isSolved}
          >=(</button>
          <button 
            onClick={() => insertEmoji("(:")} 
            className="btn btn-sm bg-gray-700 hover:bg-gray-600 text-xl"
            disabled={isLoading || isSolved}
          >(:</button>
          <button 
            onClick={() => insertEmoji(")=")} 
            className="btn btn-sm bg-gray-700 hover:bg-gray-600 text-xl"
            disabled={isLoading || isSolved}
          >)=</button>
          <button 
            onClick={() => insertEmoji(":(")} 
            className="btn btn-sm bg-gray-700 hover:bg-gray-600 text-xl"
            disabled={isLoading || isSolved}
          >:(</button>
          <button 
            onClick={() => insertEmoji("):")} 
            className="btn btn-sm bg-gray-700 hover:bg-gray-600 text-xl"
            disabled={isLoading || isSolved}
          >):</button>
          <button 
            onClick={() => insertEmoji("=)")} 
            className="btn btn-sm bg-gray-700 hover:bg-gray-600 text-xl"
            disabled={isLoading || isSolved}
          >=)</button>
          <button 
            onClick={() => insertEmoji("(=")} 
            className="btn btn-sm bg-gray-700 hover:bg-gray-600 text-xl"
            disabled={isLoading || isSolved}
          >(=</button>
          <button 
            onClick={() => insertEmoji(":|")} 
            className="btn btn-sm bg-gray-700 hover:bg-gray-600 text-xl"
            disabled={isLoading || isSolved}
          >:|</button>
          <button 
            onClick={() => insertEmoji("|:")} 
            className="btn btn-sm bg-gray-700 hover:bg-gray-600 text-xl"
            disabled={isLoading || isSolved}
          >|:</button>
        </div>

        {/* Operator buttons */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <button 
            onClick={() => insertEmoji("+")} 
            className="btn btn-sm bg-primary hover:bg-primary-focus text-white font-bold"
            disabled={isLoading || isSolved}
          >+</button>
          <button 
            onClick={() => insertEmoji("-")} 
            className="btn btn-sm bg-primary hover:bg-primary-focus text-white font-bold"
            disabled={isLoading || isSolved}
          >-</button>
          <button 
            onClick={() => insertEmoji("*")} 
            className="btn btn-sm bg-primary hover:bg-primary-focus text-white font-bold"
            disabled={isLoading || isSolved}
          >*</button>
          <button 
            onClick={() => insertEmoji("/")} 
            className="btn btn-sm bg-primary hover:bg-primary-focus text-white font-bold"
            disabled={isLoading || isSolved}
          >/</button>
        </div>
      </div>

      {/* Controls */}
      <SolverControls
        onSolve={solveEmojiMathModule}
        onReset={reset}
        isSolveDisabled={!emojiEquation.trim()}
        isLoading={isLoading}
        solveText="Press OK"
      />

      {/* Error display */}
      <ErrorAlert error={error} />

      {/* Results */}
      {result && isValidEmojiMathOutput(result) && (
        <div className="alert alert-success mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <span className="font-bold">Translation:</span>
            <div className="mt-2 font-mono text-lg">{result.translatedEquation}</div>
            <span className="font-bold mt-2 block">Result:</span>
            <div className="font-mono text-2xl">{result.result}</div>
          </div>
        </div>
      )}

      {/* Twitch command display */}
      {twitchCommand && result && isValidEmojiMathOutput(result) && (
        <TwitchCommandDisplay command={twitchCommand} />
      )}

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Enter the emoji equation shown on the module.</p>
        <p>• Click the emoji buttons or type directly</p>
        <p>• Emoji mapping: :)0 =(1 (:2 )=3 :(4 ):5 =)6 (=7 :|8 |:9</p>
        <p>• Press Enter or click "Press OK" to calculate</p>
      </div>
    </SolverLayout>
  );
}
