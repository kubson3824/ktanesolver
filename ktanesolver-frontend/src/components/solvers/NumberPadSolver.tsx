import { useCallback, useMemo, useState } from "react";
import { X } from "lucide-react";

import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import {
  solveNumberPad,
  type NumberPadColor,
  type NumberPadOutput,
} from "../../services/numberPadService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverControls,
  SolverResult,
} from "../common";
import { cn } from "../../lib/cn";

interface NumberPadSolverProps {
  bomb: BombEntity | null | undefined;
}

const DIGIT_LAYOUT: number[][] = [
  [7, 8, 9],
  [4, 5, 6],
  [1, 2, 3],
  [0],
];

const DIGIT_ENTRY_ORDER = [7, 8, 9, 4, 5, 6, 1, 2, 3, 0];

const COLORS: NumberPadColor[] = ["BLUE", "GREEN", "RED", "WHITE", "YELLOW"];

const EMPTY_BUTTON_COLORS: Array<NumberPadColor | null> = Array.from({ length: 10 }, () => null);

const COLOR_CLASSES: Record<
  NumberPadColor,
  { button: string; swatch: string; label: string }
> = {
  BLUE: {
    button: "bg-blue-600 text-white border-blue-400",
    swatch: "bg-blue-600",
    label: "Blue",
  },
  GREEN: {
    button: "bg-emerald-600 text-white border-emerald-400",
    swatch: "bg-emerald-600",
    label: "Green",
  },
  RED: {
    button: "bg-red-600 text-white border-red-400",
    swatch: "bg-red-600",
    label: "Red",
  },
  WHITE: {
    button: "bg-neutral-100 text-neutral-900 border-neutral-300",
    swatch: "bg-neutral-100 border border-border",
    label: "White",
  },
  YELLOW: {
    button: "bg-yellow-400 text-neutral-900 border-yellow-300",
    swatch: "bg-yellow-400",
    label: "Yellow",
  },
};

function nextDigit(currentColors: Array<NumberPadColor | null>, currentDigit: number): number {
  const currentIndex = DIGIT_ENTRY_ORDER.indexOf(currentDigit);

  for (let offset = 1; offset <= DIGIT_ENTRY_ORDER.length; offset += 1) {
    const candidate = DIGIT_ENTRY_ORDER[(currentIndex + offset) % DIGIT_ENTRY_ORDER.length];
    if (!currentColors[candidate]) {
      return candidate;
    }
  }

  return currentDigit;
}

