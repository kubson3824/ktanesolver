import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveLetterKeys as solveLetterKeysApi } from "../../services/letterKeysService";
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
} from "../common";
import { Input } from "../ui/input";
import { cn } from "../../lib/cn";

interface LetterKeysSolverProps {
  bomb: BombEntity | null | undefined;
}

const BUTTONS: readonly string[] = ["A", "B", "C", "D"] as const;

export default function LetterKeysSolver({ bomb }: LetterKeysSolverProps) {
  const [number, setNumber] = useState<string>("");
  const [pressedLetter, setPressedLetter] = useState<string>("");
  const [twitchCommand, setTwitchCommand] = useState<string>("");

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
    () => ({ number, pressedLetter, twitchCommand }),
    [number, pressedLetter, twitchCommand],
  );

  const onRestoreState = useCallback(
    (
      state:
        | { number?: string; pressedLetter?: string; result?: string; twitchCommand?: string }
        | { input?: { number?: number } },
    ) => {
      if ("input" in state && state.input?.number !== undefined) {
        setNumber(String(state.input.number));
      } else if ("number" in state && state.number !== undefined) {
        setNumber(state.number);
      }
      // Back-compat with prior "result" string form
      if ("pressedLetter" in state && state.pressedLetter !== undefined) {
        setPressedLetter(state.pressedLetter);
      } else if ("result" in state && typeof state.result === "string") {
        const match = state.result.match(/Press button ([A-D])/);
        if (match) setPressedLetter(match[1]);
      }
      if ("twitchCommand" in state && state.twitchCommand !== undefined) {
        setTwitchCommand(state.twitchCommand);
      }
    },
    [],
  );

  const onRestoreSolution = useCallback((solution: { letter: string }) => {
    if (!solution?.letter) return;
    setPressedLetter(solution.letter);

    const command = generateTwitchCommand({
      moduleType: ModuleType.LETTER_KEYS,
      result: { letter: solution.letter },
    });
    setTwitchCommand(command);
  }, []);

  useSolverModulePersistence<
    { number: string; pressedLetter: string; twitchCommand: string },
    { letter: string }
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; letter?: unknown };
        if (anyRaw.output && typeof anyRaw.output === "object") return anyRaw.output as { letter: string };
        if (typeof anyRaw.letter === "string") return { letter: anyRaw.letter };
      }
      return null;
    },
    inferSolved: (_sol, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleSolve = async () => {
    const numValue = parseInt(number);

    if (!number || isNaN(numValue) || numValue < 0 || numValue > 99) {
      setError("Please enter a valid two-digit number (00-99)");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveLetterKeysApi(round.id, bomb.id, currentModule.id, {
        input: { number: numValue },
      });

      const letter = response.output.letter;
      setPressedLetter(letter);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);

      const command = generateTwitchCommand({
        moduleType: ModuleType.LETTER_KEYS,
        result: { letter },
      });
      setTwitchCommand(command);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Letter Keys");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNumberChange = (value: string) => {
    if (value === "" || /^\d{0,2}$/.test(value)) {
      setNumber(value);
      if (error) clearError();
    }
  };

  const reset = () => {
    setNumber("");
    setPressedLetter("");
    setTwitchCommand("");
    resetSolverState();
  };

  return (
    <SolverLayout>
      <SolverSection
        title="Display"
        description="Enter the two-digit number shown on the module display."
      >
        <Input
          type="text"
          value={number}
          onChange={(e) => handleNumberChange(e.target.value)}
          placeholder="00"
          className="text-center font-mono text-4xl tracking-widest"
          maxLength={2}
          disabled={isLoading || isSolved}
          aria-label="Module display number"
        />
      </SolverSection>

      <SolverSection title="Buttons" description="The letter to press will be highlighted.">
        <div className="mx-auto grid max-w-xs grid-cols-2 gap-3">
          {BUTTONS.map((letter) => {
            const isTarget = pressedLetter === letter;
            return (
              <div
                key={letter}
                className={cn(
                  "flex h-16 items-center justify-center rounded-md border-2 text-2xl font-bold transition-colors",
                  isTarget
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/40"
                    : "border-border bg-muted/40 text-muted-foreground",
                )}
                aria-label={`Button ${letter}${isTarget ? " (press this)" : ""}`}
              >
                {letter}
              </div>
            );
          })}
        </div>
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={!number}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Solve"
      />

      <ErrorAlert error={error} />

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        The solver picks the single button to press based on the displayed number and
        bomb edgework.
      </SolverInstructions>
    </SolverLayout>
  );
}
