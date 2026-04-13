import { useCallback, useMemo, useState } from "react";

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
  ErrorAlert,
  TwitchCommandDisplay,
  SolverControls,
} from "../common";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

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

const COLOR_CLASSES: Record<NumberPadColor, { button: string; swatch: string; text: string }> = {
  BLUE: {
    button: "bg-blue-600 text-white border-blue-400",
    swatch: "bg-blue-600",
    text: "text-blue-300",
  },
  GREEN: {
    button: "bg-green-600 text-white border-green-400",
    swatch: "bg-green-600",
    text: "text-green-300",
  },
  RED: {
    button: "bg-red-600 text-white border-red-400",
    swatch: "bg-red-600",
    text: "text-red-300",
  },
  WHITE: {
    button: "bg-slate-100 text-slate-900 border-slate-300",
    swatch: "bg-slate-100",
    text: "text-slate-200",
  },
  YELLOW: {
    button: "bg-yellow-400 text-slate-900 border-yellow-200",
    swatch: "bg-yellow-400",
    text: "text-yellow-300",
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
    (
      state: {
        buttonColors?: Array<NumberPadColor | null>;
        selectedDigit?: number;
        twitchCommand?: string;
      },
    ) => {
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
    inferSolved: (_solution, current) => Boolean((current as { solved?: boolean } | undefined)?.solved),
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
          buttonColors: buttonColors.filter((color): color is NumberPadColor => color !== null),
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
      setError(solveError instanceof Error ? solveError.message : "Failed to solve Number Pad");
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
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-sm font-medium text-base-content/70">
            NUMBER PAD
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border border-base-300 bg-base-200/60 p-3 text-sm">
            <p className="font-medium text-base-content">
              Selected digit: <span className="text-accent">{selectedDigit}</span>
            </p>
            <p className="text-base-content/70">
              Fill the keypad in numpad order. The solver uses the stored bomb edgework for ports,
              batteries, and serial checks.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="grid gap-3">
              {DIGIT_LAYOUT.map((row) => (
                <div
                  key={row.join("-")}
                  className={`grid gap-3 ${row.length === 1 ? "justify-center" : "grid-cols-3"}`}
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
                        className={[
                          "flex h-20 w-20 flex-col items-center justify-center rounded-xl border-2 transition-all",
                          isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "",
                          color
                            ? COLOR_CLASSES[color].button
                            : "border-base-300 bg-base-100 text-base-content hover:border-primary/60",
                        ].join(" ")}
                      >
                        <span className="text-2xl font-bold">{digit}</span>
                        <span className="mt-1 text-[11px] uppercase tracking-wide">
                          {color ?? "Unset"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-base-300 bg-base-100 p-4">
            <p className="text-center text-sm font-medium text-base-content/80">
              Assign a color to digit {selectedDigit}
            </p>
            <div className="flex justify-center gap-3">
              {COLORS.map((color) => {
                const isSelected = buttonColors[selectedDigit] === color;

                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setDigitColor(selectedDigit, color)}
                    disabled={isSolved || isLoading}
                    aria-label={color}
                    title={color}
                    className={[
                      "h-10 w-10 rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      COLOR_CLASSES[color].swatch,
                      isSelected
                        ? "scale-110 border-ring shadow-md"
                        : color === "WHITE"
                          ? "border-slate-300 opacity-70 hover:opacity-100 hover:scale-105"
                          : "border-transparent opacity-70 hover:opacity-100 hover:scale-105",
                    ].join(" ")}
                  />
                );
              })}
            </div>
            <div className="flex justify-between gap-3 text-xs text-base-content/70">
              <span>{assignedCount}/10 digits assigned</span>
              <button
                type="button"
                onClick={() => clearDigitColor(selectedDigit)}
                disabled={isSolved || isLoading || buttonColors[selectedDigit] === null}
                className="underline underline-offset-2 disabled:no-underline disabled:opacity-50"
              >
                Clear selected digit
              </button>
            </div>
          </div>

          {solution && (
            <div className="rounded-lg border border-emerald-500 bg-emerald-500/10 p-4 text-center">
              <p className="text-sm uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Code</p>
              <p className="font-mono-code text-4xl font-bold text-base-content">{solution.code}</p>
              <p className="mt-2 text-sm text-base-content/70">{solution.instruction}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <SolverControls
        onSolve={handleSolve}
        onReset={handleReset}
        isSolveDisabled={assignedCount !== 10}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Get Code"
      />

      <ErrorAlert error={error} />
      <TwitchCommandDisplay command={twitchCommand} />

      <div className="text-sm text-base-content/60">
        <p>Once all ten digits are assigned, the backend returns the 4-digit code and a Twitch Plays submit command.</p>
      </div>
    </SolverLayout>
  );
}
