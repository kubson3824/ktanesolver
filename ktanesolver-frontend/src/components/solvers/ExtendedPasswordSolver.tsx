import { useCallback, useMemo, useState } from "react";
import {
  solveExtendedPassword,
  type ExtendedPasswordOutput,
} from "../../services/extendedPasswordService";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverResult,
  SolverSection,
  TwitchCommandDisplay,
  useSolver,
  useSolverModulePersistence,
} from "../common";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";

export default function ExtendedPasswordSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [letters, setLetters] = useState<Record<number, string[]>>({});
  const [result, setResult] = useState<ExtendedPasswordOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const moduleState = useMemo(() => ({ letters, result, twitchCommand }), [letters, result, twitchCommand]);

  const restoreSolution = useCallback((solution: ExtendedPasswordOutput) => {
    setResult(solution);
    if (solution.resolved) {
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.EXTENDED_PASSWORD, result: solution }));
    }
  }, []);

  useSolverModulePersistence<typeof moduleState, ExtendedPasswordOutput>({
    state: moduleState,
    onRestoreState: (state: typeof moduleState & { input?: { letters?: Record<number, string[]> } }) => {
      if (state.input?.letters) setLetters(state.input.letters);
      else if (state.letters) setLetters(state.letters);
      if (state.result) setResult(state.result);
      if (state.twitchCommand) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: restoreSolution,
    inferSolved: (solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved) || Boolean(solution?.resolved),
    currentModule,
    setIsSolved,
  });

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError();
    setIsLoading(true);
    try {
      const response = await solveExtendedPassword(round.id, bomb.id, currentModule.id, letters);
      const command = response.output.resolved
        ? generateTwitchCommand({ moduleType: ModuleType.EXTENDED_PASSWORD, result: response.output })
        : "";
      setResult(response.output);
      setTwitchCommand(command);
      if (response.output.resolved) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Extended Password");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setLetters({});
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  return <SolverLayout>
    <SolverSection
      title="Password columns"
      description="Enter the letters visible in each of the six columns, in any order."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((column) => <div key={column} className="flex flex-col gap-1.5">
          <label htmlFor={`extended-password-column-${column}`} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Column {column}
          </label>
          <Input
            id={`extended-password-column-${column}`}
            value={(letters[column] ?? []).join("")}
            onChange={(event) => setLetters((current) => ({
              ...current,
              [column]: event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6).split(""),
            }))}
            maxLength={6}
            disabled={isLoading}
            aria-label={`Column ${column} letters`}
            className="text-center font-mono text-lg font-semibold uppercase tracking-widest"
            placeholder="ABC"
          />
        </div>)}
      </div>
    </SolverSection>

    <SolverControls
      onSolve={solve}
      onReset={reset}
      isSolveDisabled={!Object.values(letters).some((column) => column.length)}
      isLoading={isLoading}
      solveText="Find password"
    />
    <ErrorAlert error={error} />

    {result && <>
      <SolverResult
        variant={result.resolved ? "success" : "warning"}
        title={result.resolved ? `Password: ${result.possibleWords[0]}` : result.possibleWords.length ? "Multiple possibilities" : "No matching password"}
        description={result.resolved ? undefined : result.possibleWords.length ? "Enter more visible letters to narrow the answer." : "Check the entered column letters."}
      />
      <SolverSection title={`Candidates (${result.possibleWords.length})`}>
        <div className="flex flex-wrap gap-2">
          {result.possibleWords.map((word) => <Badge key={word} variant={result.resolved ? "success" : "secondary"} className="font-mono">
            {word}
          </Badge>)}
        </div>
      </SolverSection>
    </>}

    <TwitchCommandDisplay command={twitchCommand} />
    <SolverInstructions>Cycle each column and enter the letters it contains. Submit the single matching six-letter word.</SolverInstructions>
  </SolverLayout>;
}
