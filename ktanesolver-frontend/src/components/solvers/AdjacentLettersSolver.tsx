import { useState } from "react";
import { solveAdjacentLetters, type AdjacentLettersOutput } from "../../services/adjacentLettersService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverSection,
  TwitchCommandDisplay,
  useSolver,
  useSolverModulePersistence,
} from "../common";
import { Input } from "../ui/input";
import { cn } from "../../lib/cn";

interface PersistedState {
  letters?: string;
  input?: { letters?: string[] };
  result?: AdjacentLettersOutput | null;
  twitchCommand?: string;
}

export default function AdjacentLettersSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [letters, setLetters] = useState("");
  const [result, setResult] = useState<AdjacentLettersOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);

  useSolverModulePersistence<PersistedState, AdjacentLettersOutput>({
    state: { letters, result, twitchCommand },
    onRestoreState: (state) => {
      if (state.input?.letters) setLetters(state.input.letters.join(""));
      else if (state.letters !== undefined) setLetters(state.letters);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: (solution) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.ADJACENT_LETTERS, result: solution }));
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean })?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (letters.length !== 12) return setError("Enter all 12 letters");
    if (new Set(letters).size !== 12) return setError("All 12 letters must be different");
    clearError();
    setIsLoading(true);
    try {
      const response = await solveAdjacentLetters(round.id, bomb.id, currentModule.id, letters.split(""));
      const command = generateTwitchCommand({ moduleType: ModuleType.ADJACENT_LETTERS, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { letters, result: response.output, twitchCommand: command },
        response.output,
        response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Adjacent Letters");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setLetters("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  const grid = Array.from({ length: 12 }, (_, index) => letters[index] ?? "");
  const pressLetters = new Set(result?.pressLetters ?? []);

  return <SolverLayout>
    <SolverSection
      title="Letter grid"
      description="Enter the 12 letters row by row, from top-left to bottom-right."
    >
      <label className="block text-sm font-medium">
        Letters
        <Input
          value={letters}
          onChange={(event) => {
            setLetters(event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 12));
            if (error) clearError();
          }}
          maxLength={12}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          disabled={isLoading || isSolved}
          placeholder="AGXZCDYNBPHL"
          className="mt-2 font-mono tracking-[0.35em]"
        />
      </label>
      <div className="mx-auto mt-4 grid w-fit grid-cols-4 gap-2" role="grid" aria-label="Adjacent Letters grid">
        {grid.map((letter, index) => {
          const shouldPress = Boolean(result && pressLetters.has(letter));
          return <div
            key={index}
            role="gridcell"
            aria-label={`Row ${Math.floor(index / 4) + 1}, column ${index % 4 + 1}: ${letter || "empty"}${result ? shouldPress ? ", press" : ", leave up" : ""}`}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-md border-2 font-mono text-xl font-bold",
              shouldPress ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "border-border bg-muted/40",
            )}
          >{letter || "·"}</div>;
        })}
      </div>
    </SolverSection>

    <SolverControls
      onSolve={solve}
      onReset={reset}
      isSolveDisabled={letters.length !== 12 || new Set(letters).size !== 12}
      isLoading={isLoading}
      isSolved={isSolved}
      solveText="Find letters"
    />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Result">
      <p className="text-center font-semibold text-emerald-700 dark:text-emerald-400">
        {result.pressLetters.length ? `Press ${result.pressLetters.join(" ")}, then Submit` : "Leave all letters up, then Submit"}
      </p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>
      Green buttons must be pushed down. Leave every other button up, then press Submit. Order does not matter.
    </SolverInstructions>
  </SolverLayout>;
}
