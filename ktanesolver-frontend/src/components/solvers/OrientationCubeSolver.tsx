import { useState, useEffect } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveOrientationCube as solveOrientationCubeApi } from "../../services/orientationCubeService";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { 
  useSolver,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  BombInfoDisplay,
  SolverControls
} from "../common";

type OrientationCubeFace = "LEFT" | "RIGHT" | "FRONT" | "BACK" | null;
type OrientationCubeRotation = "ROTATE_LEFT" | "ROTATE_RIGHT" | "ROTATE_CLOCKWISE" | "ROTATE_COUNTERCLOCKWISE";

interface OrientationCubeSolverProps {
  bomb: BombEntity | null | undefined;
}

const FACES: { face: OrientationCubeFace; display: string; className: string }[] = [
  { face: "FRONT", display: "Front", className: "bg-blue-500" },
  { face: "BACK", display: "Back", className: "bg-green-500" },
  { face: "LEFT", display: "Left", className: "bg-red-500" },
  { face: "RIGHT", display: "Right", className: "bg-yellow-500" },
  { face: null, display: "Empty", className: "bg-gray-700" },
];

const ROTATION_DISPLAY: Record<OrientationCubeRotation, string> = {
  ROTATE_LEFT: "← Left",
  ROTATE_RIGHT: "→ Right",
  ROTATE_CLOCKWISE: "↻ CW",
  ROTATE_COUNTERCLOCKWISE: "↺ CCW",
};

const ROTATION_COLORS: Record<OrientationCubeRotation, string> = {
  ROTATE_LEFT: "text-orange-400",
  ROTATE_RIGHT: "text-cyan-400",
  ROTATE_CLOCKWISE: "text-green-400",
  ROTATE_COUNTERCLOCKWISE: "text-purple-400",
};

