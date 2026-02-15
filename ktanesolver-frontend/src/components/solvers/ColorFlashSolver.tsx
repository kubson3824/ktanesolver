import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import { solveColorFlash, type ColorFlashEntry, type ColorFlashColor } from "../../services/colorFlashService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { 
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverControls
} from "../common";

interface ColorFlashSolverProps {
  bomb: BombEntity | null | undefined;
}

const COLORS: ColorFlashColor[] = ["RED", "YELLOW", "GREEN", "BLUE", "MAGENTA", "WHITE"];

const COLOR_CLASSES: Record<ColorFlashColor, { bg: string; text: string; border: string; light: string }> = {
  RED: {
    bg: "bg-red-600 hover:bg-red-500",
    text: "text-red-400",
    border: "border-red-700",
    light: "bg-red-400 shadow-red-400"
  },
  YELLOW: {
    bg: "bg-yellow-500 hover:bg-yellow-400",
    text: "text-yellow-300",
    border: "border-yellow-600",
    light: "bg-yellow-300 shadow-yellow-300"
  },
  GREEN: {
    bg: "bg-green-600 hover:bg-green-500",
    text: "text-green-400",
    border: "border-green-700",
    light: "bg-green-400 shadow-green-400"
  },
  BLUE: {
    bg: "bg-blue-600 hover:bg-blue-500",
    text: "text-blue-400",
    border: "border-blue-700",
    light: "bg-blue-400 shadow-blue-400"
  },
  MAGENTA: {
    bg: "bg-purple-600 hover:bg-purple-500",
    text: "text-purple-400",
    border: "border-purple-700",
    light: "bg-purple-400 shadow-purple-400"
  },
  WHITE: {
    bg: "bg-gray-100 hover:bg-gray-200 text-gray-800",
    text: "text-gray-200",
    border: "border-gray-300",
    light: "bg-gray-200 shadow-gray-200"
  }
};

