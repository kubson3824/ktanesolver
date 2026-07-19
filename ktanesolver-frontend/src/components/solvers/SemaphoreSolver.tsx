import { useCallback, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import {
  solveSemaphore,
  getDisplayLabel,
  type SemaphoreOutput,
  type SemaphoreInput,
} from "../../services/semaphoreService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import SemaphoreFlagSelector, { SemaphoreCharacterFigure } from "../SemaphoreFlagSelector";
import { Button } from "../ui/button";

interface SemaphoreSolverProps {
  bomb: BombEntity | null | undefined;
}

interface FlagAngles {
  leftFlagAngle: number;
  rightFlagAngle: number;
  character?: string;
}

const enrichSequence = (sequence: FlagAngles[]) => {
  let numerals = false;
  return sequence.map((position) => {
    if (position.character) return position;
    const label = getDisplayLabel(position.leftFlagAngle, position.rightFlagAngle);
    if (label === "NUMERALS") {
      numerals = true;
      return { ...position, character: "§" };
    }
    if (label === "LETTERS") {
      numerals = false;
      return { ...position, character: "§" };
    }
    const number = label.match(/\((\d)\)/)?.[1];
    return { ...position, character: numerals && number ? number : label.charAt(0) };
  });
};

export default function SemaphoreSolver({ bomb }: SemaphoreSolverProps) {
  const [sequence, setSequence] = useState<FlagAngles[]>([]);
  const [result, setResult] = useState<SemaphoreOutput | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number | "">("");

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
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);

  const moduleState = useMemo(
    () => ({ sequence, result, currentIndex }),
    [sequence, result, currentIndex],
  );

  const onRestoreState = useCallback(
    (state: {
      sequence?: FlagAngles[];
      result?: SemaphoreOutput | null;
      currentIndex?: number | "";
      input?: { sequence?: FlagAngles[] };
    }) => {
      if (state.sequence) setSequence(enrichSequence(state.sequence));
      if (state.result !== undefined) setResult(state.result ?? null);
      if (state.currentIndex !== undefined) setCurrentIndex(state.currentIndex);
      if (state.input?.sequence) setSequence(enrichSequence(state.input.sequence));
    },
    [],
  );

  const onRestoreSolution = useCallback((restored: SemaphoreOutput) => {
    if (restored) {
      setResult(restored);
    }
  }, []);

  useSolverModulePersistence<
    { sequence: FlagAngles[]; result: SemaphoreOutput | null; currentIndex: number | "" },
    SemaphoreOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; result?: unknown; solution?: unknown };
        if (anyRaw.output && typeof anyRaw.output === "object")
          return anyRaw.output as SemaphoreOutput;
        if (anyRaw.result && typeof anyRaw.result === "object")
          return anyRaw.result as SemaphoreOutput;
        if (anyRaw.solution && typeof anyRaw.solution === "object")
          return anyRaw.solution as SemaphoreOutput;
        return raw as SemaphoreOutput;
      }
      return null;
    },
    inferSolved: (_sol, currentModule) =>
      Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const addPosition = (character: string, leftFlagAngle: number, rightFlagAngle: number) => {
    setSequence((prev) => [...prev, { leftFlagAngle, rightFlagAngle, character }]);
    setCurrentIndex("");
  };

  const removeAt = (index: number) => {
    setSequence((prev) => prev.filter((_, i) => i !== index));
    setCurrentIndex("");
  };

  const removeLastPosition = () => {
    setSequence((prev) => prev.slice(0, -1));
    setCurrentIndex("");
  };

  const clearSequence = () => {
    setSequence([]);
    setResult(null);
    setCurrentIndex("");
  };

  const solveSemaphoreModule = async () => {
    if (sequence.length === 0) {
      setError("Please enter at least one semaphore position");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const input: SemaphoreInput = { sequence };
      const response = await solveSemaphore(round.id, bomb.id, currentModule.id, input);
      setResult(response.output);

      if (response.output.resolved) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
        setCurrentIndex("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve semaphore");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    clearSequence();
    resetSolverState();
  };

  const disabled = isLoading || isSolved;
  const characters = sequence
    .map((position) => position.character)
    .filter((character): character is string => Boolean(character && character !== "§"));
  const targetIndex = result ? characters.indexOf(result.missingCharacter) : -1;
  const twitchCommand = generateTwitchCommand({
    moduleType: ModuleType.SEMAPHORE,
    result: { currentIndex, targetIndex },
  });

  return (
    <SolverLayout>
      <SolverSection
        title="Sequence"
        description="Record each flag position as it's displayed on the module."
      >
        {sequence.length === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
            No positions entered yet. Pick a position below.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {sequence.map((pos, index) => {
                const label = pos.character ?? getDisplayLabel(pos.leftFlagAngle, pos.rightFlagAngle);
                return (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 font-mono text-xs font-semibold text-foreground"
                  >
                    <span className="tabular-nums text-muted-foreground">{index + 1}.</span>
                    {label}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => removeAt(index)}
                        aria-label={`Remove position ${index + 1}`}
                        className="ml-0.5 inline-flex rounded text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {sequence.length} position{sequence.length !== 1 ? "s" : ""} in sequence
            </p>
          </>
        )}

        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={removeLastPosition}
            disabled={sequence.length === 0 || disabled}
          >
            Remove last
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearSequence}
            disabled={sequence.length === 0 || disabled}
          >
            Clear all
          </Button>
        </div>
      </SolverSection>

      <SolverSection
        title="Flag positions"
        description="Click the position matching what the module shows. Use NUMERALS / LETTERS to switch mode mid-sequence."
      >
        <SemaphoreFlagSelector onPositionSelect={addPosition} disabled={disabled} />
      </SolverSection>

      <SolverControls
        onSolve={solveSemaphoreModule}
        onReset={reset}
        isSolveDisabled={sequence.length === 0}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Press OK"
      />

      <ErrorAlert error={error} />

      {result && (
        <SolverSection
          title={result.resolved ? "Submit this flag" : "Best guess"}
          description="Select this flag position on the module."
          className={result.resolved ? "border-emerald-500/40" : "border-amber-500/40"}
        >
          <div className="mx-auto h-40 w-40">
            <SemaphoreCharacterFigure character={result.missingCharacter} />
          </div>
          {result.resolved && targetIndex >= 0 && <label className="mt-3 block text-sm font-medium">
            Character currently selected on the module
            <select
              value={currentIndex}
              onChange={(event) => {
                const index = event.target.value === "" ? "" : Number(event.target.value);
                setCurrentIndex(index);
                if (bomb?.id && currentModule?.id) {
                  updateModuleAfterSolve(
                    bomb.id,
                    currentModule.id,
                    { sequence, result, currentIndex: index },
                    result,
                    isSolved,
                  );
                }
              }}
              className="mt-2 block h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              aria-label="Current Semaphore character"
            >
              <option value="">Choose current position</option>
              {characters.map((character, index) => (
                <option key={`${character}-${index}`} value={index}>{index + 1}. {character}</option>
              ))}
            </select>
          </label>}
        </SolverSection>
      )}

      {twitchCommand && result && result.resolved && (
        <TwitchCommandDisplay command={twitchCommand} />
      )}

      <SolverInstructions>
        Enter every semaphore position shown on the module. The solver compares against the
        bomb's serial number to find the character missing from the sequence.
      </SolverInstructions>
    </SolverLayout>
  );
}
