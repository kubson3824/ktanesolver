import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  solveThreeDMaze,
  type ThreeDMazeOutput,
  type ThreeDMazeSolveRequest,
  type ThreeDMazeSolveResponse,
  type MarkerLetter,
  type GoalDirection,
} from "../../services/threeDMazeService";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import { useRoundStore } from "../../store/useRoundStore";

const MARKER_LETTERS: MarkerLetter[] = ["A", "B", "C", "D", "H"];
const GOAL_DIRECTIONS: { value: GoalDirection; label: string }[] = [
  { value: "N", label: "North" },
  { value: "S", label: "South" },
  { value: "E", label: "East" },
  { value: "W", label: "West" },
];

interface ThreeDMazeSolverProps {
  bomb: BombEntity | null | undefined;
}

const LETTER_AT_POSITION_OPTIONS = ["", "A", "B", "C", "D", "H", "N", "S", "E", "W"] as const;

export default function ThreeDMazeSolver({ bomb }: ThreeDMazeSolverProps) {
  const [starLetters, setStarLetters] = useState<[MarkerLetter, MarkerLetter, MarkerLetter]>(["A", "A", "A"]);
  const [goalDirection, setGoalDirection] = useState<GoalDirection | "">("");
  const [currentFacing, setCurrentFacing] = useState<GoalDirection | "">("");
  const [letterAtPosition, setLetterAtPosition] = useState<string>("");
  const [stepsToWall, setStepsToWall] = useState<[number, number, number, number]>([0, 0, 0, 0]);
  const [result, setResult] = useState<ThreeDMazeSolveResponse["output"] | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const {
    isLoading,
    error,
    setIsLoading,
    setError,
    setIsSolved,
    clearError,
    reset: resetSolverState,
    currentModule,
    round,
    markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((s) => s.updateModuleAfterSolve);

  const moduleState = useMemo(
    () => ({ starLetters, goalDirection, currentFacing, letterAtPosition, stepsToWall, result, twitchCommand }),
    [starLetters, goalDirection, currentFacing, letterAtPosition, stepsToWall, result, twitchCommand]
  );

  const onRestoreState = useCallback(
    (state: {
      starLetters?: [string, string, string];
      goalDirection?: string;
      currentFacing?: string;
      letterAtPosition?: string;
      stepsToWall?: [number, number, number, number];
      result?: ThreeDMazeOutput | null;
      twitchCommand?: string;
      input?: { starLetters?: string[]; goalDirection?: string; currentFacing?: string; letterAtPosition?: string; stepsToWall?: number[] };
    }) => {
      const letters = state.starLetters ?? state.input?.starLetters;
      if (Array.isArray(letters) && letters.length >= 3) {
        const valid = (s: string): MarkerLetter =>
          MARKER_LETTERS.includes(s as MarkerLetter) ? (s as MarkerLetter) : "A";
        setStarLetters([valid(letters[0]), valid(letters[1]), valid(letters[2])]);
      }
      const dir = state.goalDirection ?? state.input?.goalDirection;
      if (dir && (["N", "S", "E", "W"] as const).includes(dir as GoalDirection)) {
        setGoalDirection(dir as GoalDirection);
      }
      const cf = state.currentFacing ?? state.input?.currentFacing;
      if (cf && (["N", "S", "E", "W"] as const).includes(cf as GoalDirection)) setCurrentFacing(cf as GoalDirection);
      const lap = state.letterAtPosition ?? state.input?.letterAtPosition;
      if (lap != null) setLetterAtPosition(lap);
      const st = state.stepsToWall ?? state.input?.stepsToWall;
      if (Array.isArray(st) && st.length === 4) setStepsToWall([st[0], st[1], st[2], st[3]]);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand != null) setTwitchCommand(state.twitchCommand);
    },
    []
  );

  const onRestoreSolution = useCallback((solution: ThreeDMazeOutput) => {
    if (solution?.goalRow != null && solution?.goalCol != null) {
      setResult(solution);
      setTwitchCommand(
        generateTwitchCommand({
          moduleType: ModuleType.THREE_D_MAZE,
          result: solution,
        })
      );
    }
  }, []);

  useSolverModulePersistence<
    { starLetters: [MarkerLetter, MarkerLetter, MarkerLetter]; goalDirection: GoalDirection | ""; currentFacing: GoalDirection | ""; letterAtPosition: string; stepsToWall: [number, number, number, number]; result: ThreeDMazeSolveResponse["output"] | null; twitchCommand: string },
    ThreeDMazeOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      const o = raw as { goalRow?: number; goalCol?: number; goalDirection?: string | null };
      if (typeof o.goalRow === "number" && typeof o.goalCol === "number") {
        return raw as ThreeDMazeOutput;
      }
      return null;
    },
    inferSolved: (_sol, mod) => Boolean((mod as { solved?: boolean })?.solved),
    currentModule,
    setIsSolved,
  });

  const handleSolve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing round, bomb, or module.");
      return;
    }
    setIsLoading(true);
    clearError();
    try {
      const useDistanceId = stepsToWall.every((n) => typeof n === "number" && n >= 0);
      const request: ThreeDMazeSolveRequest = {
        input: {
          starLetters: [...starLetters],
          ...(goalDirection !== "" ? { goalDirection } : {}),
          ...(useDistanceId ? {
            letterAtPosition: letterAtPosition || undefined,
            stepsToWall: [...stepsToWall],
          } : {}),
        },
      };
      const response = await solveThreeDMaze(round.id, bomb.id, currentModule.id, request);
      const output = response.output;
      if (!output) {
        setError(response.reason ?? "Solve failed.");
        return;
      }
      setResult(output);
      markModuleSolved(bomb.id, currentModule.id);
      const command = generateTwitchCommand({
        moduleType: ModuleType.THREE_D_MAZE,
        result: output,
      });
      setTwitchCommand(command);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { starLetters, goalDirection, currentFacing, letterAtPosition, stepsToWall, result: output, twitchCommand: command },
        { goalRow: output.goalRow, goalCol: output.goalCol, goalDirection: output.goalDirection ?? undefined, moves: output.moves, startRow: output.startRow, startCol: output.startCol, startFacing: output.startFacing, phase: output.phase, message: output.message },
        true
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Solve failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStarLetters(["A", "A", "A"]);
    setGoalDirection("");
    setCurrentFacing("");
    setLetterAtPosition("");
    setStepsToWall([0, 0, 0, 0]);
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  const moveLabel = (m: string): string => {
    switch (m) {
      case "FORWARD": return "Fwd";
      case "TURN_LEFT": return "L";
      case "TURN_RIGHT": return "R";
      default: return m;
    }
  };

  const directionLabel: Record<string, string> = {
    N: "North",
    S: "South",
    E: "East",
    W: "West",
  };

  return (
    <SolverLayout>
      <div className="rounded-xl border-2 border-neutral-600 bg-neutral-700/95 shadow-lg p-5 text-neutral-100">
        <p className="text-sm text-neutral-300 mb-4">
          Enter the three marker letters (A, B, C, D, or H) at the three stars to identify the maze, and the goal direction (N/S/E/W) that the defuser should move. Direction is not tied to the maze layout.
        </p>

        <div className="space-y-4">
          <h3 className="text-amber-400 font-semibold text-sm uppercase tracking-wide">
            Letters at the three stars
          </h3>
          <div className="flex flex-wrap gap-4">
            {([0, 1, 2] as const).map((i) => (
              <div key={i} className="flex items-center gap-2">
                <label className="text-neutral-400 text-sm">Star {i + 1}:</label>
                <select
                  className="select select-bordered bg-neutral-800 border-neutral-600 text-neutral-100 min-w-[4rem]"
                  value={starLetters[i]}
                  onChange={(e) => {
                    const next = [...starLetters] as [MarkerLetter, MarkerLetter, MarkerLetter];
                    next[i] = e.target.value as MarkerLetter;
                    setStarLetters(next);
                  }}
                >
                  {MARKER_LETTERS.map((letter) => (
                    <option key={letter} value={letter}>
                      {letter}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <h3 className="text-amber-400 font-semibold text-sm uppercase tracking-wide mt-4">
            Goal direction <span className="text-neutral-500 font-normal">(leave empty until defuser has read it at a star)</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`btn btn-sm ${goalDirection === "" ? "btn-primary" : "btn-ghost bg-neutral-800 border border-neutral-600"}`}
              onClick={() => setGoalDirection("")}
            >
              Not yet
            </button>
            {GOAL_DIRECTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`btn btn-sm ${goalDirection === value ? "btn-primary" : "btn-ghost bg-neutral-800 border border-neutral-600"}`}
                onClick={() => setGoalDirection(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <h3 className="text-amber-400 font-semibold text-sm uppercase tracking-wide mt-4">
            Current position
          </h3>
          <p className="text-neutral-400 text-sm">
            You don&apos;t need to know compass direction. Enter the letter on the floor and measure steps to the wall in front of you, to your left, to your right, and behind you. First solve without goal direction to get path to nearest star; after defuser reports N/S/E/W, set goal direction and solve again for path to goal.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <label className="text-neutral-400 text-sm">Letter at cell:</label>
              <select
                className="select select-bordered bg-neutral-800 border-neutral-600 text-neutral-100 min-w-[4rem]"
                value={letterAtPosition}
                onChange={(e) => setLetterAtPosition(e.target.value)}
              >
                {LETTER_AT_POSITION_OPTIONS.map((opt) => (
                  <option key={opt || "empty"} value={opt}>{opt || "—"}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <label className="text-neutral-400 text-sm">Distances to wall:</label>
              {(
                [
                  [0, "Facing"],
                  [1, "Left"],
                  [2, "Right"],
                  [3, "Behind"],
                ] as const
              ).map(([i, label]) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <input
                    type="number"
                    min={0}
                    max={7}
                    className="input input-bordered w-14 bg-neutral-800 border-neutral-600 text-neutral-100"
                    value={stepsToWall[i]}
                    onChange={(e) => {
                      const n = Math.max(0, Math.min(7, parseInt(e.target.value, 10) || 0));
                      const next: [number, number, number, number] = [...stepsToWall];
                      next[i] = n;
                      setStepsToWall(next);
                    }}
                  />
                  <span className="text-neutral-500 text-xs">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <SolverControls
          onSolve={handleSolve}
          onReset={reset}
          isSolveDisabled={false}
          isLoading={isLoading}
          solveText="Solve"
        />
      </div>

      <ErrorAlert error={error} />

      {result && (
        <div className="rounded-xl border-2 border-green-700/50 bg-neutral-700/95 shadow-lg p-5 text-neutral-100 mt-6">
          <h3 className="text-amber-400 font-semibold mb-2 text-sm uppercase tracking-wide">Solution</h3>
          {result.phase === "go_to_star" && result.message && (
            <p className="text-amber-200/90 mb-2">{result.message}</p>
          )}
          {result.goalDirection != null && result.goalDirection !== "" && (
            <p className="text-lg">
              Goal: cell <strong>({result.goalRow}, {result.goalCol})</strong>. Follow the turn-by-turn moves below — you will end facing the exit. Then <strong>go forward</strong> through the wall.
            </p>
          )}
          {result.phase === "go_to_goal" && result.message && (
            <p className="text-neutral-400 text-sm mt-1">{result.message}</p>
          )}
          {result.moves != null && result.moves.length > 0 && (
            <div className="mt-4">
              <h4 className="text-amber-400/90 font-medium text-sm uppercase tracking-wide mb-2">Turn-by-turn</h4>
              {result.startRow != null && result.startCol != null && (
                <p className="text-neutral-400 text-sm mb-2">
                  From ({result.startRow}, {result.startCol}) facing {directionLabel[result.startFacing ?? ""] ?? result.startFacing}:
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {result.moves.map((move, i) => (
                  <span key={i} className="badge badge-lg bg-neutral-600 text-neutral-100">
                    {moveLabel(move)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <TwitchCommandDisplay command={twitchCommand} />
    </SolverLayout>
  );
}
