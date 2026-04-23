import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { solveChess, type ChessSolveResponse } from "../../services/chessService";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  SolverResult,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import { useRoundStore } from "../../store/useRoundStore";
import { Input } from "../ui/input";
import { cn } from "../../lib/cn";

const FILES = ["a", "b", "c", "d", "e", "f"] as const;
const RANKS = [1, 2, 3, 4, 5, 6] as const;

const PIECE_SYMBOLS: Record<string, string> = {
  KING: "♔",
  QUEEN: "♕",
  ROOK: "♖",
  BISHOP: "♗",
  KNIGHT: "♘",
};

function normalizeCoord(s: string): string {
  const t = s.trim().toLowerCase();
  if (t.length >= 2) {
    const file = t[0];
    const rank = t[1];
    if (FILES.includes(file as (typeof FILES)[number]) && /^[1-6]$/.test(rank)) {
      return file + rank;
    }
  }
  return "";
}

function isValidCoord(s: string): boolean {
  return normalizeCoord(s).length === 2;
}

interface ChessSolverProps {
  bomb: BombEntity | null | undefined;
}

const defaultCoordinates = (): string[] => ["", "", "", "", "", ""];

export default function ChessSolver({ bomb }: ChessSolverProps) {
  const [coordinates, setCoordinates] = useState<string[]>(() => defaultCoordinates());
  const [result, setResult] = useState<ChessSolveResponse["output"] | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

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

  const updateModuleAfterSolve = useRoundStore((s) => s.updateModuleAfterSolve);

  const moduleState = useMemo(
    () => ({
      coordinates,
      result,
      pieceAssignments: result?.pieceAssignments,
      twitchCommand,
    }),
    [coordinates, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      coordinates?: string[];
      result?: ChessSolveResponse["output"] | null;
      pieceAssignments?: Record<string, string>;
      coordinate?: string;
      twitchCommand?: string;
      input?: { coordinates?: string[] };
    }) => {
      if (state.coordinates?.length === 6) setCoordinates(state.coordinates);
      else if (state.input?.coordinates?.length === 6) setCoordinates(state.input.coordinates);
      if (state.result !== undefined) {
        const restored = state.result;
        const withPieces =
          restored != null && (restored.pieceAssignments ?? state.pieceAssignments)
            ? { ...restored, pieceAssignments: restored.pieceAssignments ?? state.pieceAssignments }
            : restored;
        setResult(withPieces);
      } else if (state.coordinate != null || state.pieceAssignments != null) {
        setResult({
          coordinate: state.coordinate ?? "",
          pieceAssignments: state.pieceAssignments,
        });
      }
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback((solution: ChessSolveResponse["output"]) => {
    if (solution?.coordinate) {
      setResult(solution);
      setTwitchCommand(
        generateTwitchCommand({ moduleType: ModuleType.CHESS, result: solution }),
      );
    }
  }, []);

  useSolverModulePersistence<
    {
      coordinates: string[];
      result: ChessSolveResponse["output"] | null;
      pieceAssignments?: Record<string, string>;
      twitchCommand: string;
    },
    ChessSolveResponse["output"]
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object" && typeof (raw as { coordinate?: string }).coordinate === "string") {
        return raw as ChessSolveResponse["output"];
      }
      return null;
    },
    inferSolved: (_sol, mod) => Boolean((mod as { solved?: boolean })?.solved),
    currentModule,
    setIsSolved,
  });

  const setCoord = useCallback((index: number, value: string) => {
    setCoordinates((prev) => {
      const next = [...prev];
      next[index] = value.trim().toLowerCase().slice(0, 2);
      return next;
    });
  }, []);

  const buildCoordinates = useCallback((): string[] => {
    return coordinates.map((c) => normalizeCoord(c) || "a1");
  }, [coordinates]);

  const handleSolve = async () => {
    const coords = buildCoordinates();
    const valid = coords.every((c) => c.length === 2);
    const unique = new Set(coords).size === 6;
    if (!valid) {
      setError("Each position must be a valid coordinate (letter a–f, digit 1–6), e.g. a1.");
      return;
    }
    if (!unique) {
      setError("All six coordinates must be different.");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing round, bomb, or module.");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveChess(round.id, bomb.id, currentModule.id, {
        input: { coordinates: coords },
      });
      if (response.reason) {
        setError(response.reason);
        return;
      }
      const output = response.output;
      if (!output?.coordinate) {
        setError("No solution returned.");
        return;
      }
      setResult(output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      const command = generateTwitchCommand({
        moduleType: ModuleType.CHESS,
        result: output,
      });
      setTwitchCommand(command);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        {
          coordinates,
          result: output,
          pieceAssignments: output.pieceAssignments,
          twitchCommand: command,
        },
        { coordinate: output.coordinate, pieceAssignments: output.pieceAssignments },
        true,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Solve failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setCoordinates(defaultCoordinates());
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  const canSolve =
    coordinates.every((c) => isValidCoord(c)) &&
    new Set(coordinates.map((c) => normalizeCoord(c)).filter(Boolean)).size === 6;

  return (
    <SolverLayout>
      <SolverSection
        title="Numbered positions"
        description="Enter the six coordinates in order (position 1 to 6 on the module's numbered buttons). Format is letter then digit, e.g. a1, f6."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {coordinates.map((coord, i) => (
            <div key={i} className="space-y-1">
              <label htmlFor={`chess-coord-${i}`} className="text-xs font-medium text-muted-foreground">
                Position {i + 1}
              </label>
              <Input
                id={`chess-coord-${i}`}
                type="text"
                maxLength={2}
                value={coord}
                onChange={(e) => setCoord(i, e.target.value)}
                placeholder="a1"
                className="w-full font-mono uppercase"
                disabled={isLoading || isSolved}
                aria-label={`Position ${i + 1} coordinate`}
              />
            </div>
          ))}
        </div>
      </SolverSection>

      <SolverSection
        title="Board"
        description="6×6 reference (a1 bottom-left). After solving, the chess pieces and target square are highlighted."
      >
        <div className="flex justify-center">
          <div
            className="inline-grid grid-cols-6 overflow-hidden rounded border border-border"
            style={{ width: "min(16rem, 90vw)" }}
          >
            {RANKS.slice().reverse().map((rank) =>
              FILES.map((file) => {
                const sq = file + rank;
                const isLight = (FILES.indexOf(file) + rank) % 2 === 0;
                const piece = result?.pieceAssignments?.[sq];
                const isSolution = result?.coordinate === sq;
                return (
                  <div
                    key={sq}
                    className={cn(
                      "relative flex aspect-square items-center justify-center text-[0.55rem] font-mono",
                      isLight ? "bg-muted/40" : "bg-muted",
                      isSolution && "ring-2 ring-inset ring-emerald-500",
                    )}
                    title={piece ? `${piece} on ${sq}` : isSolution ? `Solution: ${sq}` : sq}
                  >
                    {piece ? (
                      <span className="text-xl leading-none text-foreground" aria-hidden>
                        {PIECE_SYMBOLS[piece] ?? piece.charAt(0)}
                      </span>
                    ) : isSolution ? (
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{sq}</span>
                    ) : (
                      <span className="text-muted-foreground">{sq}</span>
                    )}
                  </div>
                );
              }),
            )}
          </div>
        </div>
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={!canSolve}
        isLoading={isLoading}
        isSolved={isSolved}
      />

      <ErrorAlert error={error} />

      {result?.coordinate && (
        <SolverResult
          variant="success"
          title="Submit on the module"
          description={`Letter: ${result.coordinate[0].toUpperCase()}\nNumber: ${result.coordinate[1]}`}
        />
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        The module shows six chess pieces by coordinate. Type each one in order; the solver returns
        the square to submit.
      </SolverInstructions>
    </SolverLayout>
  );
}
