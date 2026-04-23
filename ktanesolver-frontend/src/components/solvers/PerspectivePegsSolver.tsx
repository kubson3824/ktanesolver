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
  SolverSection,
  SolverInstructions,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverResult,
  ColorSwatchPicker,
  type ColorSwatchOption,
} from "../common";
import { Input } from "../ui/input";

interface PerspectivePegsSolverProps {
  bomb: BombEntity | null | undefined;
}

type PegColor = "Red" | "Yellow" | "Green" | "Blue" | "Purple";

const COLOR_OPTIONS: ReadonlyArray<ColorSwatchOption<PegColor>> = [
  { value: "Red", label: "Red", swatch: "bg-red-500" },
  { value: "Yellow", label: "Yellow", swatch: "bg-yellow-400" },
  { value: "Green", label: "Green", swatch: "bg-green-500" },
  { value: "Blue", label: "Blue", swatch: "bg-blue-500" },
  { value: "Purple", label: "Purple", swatch: "bg-purple-500" },
];

const COLOR_VALUES = COLOR_OPTIONS.map((option) => option.value);

const defaultPegs = (): PerspectivePeg[] =>
  Array.from({ length: 5 }, () => ({ color: "", sides: 3 }));

const defaultCandidates = (): string[][] =>
  Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => ""));

function isPegColor(value: string): value is PegColor {
  return COLOR_VALUES.includes(value as PegColor);
}

function normalizePegs(value: PerspectivePeg[] | undefined): PerspectivePeg[] | null {
  if (!Array.isArray(value) || value.length !== 5) return null;
  return value.map((peg) => ({
    color: typeof peg.color === "string" ? peg.color : "",
    sides: Number(peg.sides) || 0,
  }));
}

function normalizeCandidates(value: string[][] | undefined): string[][] | null {
  if (!Array.isArray(value) || value.length !== 5) return null;
  if (!value.every((row) => Array.isArray(row) && row.length === 5)) return null;
  return value.map((row) => row.map((color) => typeof color === "string" ? color : ""));
}

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
    [pegs, candidateSequences, result, twitchCommand],
  );

  const onRestoreState = useCallback((state: {
    pegs?: PerspectivePeg[];
    candidateSequences?: string[][];
    result?: PerspectivePegsOutput | null;
    twitchCommand?: string;
    input?: PerspectivePegsInput;
  }) => {
    const restoredPegs = normalizePegs(state.pegs) ?? normalizePegs(state.input?.pegs);
    const restoredCandidates = normalizeCandidates(state.candidateSequences)
      ?? normalizeCandidates(state.input?.candidateSequences);
    if (restoredPegs) setPegs(restoredPegs);
    if (restoredCandidates) setCandidateSequences(restoredCandidates);
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
      const candidate = raw as { output?: unknown; pressPositions?: unknown };
      const output = candidate.output && typeof candidate.output === "object"
        ? candidate.output as PerspectivePegsOutput
        : candidate as PerspectivePegsOutput;
      return Array.isArray(output.pressPositions) ? output : null;
    },
    inferSolved: (_sol, mod) => Boolean((mod as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const clearStaleSolution = useCallback(() => {
    setResult(null);
    setTwitchCommand("");
    clearError();
  }, [clearError]);

  const updatePegColor = (index: number, color: PegColor | null) => {
    setPegs((prev) => prev.map((peg, i) => i === index ? { ...peg, color: color ?? "" } : peg));
    clearStaleSolution();
  };

  const updatePegSides = (index: number, sides: number) => {
    setPegs((prev) => prev.map((peg, i) => i === index ? { ...peg, sides } : peg));
    clearStaleSolution();
  };

  const updateCandidateColor = (viewIndex: number, colorIndex: number, color: PegColor | null) => {
    setCandidateSequences((prev) => prev.map((row, r) =>
      r === viewIndex ? row.map((value, c) => c === colorIndex ? color ?? "" : value) : row
    ));
    clearStaleSolution();
  };

  const buildInput = useCallback((): PerspectivePegsInput => ({
    pegs,
    candidateSequences,
  }), [pegs, candidateSequences]);

  const canSolve = useMemo(() => {
    return pegs.every((peg) => isPegColor(peg.color) && Number(peg.sides) > 0)
      && candidateSequences.every((row) => row.length === 5 && row.every(isPegColor));
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
      const command = generateTwitchCommand({ moduleType: ModuleType.PERSPECTIVE_PEGS, result: output });

      setResult(output);
      setTwitchCommand(command);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { pegs, candidateSequences, result: output, twitchCommand: command },
        output,
        true,
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

  return (
    <SolverLayout>
      <SolverSection
        title="Clockwise pegs"
        description="Enter each peg's outer facing color and number of sides, starting anywhere and moving clockwise."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          {pegs.map((peg, index) => (
            <div key={index} className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
              <p className="text-xs font-medium text-muted-foreground">Peg {index + 1}</p>
              <ColorSwatchPicker
                value={isPegColor(peg.color) ? peg.color : null}
                options={COLOR_OPTIONS}
                onChange={(color) => updatePegColor(index, color)}
                disabled={isLoading || isSolved}
                size="sm"
                ariaLabel={`Peg ${index + 1} color`}
              />
              <Input
                type="number"
                min={1}
                value={peg.sides || ""}
                onChange={(event) => updatePegSides(index, Number(event.target.value) || 0)}
                disabled={isLoading || isSolved}
                aria-label={`Peg ${index + 1} sides`}
                className="h-8"
              />
            </div>
          ))}
        </div>
      </SolverSection>

      <SolverSection
        title="Candidate views"
        description="For each perspective, enter the five colors facing you from left to right."
      >
        <div className="space-y-3">
          {candidateSequences.map((row, viewIndex) => (
            <div key={viewIndex} className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
              <p className="text-xs font-medium text-muted-foreground">View {viewIndex + 1}</p>
              <div className="grid grid-cols-5 gap-2">
                {row.map((color, colorIndex) => (
                  <ColorSwatchPicker
                    key={colorIndex}
                    value={isPegColor(color) ? color : null}
                    options={COLOR_OPTIONS}
                    onChange={(nextColor) => updateCandidateColor(viewIndex, colorIndex, nextColor)}
                    disabled={isLoading || isSolved}
                    clearable={false}
                    size="sm"
                    ariaLabel={`View ${viewIndex + 1} color ${colorIndex + 1}`}
                    className="justify-center"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </SolverSection>

      <SolverControls
        onSolve={solveModule}
        onReset={reset}
        isSolveDisabled={!canSolve || isSolved}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Solve"
      />

      <ErrorAlert error={error} />

      {result && (
        <SolverResult
          variant="success"
          title="Press sequence"
          description={`View: ${result.viewNumber}
Positions: ${result.pressPositions.join(", ")} (${result.direction.toLowerCase()})
Key color: ${result.keyColor}
Current sequence: ${result.currentSequence.join(" ")}
Key sequence: ${result.keySequence.join(" ")}`}
        />
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        First find the key color from the serial number, then the solver applies the battery-column permutations and locates the resulting three-color sequence in one candidate view.
      </SolverInstructions>
    </SolverLayout>
  );
}
