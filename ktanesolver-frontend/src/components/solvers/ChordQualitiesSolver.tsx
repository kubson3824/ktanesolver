import { useCallback, useMemo, useState } from "react";

import { solveChordQualities, type ChordQualitiesOutput } from "../../services/chordQualitiesService";
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
import { Button } from "../ui/button";

export const CHORD_NOTES = ["A", "A♯", "B", "C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯"];

export default function ChordQualitiesSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [notes, setNotes] = useState<string[]>([]);
  const [result, setResult] = useState<ChordQualitiesOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ notes, result, twitchCommand }), [notes, result, twitchCommand]);

  useSolverModulePersistence<typeof moduleState | { input?: { notes?: string[] } }, ChordQualitiesOutput>({
    state: moduleState,
    onRestoreState: useCallback((state) => {
      if ("input" in state && state.input?.notes) setNotes(state.input.notes);
      else if ("notes" in state && state.notes) setNotes(state.notes);
      if ("result" in state && state.result) setResult(state.result);
      if ("twitchCommand" in state && state.twitchCommand) setTwitchCommand(state.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: ChordQualitiesOutput) => {
      if (!solution?.answerNotes) return;
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.CHORD_QUALITIES, result: solution }));
    }, []),
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as ChordQualitiesOutput & { output?: ChordQualitiesOutput };
      return value.output ?? (value.answerNotes ? value : null);
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const toggleNote = (note: string) => {
    setNotes((current) => current.includes(note)
      ? current.filter((value) => value !== note)
      : current.length < 4 ? [...current, note] : current);
    setResult(null);
    setTwitchCommand("");
    clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (notes.length !== 4) return setError("Select exactly four notes");
    clearError();
    setIsLoading(true);
    try {
      const response = await solveChordQualities(round.id, bomb.id, currentModule.id, notes);
      const command = generateTwitchCommand({ moduleType: ModuleType.CHORD_QUALITIES, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { notes, result: response.output, twitchCommand: command }, response.output, true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Chord Qualities");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, notes, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setNotes([]);
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Given chord" description="Select the four notes marked by triangles on the module.">
      <div className="relative mx-auto aspect-square w-full max-w-[20rem] rounded-full border-4 border-primary/30 bg-muted/30">
        {CHORD_NOTES.map((note, index) => {
          const angle = index * Math.PI / 6;
          return <Button
            key={note}
            type="button"
            variant={notes.includes(note) ? "default" : "outline"}
            size="sm"
            className="absolute h-11 w-11 rounded-full p-0 font-bold"
            style={{ left: `${50 + 42 * Math.sin(angle)}%`, top: `${50 - 42 * Math.cos(angle)}%`, transform: "translate(-50%, -50%)" }}
            aria-pressed={notes.includes(note)}
            aria-label={`${note}${notes.includes(note) ? ", selected" : ""}`}
            disabled={isLoading || isSolved || (notes.length === 4 && !notes.includes(note))}
            onClick={() => toggleNote(note)}
          >{note}</Button>;
        })}
        <div className="absolute inset-[35%] flex items-center justify-center rounded-full border bg-background text-center text-sm font-semibold">
          {notes.length}/4 notes
        </div>
      </div>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={notes.length !== 4} />
    <ErrorAlert error={error} />

    {result && <SolverSection title={`Submit ${result.answerChord}`} className="border-emerald-500/40">
      <div className="text-center text-sm text-muted-foreground">Given chord: <strong className="text-foreground">{result.givenChord}</strong></div>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {result.answerNotes.map((note) => <span key={note} className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500/15 text-lg font-bold text-emerald-700 dark:text-emerald-300">{note}</span>)}
      </div>
    </SolverSection>}

    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>The notes are arranged chromatically around the wheel. A sharp is shown as ♯.</SolverInstructions>
  </SolverLayout>;
}
