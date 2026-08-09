import { useCallback, useMemo, useState } from "react";
import { solveGuitarChords, type GuitarChordsOutput } from "../../services/guitarChordsService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  StageIndicator, TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Button } from "../ui";

const CHORDS = [
  "Ab", "Ab7", "Abm7", "A", "Am", "A7", "Am7", "Bb", "Bbm", "Bbm7", "B", "Bm", "B7",
  "C", "C7", "Cm7", "C#", "C#m", "C#7", "C#m7", "D", "Dm", "D7", "Dm7", "Ebm", "Eb7",
  "Em", "E7", "Em7", "F7", "Fm7", "F#", "F#m", "F#7", "F#m7", "G", "Gm", "G7",
];

interface SavedState {
  chord?: string;
  input?: { chord?: string };
  completedStages?: number;
  stage?: number;
  result?: GuitarChordsOutput | null;
  twitchCommand?: string;
}

export default function GuitarChordsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [chord, setChord] = useState("");
  const [completedStages, setCompletedStages] = useState(0);
  const [result, setResult] = useState<GuitarChordsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(
    () => ({ chord, completedStages, result, twitchCommand }),
    [chord, completedStages, result, twitchCommand],
  );

  useSolverModulePersistence<SavedState, GuitarChordsOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      if (saved.input?.chord) setChord(saved.input.chord);
      else if (saved.chord !== undefined) setChord(saved.chord);
      if (typeof saved.completedStages === "number") setCompletedStages(saved.completedStages);
      else if (typeof saved.stage === "number") setCompletedStages(saved.stage);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: GuitarChordsOutput) => {
      setResult(solution); setCompletedStages(solution.stage);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.GUITAR_CHORDS, result: solution }));
    }, []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!chord) return setError("Select the displayed chord");
    clearError(); setIsLoading(true);
    try {
      const response = await solveGuitarChords(round.id, bomb.id, currentModule.id, chord);
      const command = generateTwitchCommand({ moduleType: ModuleType.GUITAR_CHORDS, result: response.output });
      setResult(response.output); setCompletedStages(response.output.stage); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id,
        { chord, completedStages: response.output.stage, result: response.output, twitchCommand: command },
        response.output, response.solved,
      );
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Guitar Chords"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, chord, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const nextStage = () => { setChord(""); setResult(null); setTwitchCommand(""); clearError(); };
  const currentStage = Math.min(completedStages + 1, 3);

  return <SolverLayout>
    <SolverSection title="Stage progress" description={isSolved ? "All three stages complete." : `Solve stage ${currentStage}.`}>
      <StageIndicator total={3} current={isSolved ? 4 : currentStage} completedThrough={completedStages} />
    </SolverSection>
    {!result && <SolverSection title={`Stage ${currentStage} chord`} description="Select the chord shown on the active display.">
      <label className="block text-sm font-medium">Displayed chord
        <select
          value={chord} onChange={(event) => { setChord(event.target.value); clearError(); }}
          disabled={isLoading || isSolved} aria-label="Displayed chord"
          className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3"
        >
          <option value="">Select chord</option>
          {CHORDS.map((name) => <option key={name}>{name}</option>)}
        </select>
      </label>
    </SolverSection>}
    {!result && <SolverControls onSolve={solve} onReset={() => {}} showReset={false} isLoading={isLoading} isSolved={isSolved} solveText={`Solve stage ${currentStage}`} />}
    <ErrorAlert error={error} />
    {result && <SolverSection title={`Stage ${result.stage} fingering`} className="border-emerald-500/40">
      <p className="text-center text-lg font-semibold">{result.chord} with capo {result.capoPosition}</p>
      <ol className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="Frets from bottom string to top string">
        {result.frets.map((fret, index) => <li key={index} className="rounded-md border bg-muted/30 px-2 py-3 text-center">
          <span className="block text-xs text-muted-foreground">String {6 - index}</span>
          <strong>{fret === "-" ? "Empty" : `Fret ${fret}`}</strong>
        </li>)}
      </ol>
      {!isSolved && <div className="mt-4 text-center"><Button type="button" onClick={nextStage}>Enter stage {result.stage + 1}</Button></div>}
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Select the shown frets from the bottom string to the top string, leave dashes empty, then press Play.</SolverInstructions>
  </SolverLayout>;
}
