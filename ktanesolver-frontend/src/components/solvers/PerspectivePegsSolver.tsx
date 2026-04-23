import { useCallback, useMemo, useState } from "react";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  solvePerspectivePegs,
  type PerspectivePeg,
  type PerspectivePegsInput,
  type PerspectivePegsOutput,
} from "../../services/perspectivePegsService";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";

const COLORS = ["Red", "Yellow", "Green", "Blue", "Purple"];

interface PerspectivePegsSolverProps {
  bomb: BombEntity | null | undefined;
}

const defaultPegs = (): PerspectivePeg[] =>
  Array.from({ length: 5 }, () => ({ color: "", sides: 3 }));

const defaultCandidates = (): string[][] =>
  Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => ""));

export default function PerspectivePegsSolver({ bomb }: PerspectivePegsSolverProps) {
  const [pegs, setPegs] = useState<PerspectivePeg[]>(() => defaultPegs());
  const [candidateSequences, setCandidateSequences] = useState<string[][]>(() => defaultCandidates());
  const [result, setResult] = useState<PerspectivePegsOutput | null>(null);
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

  const updateModuleAfterSolve = useRoundStore((s) => s.updateModuleAfterSolve);

  const moduleState = useMemo(
    () => ({ pegs, candidateSequences, result, twitchCommand }),
    [pegs, candidateSequences, result, twitchCommand]
  );

  const onRestoreState = useCallback((state: {
    pegs?: PerspectivePeg[];
    candidateSequences?: string[][];
    result?: PerspectivePegsOutput | null;
    twitchCommand?: string;
    input?: PerspectivePegsInput;
  }) => {
    if (state.pegs?.length === 5) setPegs(state.pegs);
    else if (state.input?.pegs?.length === 5) setPegs(state.input.pegs);
    if (state.candidateSequences?.length === 5) setCandidateSequences(state.candidateSequences);
    else if (state.input?.candidateSequences?.length === 5) setCandidateSequences(state.input.candidateSequences);
    if (state.result !== undefined) setResult(state.result);
    if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
  }, []);

  const onRestoreSolution = useCallback((solution: PerspectivePegsOutput) => {
    if (!solution?.pressPositions) return;
    setResult(solution);
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.PERSPECTIVE_PEGS, result: solution }));
  }, []);

  useSolverModulePersistence<
    typeof moduleState,
    PerspectivePegsOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null || typeof raw !== "object") return null;
      const output = raw as { pressPositions?: unknown };
      return Array.isArray(output.pressPositions) ? raw as PerspectivePegsOutput : null;
    },
    inferSolved: (_sol, mod) => Boolean((mod as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const updatePegColor = (index: number, color: string) => {
    setPegs((prev) => prev.map((peg, i) => i === index ? { ...peg, color } : peg));
    if (error) clearError();
  };

  const updatePegSides = (index: number, sides: number) => {
    setPegs((prev) => prev.map((peg, i) => i === index ? { ...peg, sides } : peg));
    if (error) clearError();
  };

  const updateCandidateColor = (viewIndex: number, colorIndex: number, color: string) => {
    setCandidateSequences((prev) => prev.map((row, r) =>
      r === viewIndex ? row.map((value, c) => c === colorIndex ? color : value) : row
    ));
    if (error) clearError();
  };

  const buildInput = useCallback((): PerspectivePegsInput => ({
    pegs,
    candidateSequences,
  }), [pegs, candidateSequences]);

  const canSolve = useMemo(() => {
    return pegs.every((peg) => COLORS.includes(peg.color) && Number(peg.sides) > 0)
      && candidateSequences.every((row) => row.length === 5 && row.every((color) => COLORS.includes(color)));
  }, [pegs, candidateSequences]);

  const solveModule = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing round, bomb, or module.");
      return;
    }
    if (!canSolve) {
      setError("Fill all peg colors, side counts, and candidate view colors.");
      return;
    }

    clearError();
    setIsLoading(true);

    try {
      const response = await solvePerspectivePegs(round.id, bomb.id, currentModule.id, { input: buildInput() });
      const output = response.output;
      setResult(output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      const command = generateTwitchCommand({ moduleType: ModuleType.PERSPECTIVE_PEGS, result: output });
      setTwitchCommand(command);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { pegs, candidateSequences, result: output, twitchCommand: command },
        output,
        true
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Perspective Pegs.");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, canSolve, clearError, setIsLoading, setError, setIsSolved, markModuleSolved, updateModuleAfterSolve, buildInput, pegs, candidateSequences]);

  const reset = useCallback(() => {
    setPegs(defaultPegs());
    setCandidateSequences(defaultCandidates());
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  const inputClass = "w-full rounded-lg bg-neutral-800 border border-neutral-600 text-neutral-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-70";
  const labelClass = "block text-sm text-neutral-400 mb-1";

  return (
    <SolverLayout>
      <div className="rounded-xl border-2 border-neutral-600 bg-neutral-700/95 shadow-lg p-5 text-neutral-100 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-neutral-300 mb-3">Clockwise pegs</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {pegs.map((peg, index) => (
              <div key={index} className="space-y-2">
                <span className={labelClass}>Peg {index + 1}</span>
                <select
                  value={peg.color}
                  onChange={(e) => updatePegColor(index, e.target.value)}
                  disabled={isLoading || isSolved}
                  className={inputClass}
                >
                  <option value="">Color</option>
                  {COLORS.map((color) => <option key={color} value={color}>{color}</option>)}
                </select>
                <input
                  type="number"
                  min={1}
                  value={peg.sides || ""}
                  onChange={(e) => updatePegSides(index, Number(e.target.value) || 0)}
                  disabled={isLoading || isSolved}
                  className={inputClass}
                  aria-label={`Peg ${index + 1} sides`}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-neutral-300 mb-3">Candidate views</h3>
          <div className="space-y-3">
            {candidateSequences.map((row, viewIndex) => (
              <div key={viewIndex} className="grid grid-cols-1 sm:grid-cols-[96px_1fr] gap-2 items-center">
                <span className="text-sm text-neutral-400">View {viewIndex + 1}</span>
                <div className="grid grid-cols-5 gap-2">
                  {row.map((color, colorIndex) => (
                    <select
                      key={colorIndex}
                      value={color}
                      onChange={(e) => updateCandidateColor(viewIndex, colorIndex, e.target.value)}
                      disabled={isLoading || isSolved}
                      className={inputClass}
                      aria-label={`View ${viewIndex + 1} color ${colorIndex + 1}`}
                    >
                      <option value="">-</option>
                      {COLORS.map((option) => <option key={option} value={option}>{option[0]}</option>)}
                    </select>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <ErrorAlert error={error ?? ""} />

        {result && (
          <div className="rounded-lg bg-neutral-800/80 p-4 space-y-2">
            <p className="text-sm text-neutral-300">Key color: <strong className="text-amber-300">{result.keyColor}</strong></p>
            <p className="text-sm text-neutral-300">Current sequence: <strong className="text-amber-300">{result.currentSequence.join(" ")}</strong></p>
            <p className="text-sm text-neutral-300">Key sequence: <strong className="text-amber-300">{result.keySequence.join(" ")}</strong></p>
            <p className="font-medium text-amber-300">
              View {result.viewNumber}: press positions {result.pressPositions.join(", ")} ({result.direction.toLowerCase()})
            </p>
          </div>
        )}

        <SolverControls
          onSolve={solveModule}
          onReset={reset}
          isSolveDisabled={!canSolve}
          isLoading={isLoading}
          isSolved={isSolved}
        />
        <TwitchCommandDisplay command={twitchCommand} />
      </div>
    </SolverLayout>
  );
}
