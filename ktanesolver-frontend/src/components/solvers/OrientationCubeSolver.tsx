import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveOrientationCube as solveOrientationCubeApi } from "../../services/orientationCubeService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { useRoundStore } from "../../store/useRoundStore";
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
import { cn } from "../../lib/cn";

type OrientationCubeFace = "LEFT" | "RIGHT" | "FRONT" | "BACK" | null;
type OrientationCubeRotation = "ROTATE_LEFT" | "ROTATE_RIGHT" | "ROTATE_CLOCKWISE" | "ROTATE_COUNTERCLOCKWISE";

interface OrientationCubeSolverProps {
  bomb: BombEntity | null | undefined;
}

interface FaceSpec {
  face: OrientationCubeFace;
  display: string;
  /** Solid color backdrop when this face is picked. */
  swatch: string;
  /** Text colour readable on the swatch. */
  text: string;
}

const FACES: readonly FaceSpec[] = [
  { face: "FRONT", display: "Front", swatch: "bg-blue-500", text: "text-white" },
  { face: "BACK", display: "Back", swatch: "bg-green-500", text: "text-white" },
  { face: "LEFT", display: "Left", swatch: "bg-red-500", text: "text-white" },
  { face: "RIGHT", display: "Right", swatch: "bg-yellow-400", text: "text-yellow-950" },
  { face: null, display: "Empty", swatch: "bg-muted", text: "text-muted-foreground" },
];

const ROTATION_DISPLAY: Record<OrientationCubeRotation, string> = {
  ROTATE_LEFT: "← Left",
  ROTATE_RIGHT: "→ Right",
  ROTATE_CLOCKWISE: "↻ CW",
  ROTATE_COUNTERCLOCKWISE: "↺ CCW",
};

const ROTATION_ACCENT: Record<OrientationCubeRotation, string> = {
  ROTATE_LEFT: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  ROTATE_RIGHT: "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  ROTATE_CLOCKWISE: "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  ROTATE_COUNTERCLOCKWISE: "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
};

function faceSpec(face: OrientationCubeFace): FaceSpec {
  return FACES.find((f) => f.face === face) ?? FACES[FACES.length - 1];
}

