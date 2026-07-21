import { useCallback, useMemo, useState } from "react";

import {
  POLYHEDRAL_MAZE_SOLIDS,
  POLYHEDRAL_MAZE_START_FACES,
  solvePolyhedralMaze,
  type PolyhedralMazeInput,
  type PolyhedralMazeOutput,
} from "../../services/polyhedralMazeService";
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

const SELECT_CLASS = "mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm";
const faceLabel = (face: number) => String(face).padStart(2, "0");

export default function PolyhedralMazeSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [polyhedron, setPolyhedron] = useState("");
  const [startFace, setStartFace] = useState("0");
  const [destinationFace, setDestinationFace] = useState("");
  const [firstClockHour, setFirstClockHour] = useState("");
  const [result, setResult] = useState<PolyhedralMazeOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const savedState = useMemo(
    () => ({ polyhedron, startFace, destinationFace, firstClockHour, result }),
    [polyhedron, startFace, destinationFace, firstClockHour, result],
  );

  useSolverModulePersistence<typeof savedState, PolyhedralMazeOutput>({
    state: savedState,
    onRestoreState: useCallback((saved: Partial<typeof savedState> & { input?: Partial<PolyhedralMazeInput> }) => {
      const input = saved.input ?? saved;
      if (input.polyhedron) setPolyhedron(input.polyhedron);
      if (input.startFace !== undefined) setStartFace(String(input.startFace));
      if (input.destinationFace !== undefined) setDestinationFace(String(input.destinationFace));
      if (saved.firstClockHour !== undefined) setFirstClockHour(saved.firstClockHour);
      if (saved.result) setResult(saved.result);
    }, []),
    onRestoreSolution: useCallback((solution: PolyhedralMazeOutput) => {
      if (solution?.route?.length) setResult(solution);
    }, []),
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as PolyhedralMazeOutput & { output?: PolyhedralMazeOutput };
      return value.output ?? (value.route ? value : null);
    },
    currentModule,
    setIsSolved,
  });

  const selectedSolid = POLYHEDRAL_MAZE_SOLIDS.find((solid) => solid.name === polyhedron);
  const valid = Boolean(selectedSolid && destinationFace !== "" && Number.isInteger(Number(destinationFace)));
  const twitchCommand = result ? generateTwitchCommand({
    moduleType: ModuleType.POLYHEDRAL_MAZE,
    result: { ...result, firstClockHour: firstClockHour ? Number(firstClockHour) : undefined },
  }) : "";
  const changeInput = () => { setResult(null); clearError(); };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!polyhedron || destinationFace === "") return setError("Select the solid and enter both displayed face numbers");
    const input: PolyhedralMazeInput = {
      polyhedron,
      startFace: Number(startFace),
      destinationFace: Number(destinationFace),
    };
    clearError(); setIsLoading(true);
    try {
      const response = await solvePolyhedralMaze(round.id, bomb.id, currentModule.id, input);
      setResult(response.output); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { ...input, firstClockHour, result: response.output },
        response.output,
        response.solved,
      );
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Polyhedral Maze"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, polyhedron, startFace, destinationFace, firstClockHour, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setPolyhedron(""); setStartFace("0"); setDestinationFace(""); setFirstClockHour(""); setResult(null); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Displayed solid and faces" description="Identify the solid, then enter the green start display and red destination display.">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-medium sm:col-span-3">Polyhedron
          <select
            aria-label="Polyhedron"
            value={polyhedron}
            onChange={(event) => { setPolyhedron(event.target.value); setDestinationFace(""); changeInput(); }}
            disabled={isLoading || isSolved}
            className={SELECT_CLASS}
          >
            <option value="">Select a solid…</option>
            {POLYHEDRAL_MAZE_SOLIDS.map((solid) => <option key={solid.name} value={solid.name}>{solid.name}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Start face
          <select
            aria-label="Start face"
            value={startFace}
            onChange={(event) => { setStartFace(event.target.value); changeInput(); }}
            disabled={isLoading || isSolved}
            className={SELECT_CLASS}
          >
            {POLYHEDRAL_MAZE_START_FACES.map((face) => <option key={face} value={face}>{faceLabel(face)}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium sm:col-span-2">Destination face
          <Input
            aria-label="Destination face"
            type="number"
            min={0}
            max={selectedSolid ? selectedSolid.faces - 1 : 61}
            value={destinationFace}
            onChange={(event) => { setDestinationFace(event.target.value); changeInput(); }}
            disabled={isLoading || isSolved || !selectedSolid}
            className="mt-1 font-mono"
          />
          {selectedSolid && <span className="mt-1 block text-xs text-muted-foreground">0–{selectedSolid.faces - 1}</span>}
        </label>
      </div>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={!valid} solveText="Find route" />
    <ErrorAlert error={error} />

    {result && <SolverSection title="Route" className="border-emerald-500/40">
      <p className="mb-3 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm font-semibold">Reset the physical module before following this route.</p>
      <div className="flex flex-wrap items-center gap-2" aria-label="Face route">
        {result.route.map((face, index) => <span key={`${face}-${index}`} className="contents">
          {index > 0 && <span aria-hidden className="text-muted-foreground">→</span>}
          <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 font-mono text-lg font-bold">{faceLabel(face)}</span>
        </span>)}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Twitch-relative turns after the first move (1 is immediately left; backtracking is never used): <span className="font-mono font-semibold text-foreground">{result.relativeDirections.join(" → ")}</span></p>
      <label className="mt-4 block text-sm font-medium">First arrow clock hour (optional, for Twitch)
        <select
          aria-label="First arrow clock hour"
          value={firstClockHour}
          onChange={(event) => setFirstClockHour(event.target.value)}
          disabled={isLoading}
          className={SELECT_CLASS}
        >
          <option value="">Select after seeing the route…</option>
          {Array.from({ length: 12 }, (_, index) => index + 1).map((hour) => <option key={hour} value={hour}>{hour} o’clock</option>)}
        </select>
      </label>
    </SolverSection>}

    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Face numbers use the default rule-seed manual. On each face, choose the arrow leading to the next route chip; the relative turn numbers are only needed for Twitch.</SolverInstructions>
  </SolverLayout>;
}
