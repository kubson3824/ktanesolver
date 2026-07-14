import { useCallback, useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import { solveTextField, type TextFieldOutput } from "../../services/textFieldService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Button } from "../ui/button";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export default function TextFieldSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [displayedLetter, setDisplayedLetter] = useState("A");
  const [result, setResult] = useState<TextFieldOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ displayedLetter, result, twitchCommand }), [displayedLetter, result, twitchCommand]);

  const restoreSolution = useCallback((solution: TextFieldOutput) => {
    setResult(solution);
    setTwitchCommand(`press ${solution.positions.map(({ column, row }) => `${column},${row}`).join(" ")}`);
  }, []);
  useSolverModulePersistence<typeof moduleState, TextFieldOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (LETTERS.includes(state.displayedLetter)) setDisplayedLetter(state.displayedLetter);
      if (state.result) setResult(state.result);
      if (state.twitchCommand) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: restoreSolution,
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveTextField(round.id, bomb.id, currentModule.id, displayedLetter);
      const command = `press ${response.output.positions.map(({ column, row }) => `${column},${row}`).join(" ")}`;
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { displayedLetter, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Text Field"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, displayedLetter, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setDisplayedLetter("A"); setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  const chooseLetter = (letter: string) => {
    setDisplayedLetter(letter); setResult(null); setTwitchCommand(""); clearError();
  };

  return <SolverLayout>
    <SolverSection title="Displayed letter" description="All 12 buttons show the same letter.">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {LETTERS.map((letter) => <Button key={letter} variant={displayedLetter === letter ? "default" : "outline"} onClick={() => chooseLetter(letter)} disabled={isLoading || isSolved}>{letter}</Button>)}
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find buttons" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Press every highlighted button" description={`Rule table ${result.tableName}`} className="border-emerald-500/40">
      <div className="mx-auto grid max-w-sm grid-cols-4 gap-2" aria-label="Text Field button grid">
        {Array.from({ length: 12 }, (_, index) => {
          const column = index % 4 + 1;
          const row = Math.floor(index / 4) + 1;
          const press = result.positions.some((position) => position.column === column && position.row === row);
          return <div key={index} aria-label={`column ${column}, row ${row}${press ? ", press" : ""}`} className={cn(
            "flex aspect-square items-center justify-center rounded-md border-2 text-xl font-bold",
            press ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "border-border bg-muted/30 text-muted-foreground",
          )}>{displayedLetter}</div>;
        })}
      </div>
      <p className="mt-3 text-center font-semibold text-emerald-700 dark:text-emerald-400">
        {result.positions.map(({ column, row }) => `${column},${row}`).join(" · ")}
      </p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Coordinates are column,row. Wait for the module light, then press each highlighted button once in any order.</SolverInstructions>
  </SolverLayout>;
}