export default function OrientationCubeSolver({ bomb }: OrientationCubeSolverProps) {
  const [initialFace, setInitialFace] = useState<OrientationCubeFace>(null);
  const [updatedFace, setUpdatedFace] = useState<OrientationCubeFace>(null);
  const [result, setResult] = useState<OrientationCubeRotation[]>([]);
  const [needsUpdatedFace, setNeedsUpdatedFace] = useState(false);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  // Use the common solver hook for shared state
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
    moduleNumber
  } = useSolver();

  // Restore state from module when component loads
  useEffect(() => {
    if (currentModule?.state && typeof currentModule.state === 'object') {
      const moduleState = currentModule.state as { 
        initialFace?: OrientationCubeFace;
        updatedFace?: OrientationCubeFace;
        needsUpdatedFace?: boolean;
      };
      
      if (moduleState.initialFace !== undefined) setInitialFace(moduleState.initialFace);
      if (moduleState.updatedFace !== undefined) setUpdatedFace(moduleState.updatedFace);
      if (moduleState.needsUpdatedFace !== undefined) setNeedsUpdatedFace(moduleState.needsUpdatedFace);
    }

    // Restore solution if module was solved
    if (currentModule?.solution && typeof currentModule.solution === 'object') {
      const solution = currentModule.solution as { rotations: OrientationCubeRotation[]; needsUpdatedFace: boolean };
      
      if (solution.rotations) {
        setResult(solution.rotations);
        setNeedsUpdatedFace(solution.needsUpdatedFace);
        
        // Only mark as solved if we don't need updated face
        if (!solution.needsUpdatedFace) {
          setIsSolved(true);

          // Generate twitch command from the solution
          const command = generateTwitchCommand({
            moduleType: ModuleType.ORIENTATION_CUBE,
            result: solution,
            moduleNumber
          });
          setTwitchCommand(command);
        }
      }
    }
  }, [currentModule, moduleNumber, setIsSolved]);

  // Save state when inputs change
  const saveState = () => {
    if (currentModule) {
      const moduleState = { initialFace, updatedFace, needsUpdatedFace };
      // Update the module in the store
      const { round } = useRoundStore.getState();
      round?.bombs.forEach(bomb => {
        if (bomb.id === currentModule.bomb.id) {
          const module = bomb.modules.find(m => m.id === currentModule.id);
          if (module) {
            module.state = moduleState;
          }
        }
      });
    }
  };

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
          updatedFace: needsUpdatedFace ? updatedFace : undefined
        }
      });

      setResult(response.output.rotations);
      setNeedsUpdatedFace(response.output.needsUpdatedFace);

      // Only mark as solved and generate commands if we don't need updated face
      if (!response.output.needsUpdatedFace) {
        // Generate Twitch command
        const command = generateTwitchCommand({
          moduleType: ModuleType.ORIENTATION_CUBE,
          result: response.output,
          moduleNumber
        });
        setTwitchCommand(command);
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve orientation cube");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialFaceClick = () => {
    const currentIndex = FACES.findIndex((f) => f.face === initialFace);
    const nextIndex = (currentIndex + 1) % FACES.length;
    setInitialFace(FACES[nextIndex].face);
    saveState();
    reset();
  };

  const handleUpdatedFaceClick = () => {
    const currentIndex = FACES.findIndex((f) => f.face === updatedFace);
    const nextIndex = (currentIndex + 1) % FACES.length;
    setUpdatedFace(FACES[nextIndex].face);
    saveState();
  };

  const reset = () => {
    setResult([]);
    setNeedsUpdatedFace(false);
    setUpdatedFace(null);
    setTwitchCommand("");
    saveState();
  };

  const fullReset = () => {
    setInitialFace(null);
    setUpdatedFace(null);
    reset();
    resetSolverState();
  };

  const currentFaceClass = FACES.find((f) => f.face === initialFace)?.className || "bg-gray-700";

  // Check if we need to show the updated face based on backend response
  const showUpdatedFace = needsUpdatedFace && !isSolved;

  return (
    <SolverLayout>
      {/* Cube visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <div className="space-y-4">
          {/* Initial face selector */}
          <div>
            <p className="text-center text-gray-400 mb-3">Initial Face:</p>
            <div className="flex justify-center">
              <button
                onClick={handleInitialFaceClick}
                className={`w-32 h-32 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 ${currentFaceClass} ${
                  isSolved ? "ring-4 ring-green-400 ring-opacity-75" : "hover:opacity-90"
                }`}
                title="Click to change face"
              >
                <span className="text-white font-bold text-lg">
                  {FACES.find((f) => f.face === initialFace)?.display || "?"}
                </span>
              </button>
            </div>
          </div>

          {/* Updated face selector - shown conditionally */}
          {showUpdatedFace && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-center text-gray-400 mb-3">Updated Face:</p>
              <div className="flex justify-center">
                <button
                  onClick={handleUpdatedFaceClick}
                  className={`w-24 h-24 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 ${
                    FACES.find((f) => f.face === updatedFace)?.className || "bg-gray-700"
                  } ${updatedFace ? "shadow-lg" : ""}`}
                  title="Click to change face"
                >
                  <span className="text-white font-bold">
                    {FACES.find((f) => f.face === updatedFace)?.display || "?"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bomb info display */}
      <BombInfoDisplay bomb={bomb} />

      {/* Controls */}
      <SolverControls
        onSolve={handleSolve}
        onReset={fullReset}
        isSolveDisabled={!initialFace || (showUpdatedFace && !updatedFace)}
        isLoading={isLoading}
        solveText={showUpdatedFace ? "Solve" : "Check"}
      />

      {/* Error display */}
      <ErrorAlert error={error} />

      {/* Result - only show when fully solved */}
      {result.length > 0 && isSolved && (
        <div className="alert alert-success mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <span className="font-bold mb-2 block">Rotation Sequence:</span>
            <div className="flex flex-wrap gap-2">
              {result.map((rotation, index) => (
                <span
                  key={index}
                  className={`text-lg font-mono font-bold ${ROTATION_COLORS[rotation]}`}
                >
                  {ROTATION_DISPLAY[rotation]}
                  {index < result.length - 1 && <span className="text-gray-400 mx-1">→</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Twitch command display */}
      <TwitchCommandDisplay command={twitchCommand} />

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Click the face to cycle through: Front → Back → Left → Right</p>
        {showUpdatedFace && (
          <p className="text-warning">Please select the updated face.</p>
        )}
      </div>
    </SolverLayout>
  );
}
