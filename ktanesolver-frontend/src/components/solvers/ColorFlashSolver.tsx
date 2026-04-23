import { useCallback, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import {
  solveColorFlash,
  type ColorFlashEntry,
  type ColorFlashColor,
} from "../../services/colorFlashService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverResult,
} from "../common";
import { cn } from "../../lib/cn";

interface ColorFlashSolverProps {
  bomb: BombEntity | null | undefined;
}

interface ColorSpec {
  color: ColorFlashColor;
  label: string;
  /** Tailwind bg for colored-word chip. */
  chip: string;
  /** Tailwind text-color class for same-color white word text. */
  chipText: string;
}

const COLORS: readonly ColorSpec[] = [
  {
    color: "RED",
    label: "Red",
    chip: "bg-red-500/15 border-red-500/40",
    chipText: "text-red-700 dark:text-red-400",
  },
  {
    color: "YELLOW",
    label: "Yellow",
    chip: "bg-yellow-500/15 border-yellow-500/40",
    chipText: "text-yellow-700 dark:text-yellow-400",
  },
  {
    color: "GREEN",
    label: "Green",
    chip: "bg-green-500/15 border-green-500/40",
    chipText: "text-green-700 dark:text-green-400",
  },
  {
    color: "BLUE",
    label: "Blue",
    chip: "bg-blue-500/15 border-blue-500/40",
    chipText: "text-blue-700 dark:text-blue-400",
  },
  {
    color: "MAGENTA",
    label: "Magenta",
    chip: "bg-fuchsia-500/15 border-fuchsia-500/40",
    chipText: "text-fuchsia-700 dark:text-fuchsia-400",
  },
  {
    color: "WHITE",
    label: "White",
    chip: "bg-muted border-border",
    chipText: "text-foreground",
  },
] as const;

function spec(color: ColorFlashColor): ColorSpec {
  return COLORS.find((c) => c.color === color)!;
}

type ColorFlashSolution = {
  pressYes: boolean;
  pressNo: boolean;
  instruction: string;
  position: number;
};

export default function ColorFlashSolver({ bomb }: ColorFlashSolverProps) {
  const [sequence, setSequence] = useState<ColorFlashEntry[]>([]);
  const [solution, setSolution] = useState<ColorFlashSolution | null>(null);
  const [twitchCommands, setTwitchCommands] = useState<string[]>([]);

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
  } = useSolver();

  const moduleState = useMemo(
    () => ({ sequence, solution, twitchCommands }),
    [sequence, solution, twitchCommands],
  );

  const onRestoreState = useCallback(
    (state: {
      sequence?: ColorFlashEntry[];
      solution?: ColorFlashSolution | null;
      twitchCommands?: string[];
      input?: { sequence?: ColorFlashEntry[] };
    }) => {
      if (state.sequence) setSequence(state.sequence);
      else if (state.input?.sequence) setSequence(state.input.sequence);
      if (state.solution !== undefined) setSolution(state.solution ?? null);
      if (state.twitchCommands) setTwitchCommands(state.twitchCommands);
    },
    [],
  );

  const onRestoreSolution = useCallback((restored: ColorFlashSolution) => {
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
  }, []);

  useSolverModulePersistence<
    { sequence: ColorFlashEntry[]; solution: ColorFlashSolution | null; twitchCommands: string[] },
    ColorFlashSolution
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; result?: unknown; solution?: unknown };
        if (anyRaw.output && typeof anyRaw.output === "object") return anyRaw.output as ColorFlashSolution;
        if (anyRaw.solution && typeof anyRaw.solution === "object") return anyRaw.solution as ColorFlashSolution;
        if (anyRaw.result && typeof anyRaw.result === "object") return anyRaw.result as ColorFlashSolution;
        return raw as ColorFlashSolution;
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
    setSequence(sequence.filter((_, i) => i !== index));
    setSolution(null);
    setTwitchCommands([]);
    clearError();
  };

  const handleCheckAnswer = async () => {
    if (sequence.length !== 8) {
      setError("Colour Flash requires exactly 8 word/color pairs");
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
        input: { sequence },
      });

      setSolution(response.output);

      const command = generateTwitchCommand({
        moduleType: ModuleType.COLOR_FLASH,
        result: {
          action: response.output.pressYes ? "YES" : "NO",
          position: response.output.position,
          instruction: response.output.instruction,
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
        },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Colour Flash");
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
      <SolverSection
        title="Flash sequence"
        description="Record each of the 8 displays. Pick the word (row) and the color it was rendered in (column)."
      >
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0.5">
            <thead>
              <tr>
                <th className="w-14" />
                {COLORS.map((c) => (
                  <th
                    key={c.color}
                    className="pb-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COLORS.map((wordSpec) => (
                <tr key={wordSpec.color}>
                  <td className="pr-2 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {wordSpec.label}
                  </td>
                  {COLORS.map((colorSpec) => (
                    <td key={colorSpec.color}>
                      <button
                        type="button"
                        onClick={() => handleAddEntry(wordSpec.color, colorSpec.color)}
                        disabled={isSolved || isLoading || sequence.length >= 8}
                        aria-label={`Add "${wordSpec.label}" in ${colorSpec.label}`}
                        className={cn(
                          "inline-flex h-8 w-full min-w-[32px] items-center justify-center rounded border text-xs font-semibold transition-colors",
                          colorSpec.chip,
                          colorSpec.chipText,
                          "hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40",
                        )}
                      >
                        {wordSpec.label.slice(0, 2)}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sequence.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Sequence ({sequence.length}/8)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sequence.map((entry, index) => {
                const colorSpec = spec(entry.color);
                return (
                  <span
                    key={index}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold",
                      colorSpec.chip,
                      colorSpec.chipText,
                    )}
                  >
                    <span className="tabular-nums text-muted-foreground">{index + 1}.</span>
                    {spec(entry.word).label}
                    {!isSolved && !isLoading && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEntry(index)}
                        aria-label={`Remove entry ${index + 1}`}
                        className="ml-0.5 inline-flex rounded text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </SolverSection>

      <SolverControls
        onSolve={handleCheckAnswer}
        onReset={reset}
        isSolveDisabled={sequence.length !== 8}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Get solution"
      />

      <ErrorAlert error={error} />

      {solution && (
        <SolverResult
          variant={solution.pressYes ? "success" : "warning"}
          title={solution.pressYes ? "Press YES" : "Press NO"}
          description={
            solution.position > 0
              ? `Position: #${solution.position}\n${solution.instruction}`
              : solution.instruction
          }
        />
      )}

      {twitchCommands.length > 0 && solution && <TwitchCommandDisplay command={twitchCommands} />}

      <SolverInstructions>
        The action depends on the 8th entry. Each row is a word, each column the color it
        flashes in.
      </SolverInstructions>
    </SolverLayout>
  );
}