export default function OrientationCubeSolver({ bomb }: OrientationCubeSolverProps) {
  const [initialFace, setInitialFace] = useState<OrientationCubeFace>(null);
  const [updatedFace, setUpdatedFace] = useState<OrientationCubeFace>(null);
  const [result, setResult] = useState<OrientationCubeRotation[]>([]);
  const [needsUpdatedFace, setNeedsUpdatedFace] = useState(false);
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
    () => ({ initialFace, updatedFace, needsUpdatedFace, result, twitchCommand }),
    [initialFace, updatedFace, needsUpdatedFace, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      initialFace?: OrientationCubeFace;
      updatedFace?: OrientationCubeFace;
      needsUpdatedFace?: boolean;
      result?: OrientationCubeRotation[];
      twitchCommand?: string;
    }) => {
      if (state.initialFace !== undefined) setInitialFace(state.initialFace);
      if (state.updatedFace !== undefined) setUpdatedFace(state.updatedFace);
      if (state.needsUpdatedFace !== undefined) setNeedsUpdatedFace(state.needsUpdatedFace);
      if (state.result && Array.isArray(state.result)) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (solution: { rotations: OrientationCubeRotation[]; needsUpdatedFace: boolean }) => {
      if (!solution?.rotations) return;
      setResult(solution.rotations);
      setNeedsUpdatedFace(solution.needsUpdatedFace);

      if (!solution.needsUpdatedFace) {
        const command = generateTwitchCommand({
          moduleType: ModuleType.ORIENTATION_CUBE,
          result: solution,
        });
        setTwitchCommand(command);
      }
    },
    [],
  );

  useSolverModulePersistence<
    { initialFace: OrientationCubeFace; updatedFace: OrientationCubeFace; needsUpdatedFace: boolean; result: OrientationCubeRotation[]; twitchCommand: string },
    { rotations: OrientationCubeRotation[]; needsUpdatedFace: boolean }
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; rotations?: unknown; needsUpdatedFace?: unknown };
        if (anyRaw.output && typeof anyRaw.output === "object") return anyRaw.output as { rotations: OrientationCubeRotation[]; needsUpdatedFace: boolean };
        if (Array.isArray(anyRaw.rotations) && typeof anyRaw.needsUpdatedFace === "boolean") {
          return { rotations: anyRaw.rotations as OrientationCubeRotation[], needsUpdatedFace: anyRaw.needsUpdatedFace };
        }
        return raw as { rotations: OrientationCubeRotation[]; needsUpdatedFace: boolean };
      }
      return null;
    },
    inferSolved: (_sol, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const showUpdatedFace = needsUpdatedFace && !isSolved;

  const handleSolve = async () => {
    if (!initialFace) {
      setError("Please select the initial face");
      return;
    }

    if (showUpdatedFace && !updatedFace) {
      setError("Please select the updated face");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveOrientationCubeApi(round.id, bomb.id, currentModule.id, {
        input: {
          initialFace,
          updatedFace: needsUpdatedFace ? updatedFace : undefined,
        },
      });

      setResult(response.output.rotations);
      setNeedsUpdatedFace(response.output.needsUpdatedFace);

      if (response.output.needsUpdatedFace) {
        setTwitchCommand("");
      } else {
        const command = generateTwitchCommand({
          moduleType: ModuleType.ORIENTATION_CUBE,
          result: response.output,
        });
        setTwitchCommand(command);
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
        updateModuleAfterSolve(
          bomb.id,
          currentModule.id,
          {
            initialFace,
            updatedFace: updatedFace ?? undefined,
            needsUpdatedFace: response.output.needsUpdatedFace,
            result: response.output.rotations,
            twitchCommand: command,
          },
          {
            rotations: response.output.rotations,
            needsUpdatedFace: response.output.needsUpdatedFace,
          },
          true,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Orientation Cube");
    } finally {
      setIsLoading(false);
    }
  };

  const softReset = () => {
    setResult([]);
    setNeedsUpdatedFace(false);
    setUpdatedFace(null);
    setTwitchCommand("");
  };

  const pickInitialFace = (f: OrientationCubeFace) => {
    setInitialFace(f);
    softReset();
  };

  const fullReset = () => {
    setInitialFace(null);
    setUpdatedFace(null);
    softReset();
    resetSolverState();
  };

  const FacePicker = ({
    value,
    onChange,
    disabled,
    ariaLabel,
  }: {
    value: OrientationCubeFace;
    onChange: (f: OrientationCubeFace) => void;
    disabled?: boolean;
    ariaLabel: string;
  }) => (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {FACES.filter((f) => f.face !== null).map((f) => {
        const selected = value === f.face;
        return (
          <button
            key={f.face}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(f.face)}
            className={cn(
              "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
              selected
                ? "border-ring bg-accent/15 text-foreground ring-2 ring-ring ring-offset-1 ring-offset-card"
                : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <span className={cn("h-4 w-4 rounded", f.swatch)} aria-hidden />
            {f.display}
          </button>
        );
      })}
    </div>
  );

  const initialSpec = faceSpec(initialFace);
  const updatedSpec = faceSpec(updatedFace);

  return (
    <SolverLayout>
      <SolverSection
        title="Initial face"
        description="Which face of the cube is currently pointing toward you?"
      >
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div
            className={cn(
              "flex h-28 w-28 items-center justify-center rounded-xl border border-border shadow-sm",
              initialSpec.swatch,
              initialSpec.text,
            )}
            aria-hidden
          >
            <span className="text-lg font-bold">{initialFace ? initialSpec.display : "?"}</span>
          </div>
          <FacePicker
            value={initialFace}
            onChange={pickInitialFace}
            disabled={isSolved}
            ariaLabel="Initial face"
          />
        </div>
      </SolverSection>

      {showUpdatedFace && (
        <SolverSection
          title="Updated face"
          description="After the first check, the module asks which face is now in front."
        >
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-6">
            <div
              className={cn(
                "flex h-24 w-24 items-center justify-center rounded-xl border border-border shadow-sm",
                updatedSpec.swatch,
                updatedSpec.text,
              )}
              aria-hidden
            >
              <span className="text-base font-bold">{updatedFace ? updatedSpec.display : "?"}</span>
            </div>
            <FacePicker
              value={updatedFace}
              onChange={setUpdatedFace}
              disabled={isSolved}
              ariaLabel="Updated face"
            />
          </div>
        </SolverSection>
      )}

      <SolverControls
        onSolve={handleSolve}
        onReset={fullReset}
        isSolveDisabled={!initialFace || (showUpdatedFace && !updatedFace)}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText={showUpdatedFace ? "Solve" : "Check"}
      />

      <ErrorAlert error={error} />

      {result.length > 0 && isSolved && (
        <>
          <SolverResult
            variant="success"
            title="Rotation sequence"
            description={`Initial face: ${initialSpec.display}\nSteps: ${result.length}`}
          />

          <SolverSection
            title="Perform in order"
            description="Apply each rotation to the cube in the order listed."
          >
            <ol className="flex flex-col gap-2">
              {result.map((rotation, index) => (
                <li
                  key={index}
                  className={cn(
                    "inline-flex items-center gap-3 rounded-md border px-3 py-1.5 text-sm font-semibold",
                    ROTATION_ACCENT[rotation],
                  )}
                >
                  <span className="w-6 text-right font-mono text-xs text-muted-foreground">
                    {index + 1}.
                  </span>
                  <span className="font-mono">{ROTATION_DISPLAY[rotation]}</span>
                </li>
              ))}
            </ol>
          </SolverSection>
        </>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        Pick the front face, press Check. If the module asks for an update, pick the new face and
        Solve to get the full rotation sequence.
      </SolverInstructions>
    </SolverLayout>
  );
}
