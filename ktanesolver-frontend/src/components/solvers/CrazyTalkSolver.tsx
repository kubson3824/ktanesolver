import { useCallback, useMemo, useState } from "react";
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
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";

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
    [displayText, result, twitchCommand]
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
    []
  );

  const onRestoreSolution = useCallback((solution: CrazyTalkOutput) => {
    if (solution != null) {
      setResult(solution);
      setTwitchCommand(
        generateTwitchCommand({
          moduleType: ModuleType.CRAZY_TALK,
          result: { downAt: solution.downAt, upAt: solution.upAt },
        })
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
      updateModuleAfterSolve(bomb.id, currentModule.id, { displayText: trimmed, result: output, twitchCommand: command }, output, true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Solve failed.");
    } finally {
      setIsLoading(false);
    }
  }, [displayText, round?.id, bomb?.id, currentModule?.id, setIsLoading, clearError, setIsSolved, markModuleSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setDisplayText("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  const canSolve = useMemo(() => displayText.trim().length > 0, [displayText]);

  return (
    <SolverLayout>
      <div className="rounded-xl border-2 border-neutral-600 bg-neutral-700/95 shadow-lg p-5 text-neutral-100">
        <p className="text-sm text-neutral-300 mb-4">
          Enter the exact text shown on the module display. Match the manual table to get the action (e.g. 5/4).
        </p>
        <div className="mb-4">
          <label className="block text-sm text-neutral-400 mb-2">Display text</label>
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="text-xs text-neutral-500 self-center">Insert arrows:</span>
            <button
              type="button"
              onClick={() => setDisplayText((prev) => prev + " ←")}
              disabled={isLoading || isSolved}
              className="px-3 py-1.5 rounded-lg bg-neutral-600 hover:bg-neutral-500 border border-neutral-500 text-neutral-200 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title="Insert left arrow"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setDisplayText((prev) => prev + " →")}
              disabled={isLoading || isSolved}
              className="px-3 py-1.5 rounded-lg bg-neutral-600 hover:bg-neutral-500 border border-neutral-500 text-neutral-200 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title="Insert right arrow"
            >
              →
            </button>
          </div>
          <textarea
            value={displayText}
            onChange={(e) => setDisplayText(e.target.value)}
            placeholder="e.g. BLANK or 1 3 2 4 or use the arrow buttons above"
            disabled={isLoading || isSolved}
            rows={3}
            className="w-full rounded-lg bg-neutral-800 border border-neutral-600 text-neutral-100 p-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-70"
          />
        </div>

        <ErrorAlert error={error ?? ""} />

        {result && (
          <div className="space-y-2 mt-4 p-4 rounded-lg bg-neutral-800/80">
            <p className="font-medium text-amber-400">
              Flip the switch <strong>down</strong> when the bomb timer seconds show <strong>{result.downAt}</strong>.
            </p>
            <p className="font-medium text-amber-400">
              Flip the switch <strong>up</strong> when the bomb timer seconds show <strong>{result.upAt}</strong>.
            </p>
          </div>
        )}

        <SolverControls
          onSolve={handleSolve}
          onReset={reset}
          isSolveDisabled={!canSolve}
          isLoading={isLoading}
        />
        <TwitchCommandDisplay command={twitchCommand} />
      </div>
    </SolverLayout>
  );
}
