import { useState } from "react";
import type { BombEntity } from "../types";
import { ModuleType } from "../types";
import { useRoundStore } from "../store/useRoundStore";
import { generateTwitchCommand } from "../utils/twitchCommands";
import { solveAnagrams, type AnagramsInput, type AnagramsOutput } from "../services/anagramsService";
import ModuleNumberInput from "./ModuleNumberInput";

interface AnagramsSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function AnagramsSolver({ bomb }: AnagramsSolverProps) {
  const [displayWord, setDisplayWord] = useState<string>("");
  const [result, setResult] = useState<AnagramsOutput | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

  const handleDisplayWordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
    setDisplayWord(value);
    setError("");
  };

  const solveAnagramsModule = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    if (!displayWord.trim()) {
      setError("Please enter the word from the display");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const input: AnagramsInput = {
        displayWord: displayWord.trim()
      };

      const response = await solveAnagrams(round.id, bomb.id, currentModule.id, input);
      const output = response.data;
      setResult(output);
      setIsSolved(true);
      
      const command = generateTwitchCommand(ModuleType.ANAGRAMS, input, output);
      setTwitchCommand(command);
      
      markModuleSolved(currentModule.id);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to solve anagrams");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setDisplayWord("");
    setResult(null);
    setIsSolved(false);
    setError("");
    setTwitchCommand("");
  };

  if (isSolved && result) {
    return (
      <div className="space-y-4">
        <div className="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-bold">Possible Solutions:</h3>
            <div className="mt-2">
              {result.possibleSolutions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.possibleSolutions.map((solution, index) => (
                    <span key={index} className="badge badge-lg badge-primary">
                      {solution}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm">No valid anagrams found</p>
              )}
            </div>
          </div>
        </div>

        {twitchCommand && (
          <div className="card bg-base-200 border border-base-300">
            <div className="card-body p-4">
              <h4 className="font-semibold mb-2">Twitch Command:</h4>
              <code className="text-sm bg-base-300 p-2 rounded block">{twitchCommand}</code>
            </div>
          </div>
        )}

        <button onClick={handleReset} className="btn btn-outline">
          Solve Another
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium">Display Word</span>
        </label>
        <input
          type="text"
          value={displayWord}
          onChange={handleDisplayWordChange}
          placeholder="Enter the word shown on the module"
          className="input input-bordered w-full"
          maxLength={10}
        />
      </div>

      <ModuleNumberInput />

      {error && (
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={solveAnagramsModule}
        disabled={isLoading || !displayWord.trim()}
        className="btn btn-primary w-full"
      >
        {isLoading ? (
          <>
            <span className="loading loading-spinner"></span>
            Solving...
          </>
        ) : (
          "Find Anagrams"
        )}
      </button>
    </div>
  );
}
