import { useCallback, useMemo, useState } from "react";
import {
  FESTIVE_JUKEBOX_WORDS,
  solveFestiveJukebox,
  type FestiveJukeboxOutput,
} from "../../services/festiveJukeboxService";
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

export default function FestiveJukeboxSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [words, setWords] = useState(["", "", ""]);
  const [result, setResult] = useState<FestiveJukeboxOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
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
  const updateModuleAfterSolve = useRoundStore((store) => store.updateModuleAfterSolve);
  const state = useMemo(() => ({ words, result, twitchCommand }), [words, result, twitchCommand]);

  useSolverModulePersistence<typeof state, FestiveJukeboxOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      if (Array.isArray(saved.words) && saved.words.length === 3) setWords(saved.words);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: FestiveJukeboxOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.FESTIVE_JUKEBOX, result: solution }));
    }, []),
    currentModule,
    setIsSolved,
  });

  const changeWord = (index: number, word: string) => {
    setWords((current) => current.map((value, position) => position === index ? word : value));
    setResult(null);
    setTwitchCommand("");
    clearError();
  };

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError();
    setIsLoading(true);
    try {
      const enteredWords = words.map((word) => word.trim());
      const response = await solveFestiveJukebox(round.id, bomb.id, currentModule.id, enteredWords);
      const command = generateTwitchCommand({ moduleType: ModuleType.FESTIVE_JUKEBOX, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { words: enteredWords, result: response.output, twitchCommand: command },
        response.output,
        response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve The Festive Jukebox");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setWords(["", "", ""]);
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  return (
    <SolverLayout>
      <SolverSection title="Displayed lyrics">
        <datalist id="festive-jukebox-words">
          {FESTIVE_JUKEBOX_WORDS.map((word) => <option key={word} value={word} />)}
        </datalist>
        <div className="grid gap-3 sm:grid-cols-3">
          {words.map((word, index) => (
            <label key={index}>
              Position {index + 1}
              <input
                aria-label={`Lyric ${index + 1}`}
                list="festive-jukebox-words"
                value={word}
                disabled={isLoading || isSolved}
                onChange={(event) => changeWord(index, event.target.value)}
                className="mt-1 h-11 w-full rounded border bg-background px-3"
              />
            </label>
          ))}
        </div>
      </SolverSection>
      <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} />
      <ErrorAlert error={error} />
      {result && (
        <SolverSection title={`${result.songTitle} — ${result.artist}`} className="border-emerald-500/40">
          <p className="text-3xl font-bold">{result.positions.join(" → ")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{result.orderedWords.join(" → ")}</p>
        </SolverSection>
      )}
      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
      <SolverInstructions>
        Enter the three words from the top, middle, and bottom records. A wrong order strikes and replaces the song and all three words.
      </SolverInstructions>
    </SolverLayout>
  );
}
