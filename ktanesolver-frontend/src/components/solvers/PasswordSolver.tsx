import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solvePassword, type PasswordOutput } from "../../services/passwordService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverControls,
  SolverResult,
} from "../common";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";

interface PasswordSolverProps {
  bomb: BombEntity | null | undefined;
}

// All possible password words from the enum
export default function PasswordSolver({ bomb }: PasswordSolverProps) {
  const [columnLetters, setColumnLetters] = useState<Record<number, string[]>>({});
  const [result, setResult] = useState<PasswordOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  // Use the common solver hook for shared state
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

  // Save state to module when inputs change

  const moduleState = useMemo(
    () => ({ columnLetters, result, twitchCommand }),
    [columnLetters, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: { 
      columnLetters?: Record<number, string[]>; 
      result?: PasswordOutput | null; 
      twitchCommand?: string;
      input?: { letters?: Record<number, string[]> };
    }) => {
      // Prioritize the backend format (input.letters) over the local format
      if (state.input?.letters) {
        setColumnLetters(state.input.letters);
      } else if (state.columnLetters) {
        setColumnLetters(state.columnLetters);
      }
      
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (solution: PasswordOutput) => {
      if (!solution || !solution.possibleWords) return;
      setResult(solution);

      // Generate Twitch command when solution is restored
      if (solution.possibleWords.length === 1) {
        const command = generateTwitchCommand({
          moduleType: ModuleType.PASSWORDS,
          result: { password: solution.possibleWords[0] },
        });
        setTwitchCommand(command);
      }

      // Mark as solved if the solution is resolved
      if (solution.resolved) {
        setIsSolved(true);
      }
    },
    [setIsSolved],
  );

  useSolverModulePersistence<
    { columnLetters: Record<number, string[]>; result: PasswordOutput | null; twitchCommand: string },
    PasswordOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; result?: unknown };
        if (anyRaw.output && typeof anyRaw.output === "object") return anyRaw.output as PasswordOutput;
        if (anyRaw.result && typeof anyRaw.result === "object") return anyRaw.result as PasswordOutput;
        return raw as PasswordOutput;
      }
      return null;
    },
    inferSolved: (sol, currentModule) => 
      Boolean((currentModule as { solved?: boolean } | undefined)?.solved) || Boolean(sol?.resolved),
    currentModule,
    setIsSolved,
  });

  const handleColumnChange = (column: number, value: string) => {
    // Filter to keep only uppercase letters and convert to array
    const letters = value.split('')
      .filter(letter => letter >= 'A' && letter <= 'Z');
    setColumnLetters(prev => ({
      ...prev,
      [column]: letters
    }));
  };

  const handleSolve = async () => {
    if (!round || !currentModule || !bomb) return;
    
    setIsLoading(true);
    clearError();
    
    try {
      const input = {
        letters: columnLetters
      };
      
      const response = await solvePassword(round.id, bomb.id, currentModule.id, { input });
      setResult(response.output);
      
      // Generate Twitch command if resolved
      if (response.output.resolved) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
        
        const command = generateTwitchCommand({
          moduleType: ModuleType.PASSWORDS,
          result: { password: response.output.possibleWords[0] },
        });
        setTwitchCommand(command);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setColumnLetters({});
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };


  const hasAnyLetters = Object.values(columnLetters).some((arr) => arr.length > 0);

  return (
    <SolverLayout>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-center">Password Module</CardTitle>
          <p className="text-sm text-base-content/70 text-center">
            Enter the letters in each column (e.g. ABC). Up to 6 letters per column.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap justify-center gap-4">
            {[1, 2, 3, 4, 5].map((col) => (
              <div key={col} className="flex flex-col items-center">
                <label htmlFor={`password-column-${col}`} className="text-xs font-semibold text-base-content/80 mb-1.5">
                  Column {col}
                </label>
                <Input
                  id={`password-column-${col}`}
                  type="text"
                  className="text-center font-mono font-semibold text-lg w-24"
                  placeholder="ABC"
                  maxLength={6}
                  value={(columnLetters[col] || []).join("")}
                  onChange={(e) => handleColumnChange(col, e.target.value.toUpperCase())}
                  disabled={isLoading}
                  aria-label={`Column ${col} letters`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <SolverControls
        onSolve={handleSolve}
        onReset={handleReset}
        isSolveDisabled={!hasAnyLetters}
        isLoading={isLoading}
        solveText="Solve"
      />

      <ErrorAlert error={error} />

      {result && (
        <>
          {result.resolved && result.possibleWords.length === 1 ? (
            <SolverResult
              variant="success"
              title={`Solution: ${result.possibleWords[0]}`}
            />
          ) : (
            <SolverResult
              variant="warning"
              title="Multiple possibilities"
              description="Enter more letters to narrow down."
            />
          )}
          <div className="mb-4">
            <h4 className="font-semibold mb-2 text-sm text-base-content/80">
              Possible words ({result.possibleWords.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {result.possibleWords.map((word) => (
                <Badge
                  key={word}
                  variant={result.resolved && result.possibleWords[0] === word ? "success" : "secondary"}
                  className="font-mono text-sm py-1 px-3"
                >
                  {word}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}

      <TwitchCommandDisplay command={twitchCommand} />
    </SolverLayout>
  );
}
