import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  solveAnagrams,
  type AnagramsSolveRequest,
  type AnagramsSolveResponse,
} from "../../services/anagramsService";
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
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/cn";

interface AnagramsSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function AnagramsSolver({ bomb }: AnagramsSolverProps) {
  const [displayWord, setDisplayWord] = useState<string>("");
  const [result, setResult] = useState<AnagramsSolveResponse["output"] | null>(null);
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
    () => ({ displayWord, result, twitchCommand }),
    [displayWord, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (
      state:
        | { displayWord?: string; result?: AnagramsSolveResponse["output"] | null; twitchCommand?: string }
        | { input?: { displayWord?: string } },
    ) => {
      if ("input" in state && state.input?.displayWord) {
        setDisplayWord(state.input.displayWord);
      } else if ("displayWord" in state && state.displayWord !== undefined) {
        setDisplayWord(state.displayWord);
      }

      if ("result" in state && state.result !== undefined) {
        setResult(state.result);
      }
      if ("twitchCommand" in state && state.twitchCommand !== undefined) {
        setTwitchCommand(state.twitchCommand);
      }
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (solution: AnagramsSolveResponse["output"]) => {
      if (!solution || !solution.possibleSolutions) return;
      setResult(solution);

      if (solution.possibleSolutions.length > 0) {
        const command = generateTwitchCommand({
          moduleType: ModuleType.ANAGRAMS,
          result: { possibleSolutions: solution.possibleSolutions },
        });
        setTwitchCommand(command);
      }
    },
    [],
  );

  useSolverModulePersistence<
    { displayWord: string; result: AnagramsSolveResponse["output"] | null; twitchCommand: string },
    AnagramsSolveResponse["output"]
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; result?: unknown };
        if ("result" in anyRaw) return anyRaw.result as AnagramsSolveResponse["output"];
        if (anyRaw.output && typeof anyRaw.output === "object") {
          return anyRaw.output as AnagramsSolveResponse["output"];
        }
        return raw as AnagramsSolveResponse["output"];
      }
      return null;
    },
    inferSolved: (_sol, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleDisplayWordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
    if (value.length <= 6) {
      setDisplayWord(value);
      if (error) clearError();
    }
  };

  const solveAnagramsModule = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    if (displayWord.length < 3) {
      setError("Please enter at least 3 letters");
      return;
    }

    clearError();
    setIsLoading(true);

    try {
      const input: AnagramsSolveRequest["input"] = {
        displayWord: displayWord.trim(),
      };

      const response = await solveAnagrams(round.id, bomb.id, currentModule.id, { input });

      setResult(response.output);

      if (response.output.possibleSolutions.length > 0) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);

        const command = generateTwitchCommand({
          moduleType: ModuleType.ANAGRAMS,
          result: response.output,
        });
        setTwitchCommand(command);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve anagrams");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setDisplayWord("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  return (
    <SolverLayout>
      <SolverSection
        title="Displayed word"
        description="Enter the letters shown on the Anagrams module."
      >
        <div className="mb-3 flex justify-center gap-1">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className={cn(
                "flex h-12 w-10 items-center justify-center rounded border-2 text-xl font-bold",
                displayWord[i]
                  ? "border-ring bg-accent/15 text-foreground"
                  : "border-border bg-muted/40 text-muted-foreground",
              )}
            >
              {displayWord[i] || ""}
            </div>
          ))}
        </div>

        <Input
          type="text"
          value={displayWord}
          onChange={handleDisplayWordChange}
          placeholder="Type the letters"
          className="text-center text-lg font-mono tracking-widest"
          maxLength={6}
          disabled={isLoading || isSolved}
          aria-label="Displayed letters"
        />
        <p className="mt-1.5 text-center text-xs text-muted-foreground tabular-nums">
          {displayWord.length}/6 letters (min 3)
        </p>
      </SolverSection>

      <SolverControls
        onSolve={solveAnagramsModule}
        onReset={reset}
        isSolveDisabled={displayWord.length < 3}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Find anagrams"
      />

      <ErrorAlert error={error} />

      {result &&
        (result.possibleSolutions.length > 0 ? (
          <SolverSection title="Possible solutions" className="border-emerald-500/40">
            <div className="flex flex-wrap gap-2">
              {result.possibleSolutions.map((solution, index) => (
                <Badge key={index} variant="default" className="font-mono text-sm">
                  {solution}
                </Badge>
              ))}
            </div>
          </SolverSection>
        ) : (
          <SolverResult variant="info" title="No solutions" description="No valid anagrams found." />
        ))}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        The solver finds all valid English words that can be formed from the displayed
        letters. Letters are uppercased automatically.
      </SolverInstructions>
    </SolverLayout>
  );
}