export default function ColorFlashSolver({ bomb }: ColorFlashSolverProps) {
  const [sequence, setSequence] = useState<ColorFlashEntry[]>([]);
  const [solution, setSolution] = useState<{
    pressYes: boolean;
    pressNo: boolean;
    instruction: string;
    position: number;
  } | null>(null);
  const [twitchCommands, setTwitchCommands] = useState<string[]>([]);
  
  // Use the common solver hook for shared state
  const updateModuleAfterSolve = useRoundStore((s) => s.updateModuleAfterSolve);
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
    () => ({ sequence, solution, twitchCommands }),
    [sequence, solution, twitchCommands],
  );

  const onRestoreState = useCallback(
    (state: { sequence?: ColorFlashEntry[]; solution?: typeof solution; twitchCommands?: string[]; input?: { sequence?: ColorFlashEntry[] } }) => {
      if (state.sequence) setSequence(state.sequence);
      else if (state.input?.sequence) setSequence(state.input.sequence);
      if (state.solution !== undefined) setSolution(state.solution ?? null);
      if (state.twitchCommands) setTwitchCommands(state.twitchCommands);
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (restored: NonNullable<typeof solution>) => {
      if (restored) {
        setSolution(restored);

        const command = generateTwitchCommand({
          moduleType: ModuleType.COLOR_FLASH,
          result: {
            action: restored.pressYes ? "YES" : "NO",
            position: restored.position,
            instruction: restored.instruction,
          },
        });
        setTwitchCommands([command]);
      }
    },
  []);

  useSolverModulePersistence<
    { sequence: ColorFlashEntry[]; solution: typeof solution; twitchCommands: string[] },
    NonNullable<typeof solution>
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; result?: unknown; solution?: unknown };
        if (anyRaw.output && typeof anyRaw.output === "object") return anyRaw.output as NonNullable<typeof solution>;
        if (anyRaw.solution && typeof anyRaw.solution === "object") return anyRaw.solution as NonNullable<typeof solution>;
        if (anyRaw.result && typeof anyRaw.result === "object") return anyRaw.result as NonNullable<typeof solution>;
        return raw as NonNullable<typeof solution>;
      }
      return null;
    },
    inferSolved: (_sol, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleAddEntry = (word: ColorFlashColor, color: ColorFlashColor) => {
    if (isSolved || isLoading || sequence.length >= 8) return;
    
    clearError();
    setSequence([...sequence, { word, color }]);
    setSolution(null);
    setTwitchCommands([]);
  };

  const handleRemoveEntry = (index: number) => {
    if (isSolved || isLoading) return;
    
    const newSequence = sequence.filter((_, i) => i !== index);
    setSequence(newSequence);
    setSolution(null);
    setTwitchCommands([]);
    clearError();
  };

  const handleCheckAnswer = async () => {
    if (sequence.length !== 8) {
      setError("Color Flash requires exactly 8 word/color pairs");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveColorFlash(round.id, bomb.id, currentModule.id, {
        input: {
          sequence: sequence
        }
      });

      setSolution(response.output);

      const command = generateTwitchCommand({
        moduleType: ModuleType.COLOR_FLASH,
        result: {
          action: response.output.pressYes ? "YES" : "NO",
          position: response.output.position,
          instruction: response.output.instruction
        },
      });
      setTwitchCommands([command]);

      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { sequence },
        {
          pressYes: response.output.pressYes,
          pressNo: response.output.pressNo,
          instruction: response.output.instruction,
          position: response.output.position,
        }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Color Flash");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setSequence([]);
    setSolution(null);
    setTwitchCommands([]);
    resetSolverState();
  };

  return (
    <SolverLayout>
      {/* Color Flash Module Visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">MODULE VIEW</h3>
        
        {/* Word and Color Selection */}
        <div className="mb-6">
          <p className="text-center text-gray-400 mb-3 text-sm">Select Word and Color combinations:</p>
          <div className="flex justify-center gap-2 flex-wrap">
            {COLORS.map((word) => (
              <div key={word} className="flex gap-1">
                {COLORS.map((color) => (
                  <button
                    key={`${word}-${color}`}
                    onClick={() => handleAddEntry(word, color)}
                    className={`w-8 h-8 rounded border transition-all duration-200 text-xs font-bold ${
                      word === color 
                        ? `${COLOR_CLASSES[color].bg} ${COLOR_CLASSES[color].border} text-white`
                        : `bg-gray-700 border-gray-600 ${COLOR_CLASSES[color].text}`
                    }`}
                    disabled={isSolved || isLoading || sequence.length >= 8}
                    title={`${word} in ${color}`}
                  >
                    {word[0]}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Sequence Display */}
        {sequence.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-center text-gray-400 mb-2 text-sm">
              Sequence ({sequence.length}/8):
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              {sequence.map((entry, index) => (
                <div
                  key={index}
                  className={`px-3 py-2 rounded-lg border-2 flex flex-col items-center ${
                    entry.word === entry.color
                      ? `${COLOR_CLASSES[entry.color].bg} ${COLOR_CLASSES[entry.color].border} text-white`
                      : `bg-gray-700 border-gray-600`
                  }`}
                >
                  <span className="text-gray-400 text-xs mb-1">#{index + 1}</span>
                  <span className={`font-bold text-sm ${
                    entry.word === entry.color 
                      ? 'text-white'
                      : COLOR_CLASSES[entry.color].text
                  }`}>
                    {entry.word}
                  </span>
                  {!isSolved && !isLoading && (
                    <button
                      onClick={() => handleRemoveEntry(index)}
                      className="mt-1 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Solution Display */}
        {solution && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className={`text-center p-3 rounded-lg ${
              solution.pressYes ? 'bg-green-900/30 border border-green-600' : 'bg-red-900/30 border border-red-600'
            }`}>
              <p className={`text-sm font-bold mb-1 ${
                solution.pressYes ? 'text-green-400' : 'text-red-400'
              }`}>
                Press {solution.pressYes ? 'YES' : 'NO'}
                {solution.position > 0 && ` at position #${solution.position}`}
              </p>
              <p className="text-xs text-gray-400">{solution.instruction}</p>
            </div>

            {/* Twitch command display */}
            <TwitchCommandDisplay command={twitchCommands} className="mb-0" />
          </div>
        )}
      </div>

      {/* Controls */}
      <SolverControls
        onSolve={handleCheckAnswer}
        onReset={reset}
        isSolveDisabled={sequence.length !== 8}
        isLoading={isLoading}
        solveText="Get Solution"
      />

      {/* Error display */}
      <ErrorAlert error={error} />

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Select the word and color for each of the 8 displays in the sequence.</p>
        <p className="mb-2">Click the small buttons to quickly add word/color combinations, or use the larger buttons to select individually.</p>
        <p>The solution depends on the color of the 8th display in the sequence.</p>
      </div>
    </SolverLayout>
  );
}
