import { useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveEmojiMath, type EmojiMathOutput, type EmojiMathInput } from "../../services/emojiMathService";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import ModuleNumberInput from "../ModuleNumberInput";

interface EmojiSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function EmojiSolver({ bomb }: EmojiSolverProps) {
  const [emojiEquation, setEmojiEquation] = useState<string>("");
  const [result, setResult] = useState<EmojiMathOutput | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

  const handleEmojiEquationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow emojis and operators
    setEmojiEquation(value);
    setError("");
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
    setError("");

    try {
      const input: EmojiMathInput = {
        emojiEquation: emojiEquation.trim()
      };
      
      const response = await solveEmojiMath(round.id, bomb.id, currentModule.id, { input });
      
      setResult(response.output);
      
      if (response.output) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
        
        const command = generateTwitchCommand({
          moduleType: ModuleType.EMOJI_MATH,
          result: { answer: response.output.result.toString() },
          moduleNumber
        });
        setTwitchCommand(command);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve emoji equation");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setEmojiEquation("");
    setResult(null);
    setIsSolved(false);
    setError("");
    setTwitchCommand("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && !isSolved) {
      solveEmojiMathModule();
    }
  };

  const insertEmoji = (emoji: string) => {
    if (!isLoading && !isSolved) {
      setEmojiEquation(prev => prev + emoji);
      setError("");
    }
  };

  return (
    <div className="w-full">
      <ModuleNumberInput />
      
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

      {/* Solve button */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={solveEmojiMathModule}
          className="btn btn-primary flex-1"
          disabled={!emojiEquation.trim() || isLoading || isSolved}
        >
          {isLoading ? <span className="loading loading-spinner loading-sm"></span> : ""}
          {isLoading ? "Calculating..." : "Press OK"}
        </button>
        <button onClick={reset} className="btn btn-outline" disabled={isLoading}>
          Reset
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error mb-4">
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
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {result && (
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

      {/* Twitch Command */}
      {twitchCommand && result && (
        <div className="bg-purple-900/20 border border-purple-500 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-purple-400 mb-1">Twitch Chat Command:</h4>
              <code className="text-lg font-mono text-purple-200">{twitchCommand}</code>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(twitchCommand);
              }}
              className="btn btn-sm btn-outline btn-purple"
              title="Copy to clipboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Enter the emoji equation shown on the module.</p>
        <p>• Click the emoji buttons or type directly</p>
        <p>• Emoji mapping: :)0 =(1 (:2 )=3 :(4 ):5 =)6 (=7 :|8 |:9</p>
        <p>• Press Enter or click "Press OK" to calculate</p>
      </div>
    </div>
  );
}
