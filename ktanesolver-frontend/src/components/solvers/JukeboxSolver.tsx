import { useCallback, useMemo, useState } from "react";
import { solveJukebox, type JukeboxInput, type JukeboxOutput } from "../../services/jukeboxService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Input } from "../ui/input";

const POSITIONS = ["Top", "Middle", "Bottom"];

export default function JukeboxSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [lyrics, setLyrics] = useState(["", "", ""]);
  const [result, setResult] = useState<JukeboxOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ lyrics, result, twitchCommand }), [lyrics, result, twitchCommand]);

  useSolverModulePersistence<typeof moduleState, JukeboxOutput>({
    state: moduleState,
    onRestoreState: (state: Partial<typeof moduleState> & { input?: Partial<JukeboxInput> }) => {
      const input = state.input ?? state;
      if (input.lyrics?.length === 3) setLyrics(input.lyrics);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: (solution) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.JUKEBOX, result: solution }));
    },
    inferSolved: (_solution, module) => Boolean(module && typeof module === "object" && "solved" in module && module.solved),
    currentModule,
    setIsSolved,
  });

  const changeLyric = (index: number, value: string) => {
    setLyrics((current) => current.map((lyric, lyricIndex) => lyricIndex === index ? value : lyric));
    setResult(null); setTwitchCommand(""); clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (lyrics.some((lyric) => !lyric.trim())) return setError("Enter all three displayed lyrics");
    clearError(); setIsLoading(true);
    try {
      const input = { lyrics: lyrics.map((lyric) => lyric.trim()) };
      const response = await solveJukebox(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.JUKEBOX, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve The Jukebox"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, lyrics, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setLyrics(["", "", ""]); setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Displayed lyrics" description="Enter the three words from top to bottom.">
      <div className="grid gap-3 sm:grid-cols-3">
        {POSITIONS.map((position, index) => <label key={position} className="text-sm font-medium">
          {position}
          <Input
            value={lyrics[index]}
            onChange={(event) => changeLyric(index, event.target.value)}
            disabled={isLoading || isSolved}
            aria-label={`${position} lyric`}
            className="mt-2"
          />
        </label>)}
      </div>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={lyrics.some((lyric) => !lyric.trim())} solveText="Get press order" />
    <ErrorAlert error={error} />

    {result && <SolverSection title={result.songTitle} description="Press the records in this order." className="border-emerald-500/40">
      <ol className="grid gap-2 sm:grid-cols-3">
        {result.pressPositions.map((position, index) => <li key={position} className="rounded-md border bg-emerald-500/10 p-4 text-center">
          <span className="block text-xs text-muted-foreground">{index + 1}</span>
          <span className="block text-lg font-semibold">{POSITIONS[position - 1]} · {lyrics[position - 1]}</span>
        </li>)}
      </ol>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Use the words exactly as shown. The solver identifies the only song containing all three and orders their record buttons by their first occurrence in the lyric.</SolverInstructions>
  </SolverLayout>;
}
