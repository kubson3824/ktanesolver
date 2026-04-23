import { useCallback, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowDown, ArrowUp } from "lucide-react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import {
  solveCrazyTalk,
  type CrazyTalkOutput,
  type CrazyTalkInput,
} from "../../services/crazyTalkService";
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
import { Button } from "../ui/button";

interface CrazyTalkSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function CrazyTalkSolver({ bomb }: CrazyTalkSolverProps) {
  const [displayText, setDisplayText] = useState<string>("");
  const [result, setResult] = useState<CrazyTalkOutput | null>(null);
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

  const updateModuleAfterSolve = useRoundStore((s) => s.updateModuleAfterSolve);

  const moduleState = useMemo(
    () => ({ displayText, result, twitchCommand }),
    [displayText, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      displayText?: string;
      result?: CrazyTalkOutput | null;
      twitchCommand?: string;
      input?: CrazyTalkInput;
    }) => {
      if (state.displayText !== undefined) setDisplayText(state.displayText);
      else if (state.input?.displayText !== undefined) setDisplayText(state.input.displayText);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback((solution: CrazyTalkOutput) => {
    if (solution != null) {
      setResult(solution);
      setTwitchCommand(
        generateTwitchCommand({
          moduleType: ModuleType.CRAZY_TALK,
          result: { downAt: solution.downAt, upAt: solution.upAt },
        }),
      );
    }
  }, []);

  useSolverModulePersistence<
    { displayText: string; result: CrazyTalkOutput | null; twitchCommand: string },
    CrazyTalkOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null || typeof raw !== "object") return null;
      const o = raw as { downAt?: number; upAt?: number };
      if (typeof o.downAt !== "number" || typeof o.upAt !== "number") return null;
      return o as CrazyTalkOutput;
    },
    inferSolved: (_sol, mod) => Boolean((mod as { solved?: boolean })?.solved),
    currentModule,
    setIsSolved,
  });

  const handleSolve = useCallback(async () => {
    const trimmed = displayText.trim();
    if (!trimmed) {
      setError("Enter the display text from the module.");
      return;
    }
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing round, bomb, or module.");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const input: CrazyTalkInput = { displayText: trimmed };
      const response = await solveCrazyTalk(round.id, bomb.id, currentModule.id, { input });
      const output = response.output;
      setResult(output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);

      const command = generateTwitchCommand({
        moduleType: ModuleType.CRAZY_TALK,
        result: { downAt: output.downAt, upAt: output.upAt },
      });
      setTwitchCommand(command);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { displayText: trimmed, result: output, twitchCommand: command },
        output,
        true,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Solve failed.");
    } finally {
      setIsLoading(false);
    }
  }, [
    displayText,
    round?.id,
    bomb?.id,
    currentModule?.id,
    setIsLoading,
    clearError,
    setError,
    setIsSolved,
    markModuleSolved,
    updateModuleAfterSolve,
  ]);

  const reset = useCallback(() => {
    setDisplayText("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  const canSolve = useMemo(() => displayText.trim().length > 0, [displayText]);
  const disabled = isLoading || isSolved;

  const insertArrow = (arrow: "←" | "→") => {
    setDisplayText((prev) => `${prev}${prev && !prev.endsWith(" ") ? " " : ""}${arrow}`);
  };

  return (
    <SolverLayout>
      <SolverSection
        title="Display text"
        description="Copy the exact text shown on the module screen. Use the arrow buttons to insert ← and → symbols."
        actions={
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Insert:</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => insertArrow("←")}
              disabled={disabled}
              aria-label="Insert left arrow"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => insertArrow("→")}
              disabled={disabled}
              aria-label="Insert right arrow"
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        }
      >
        <textarea
          value={displayText}
          onChange={(e) => setDisplayText(e.target.value)}
          placeholder="e.g. BLANK, 1 3 2 4, or text with ← →"
          disabled={disabled}
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-70"
          aria-label="Module display text"
        />
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={!canSolve}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Solve"
      />

      <ErrorAlert error={error} />

      {result && (
        <SolverSection title="Flip the switch" className="border-amber-500/40">
          <ul className="space-y-2">
            <li className="flex items-start gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2">
              <ArrowDown
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
                aria-hidden
              />
              <p className="text-sm text-foreground">
                Flip the switch{" "}
                <span className="font-semibold text-amber-700 dark:text-amber-300">down</span>{" "}
                when the timer seconds show{" "}
                <span className="font-mono font-bold">{result.downAt}</span>.
              </p>
            </li>
            <li className="flex items-start gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2">
              <ArrowUp
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
                aria-hidden
              />
              <p className="text-sm text-foreground">
                Flip the switch{" "}
                <span className="font-semibold text-amber-700 dark:text-amber-300">up</span>{" "}
                when the timer seconds show{" "}
                <span className="font-mono font-bold">{result.upAt}</span>.
              </p>
            </li>
          </ul>
        </SolverSection>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        Timer seconds count down. Flip the switch the moment the seconds display matches each
        value. The down-action happens before the up-action.
      </SolverInstructions>
    </SolverLayout>
  );
}
