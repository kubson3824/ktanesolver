import { useCallback, useMemo, useState } from "react";

import { solveMorseAMaze, type MorseAMazeOutput } from "../../services/morseAMazeService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
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
import { Input } from "../ui";

const DIRECT_WORDS = ["pulses", "pulse", "cousin", "brass", "spurs", "prove", "guards", "essays", "strobe", "stroke", "tactic", "counts", "artist", "opener", "award", "toast", "stayed", "prone"];
const SPECIAL_WORDS = ["assay", "mosaic", "rabbit", "stench", "submit", "salads", "tribes", "awards", "count", "sword", "apron", "county", "bought", "summit", "things", "music", "tacit", "thinks"];
const COORDINATES = Array.from({ length: 36 }, (_, index) => `${String.fromCharCode(65 + index % 6)}${Math.floor(index / 6) + 1}`);
const ARROWS: Record<string, string> = { UP: "↑", DOWN: "↓", LEFT: "←", RIGHT: "→" };

const cell = (coordinate: string) => ({ row: Number(coordinate[1]), col: coordinate.charCodeAt(0) - 64 });

export default function MorseAMazeSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [word, setWord] = useState(DIRECT_WORDS[0]);
  const [start, setStart] = useState("A1");
  const [target, setTarget] = useState("F6");
  const [mazeValueOverride, setMazeValueOverride] = useState<number | "">("");
  const [result, setResult] = useState<MorseAMazeOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const savedState = useMemo(() => ({ word, start, target, mazeValueOverride, result, twitchCommand }), [word, start, target, mazeValueOverride, result, twitchCommand]);

  useSolverModulePersistence<typeof savedState, MorseAMazeOutput>({
    state: savedState,
    onRestoreState: useCallback((saved) => {
      if ([...DIRECT_WORDS, ...SPECIAL_WORDS].includes(saved.word)) setWord(saved.word);
      if (COORDINATES.includes(saved.start)) setStart(saved.start);
      if (COORDINATES.includes(saved.target)) setTarget(saved.target);
      if (saved.mazeValueOverride === "" || Number.isInteger(saved.mazeValueOverride)) setMazeValueOverride(saved.mazeValueOverride);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: MorseAMazeOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.MORSE_A_MAZE, result: solution }));
    }, []),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required round, bomb, or module");
    if (start === target) return setError("Start and target must be different coordinates");
    if (word === "things" && mazeValueOverride === "") return setError("Enter the starting time in minutes");
    clearError(); setIsLoading(true);
    try {
      const input = { word, start: cell(start), target: cell(target), ...(mazeValueOverride === "" ? {} : { mazeValueOverride }) };
      const response = await solveMorseAMaze(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.MORSE_A_MAZE, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...savedState, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Morse-A-Maze"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, start, target, word, mazeValueOverride, clearError, markModuleSolved, savedState, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setWord(DIRECT_WORDS[0]); setStart("A1"); setTarget("F6"); setMazeValueOverride(""); setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Morse transmission" description="Select the decoded word, then the transmitted destination coordinate.">
      <label className="block text-sm font-medium">Decoded word
        <select value={word} onChange={(event) => { setWord(event.target.value); setResult(null); clearError(); }} disabled={isLoading || isSolved} className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3" aria-label="Decoded Morse word">
          <optgroup label="Direct maze words">{DIRECT_WORDS.map((value) => <option key={value}>{value}</option>)}</optgroup>
          <optgroup label="Edgework words">{SPECIAL_WORDS.map((value) => <option key={value}>{value}</option>)}</optgroup>
        </select>
      </label>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {["Start", "Target"].map((label) => <label key={label} className="text-sm font-medium">{label}
          <select value={label === "Start" ? start : target} onChange={(event) => label === "Start" ? setStart(event.target.value) : setTarget(event.target.value)} disabled={isLoading || isSolved} className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3" aria-label={`${label} coordinate`}>
            {COORDINATES.map((coordinate) => <option key={coordinate}>{coordinate}</option>)}
          </select>
        </label>)}
      </div>
      {SPECIAL_WORDS.includes(word) && <label className="mt-4 block text-sm font-medium">Maze lookup value override {word === "things" ? "(required)" : "(optional)"}
        <Input type="number" min={0} value={mazeValueOverride} onChange={(event) => setMazeValueOverride(event.target.value === "" ? "" : event.target.valueAsNumber)} disabled={isLoading || isSolved} className="mt-1" aria-label="Maze lookup value override" />
        <span className="mt-1 block text-xs font-normal text-muted-foreground">Use for the starting timer or the sum of live two-factor digits; otherwise stored edgework is used.</span>
      </label>}
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find route" />
    <ErrorAlert error={error} />
    {result && <>
      <SolverResult variant="success" title={`Maze ${result.mazeIndex} — ${result.mazeWord}`} description={`${start} to ${target}: ${result.moves.length} moves`} />
      <SolverSection title="Move the status light" description="Follow the arrows in order.">
        <ol className="flex flex-wrap gap-2" aria-label="Movement sequence">{result.moves.map((move, index) => <li key={index} className="flex h-10 w-10 items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/10 text-2xl font-bold" aria-label={`${index + 1}: ${move.toLowerCase()}`}>{ARROWS[move]}</li>)}</ol>
      </SolverSection>
    </>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Default rule seed. The override takes the manual’s numeric lookup value modulo 18.</SolverInstructions>
  </SolverLayout>;
}