export default function NumberPadSolver({ bomb }: NumberPadSolverProps) {
  const [buttonColors, setButtonColors] = useState<Array<NumberPadColor | null>>([
    ...EMPTY_BUTTON_COLORS,
  ]);
  const [selectedDigit, setSelectedDigit] = useState<number>(7);
  const [solution, setSolution] = useState<NumberPadOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const {
    isLoading,
    error,
    isSolved,
    setIsLoading,
    setError,
    setIsSolved,
    clearError,
    reset,
    currentModule,
    round,
  } = useSolver();

  const assignedCount = useMemo(
    () => buttonColors.filter((color): color is NumberPadColor => color !== null).length,
    [buttonColors],
  );

  const moduleState = useMemo(
    () => ({ buttonColors, selectedDigit, solution, twitchCommand }),
    [buttonColors, selectedDigit, solution, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      buttonColors?: Array<NumberPadColor | null>;
      selectedDigit?: number;
      twitchCommand?: string;
    }) => {
      if (Array.isArray(state.buttonColors) && state.buttonColors.length === 10) {
        setButtonColors(state.buttonColors as Array<NumberPadColor | null>);
      }
      if (typeof state.selectedDigit === "number") {
        setSelectedDigit(state.selectedDigit);
      }
      if (typeof state.twitchCommand === "string") {
        setTwitchCommand(state.twitchCommand);
      }
    },
    [],
  );

  const onRestoreSolution = useCallback((restored: NumberPadOutput) => {
    if (!restored?.code) return;
    setSolution(restored);
    setTwitchCommand(
      generateTwitchCommand({
        moduleType: ModuleType.NUMBER_PAD,
        result: restored,
      }),
    );
  }, []);

  useSolverModulePersistence<
    {
      buttonColors: Array<NumberPadColor | null>;
      selectedDigit: number;
      solution: NumberPadOutput | null;
      twitchCommand: string;
    },
    NumberPadOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null || typeof raw !== "object") return null;
      const anyRaw = raw as { output?: unknown; code?: unknown; instruction?: unknown };
      if (anyRaw.output && typeof anyRaw.output === "object") {
        return anyRaw.output as NumberPadOutput;
      }
      if (typeof anyRaw.code === "string") {
        return raw as NumberPadOutput;
      }
      return null;
    },
    inferSolved: (_solution, current) =>
      Boolean((current as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const setDigitColor = (digit: number, color: NumberPadColor) => {
    if (isSolved || isLoading) return;

    setButtonColors((previous) => {
      const next = [...previous];
      next[digit] = color;
      setSelectedDigit(nextDigit(next, digit));
      return next;
    });

    setSolution(null);
    setTwitchCommand("");
    clearError();
  };

  const clearDigitColor = (digit: number) => {
    if (isSolved || isLoading) return;

    setButtonColors((previous) => {
      const next = [...previous];
      next[digit] = null;
      return next;
    });

    setSelectedDigit(digit);
    setSolution(null);
    setTwitchCommand("");
    clearError();
  };

  const handleSolve = async () => {
    if (assignedCount !== 10) {
      setError("Please assign a color to every digit from 0 to 9");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveNumberPad(round.id, bomb.id, currentModule.id, {
        input: {
          buttonColors: buttonColors.filter(
            (color): color is NumberPadColor => color !== null,
          ),
        },
      });

      setSolution(response.output);
      setIsSolved(true);

      const command = generateTwitchCommand({
        moduleType: ModuleType.NUMBER_PAD,
        result: response.output,
      });
      setTwitchCommand(command);

      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        {
          buttonColors,
          selectedDigit,
          twitchCommand: command,
        },
        response.output,
        true,
      );
    } catch (solveError) {
      setError(
        solveError instanceof Error ? solveError.message : "Failed to solve Number Pad",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setButtonColors([...EMPTY_BUTTON_COLORS]);
    setSelectedDigit(7);
    setSolution(null);
    setTwitchCommand("");
    reset();
  };

  return (
    <SolverLayout>
      <SolverSection
        title="Keypad"
        description={`Select a digit, then assign its color. ${assignedCount}/10 assigned.`}
      >
        <div className="flex justify-center">
          <div className="grid gap-2">
            {DIGIT_LAYOUT.map((row) => (
              <div
                key={row.join("-")}
                className={cn(
                  "grid gap-2",
                  row.length === 1 ? "justify-center" : "grid-cols-3",
                )}
              >
                {row.map((digit) => {
                  const color = buttonColors[digit];
                  const isSelected = selectedDigit === digit;

                  return (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => setSelectedDigit(digit)}
                      disabled={isLoading}
                      aria-pressed={isSelected}
                      aria-label={`Digit ${digit}${color ? `, ${COLOR_CLASSES[color].label}` : ", unset"}`}
                      className={cn(
                        "flex h-16 w-16 flex-col items-center justify-center rounded-xl border-2 transition-all",
                        isSelected &&
                          "ring-2 ring-ring ring-offset-2 ring-offset-card",
                        color
                          ? COLOR_CLASSES[color].button
                          : "border-border bg-muted/40 text-foreground hover:border-ring",
                      )}
                    >
                      <span className="text-2xl font-bold">{digit}</span>
                      <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide opacity-80">
                        {color ? COLOR_CLASSES[color].label : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </SolverSection>

      <SolverSection
        title={`Assign color to ${selectedDigit}`}
        description="Tap a color swatch. The selection auto-advances to the next unset digit."
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex justify-center gap-2">
            {COLORS.map((color) => {
              const isSelected = buttonColors[selectedDigit] === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setDigitColor(selectedDigit, color)}
                  disabled={isSolved || isLoading}
                  aria-label={COLOR_CLASSES[color].label}
                  aria-pressed={isSelected}
                  title={COLOR_CLASSES[color].label}
                  className={cn(
                    "h-10 w-10 rounded-full transition-all",
                    COLOR_CLASSES[color].swatch,
                    isSelected
                      ? "ring-2 ring-ring ring-offset-2 ring-offset-card scale-110"
                      : "opacity-70 hover:opacity-100",
                    (isSolved || isLoading) && "cursor-not-allowed",
                  )}
                />
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => clearDigitColor(selectedDigit)}
            disabled={isSolved || isLoading || buttonColors[selectedDigit] === null}
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs text-muted-foreground transition-colors",
              "hover:text-foreground hover:border-foreground/40",
              "disabled:opacity-40 disabled:cursor-not-allowed",
            )}
          >
            <X className="h-3 w-3" aria-hidden />
            Clear digit {selectedDigit}
          </button>
        </div>
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={handleReset}
        isSolveDisabled={assignedCount !== 10}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Get code"
      />

      <ErrorAlert error={error} />

      {solution && (
        <SolverResult
          variant="success"
          title="Code"
          description={`${solution.code}\n${solution.instruction}`}
        />
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        Assign every digit's color (from the module's keypad), then solve. The backend returns the
        4-digit code and a Twitch Plays submit command.
      </SolverInstructions>
    </SolverLayout>
  );
}
