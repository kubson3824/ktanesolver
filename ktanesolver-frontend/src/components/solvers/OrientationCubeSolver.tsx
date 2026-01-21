import { useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveOrientationCube as solveOrientationCubeApi } from "../../services/orientationCubeService";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import ModuleNumberInput from "../ModuleNumberInput";

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
  const [isSolved, setIsSolved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

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
    setError("");

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
    reset();
  };

  const handleUpdatedFaceClick = () => {
    const currentIndex = FACES.findIndex((f) => f.face === updatedFace);
    const nextIndex = (currentIndex + 1) % FACES.length;
    setUpdatedFace(FACES[nextIndex].face);
  };

  const reset = () => {
    setResult([]);
    setIsSolved(false);
    setNeedsUpdatedFace(false);
    setError("");
    setUpdatedFace(null);
    setTwitchCommand("");
  };

  const fullReset = () => {
    setInitialFace(null);
    setUpdatedFace(null);
    reset();
  };

  const currentFaceClass = FACES.find((f) => f.face === initialFace)?.className || "bg-gray-700";

  // Check if we need to show the updated face based on backend response
  const showUpdatedFace = needsUpdatedFace && !isSolved;

  return (
    <div className="w-full">
      <ModuleNumberInput />
      
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
      <div className="bg-base-200 rounded p-3 mb-4">
        <p className="text-sm text-base-content/70">
          Serial Number: <span className="font-mono font-bold">{bomb?.serialNumber || "Unknown"}</span>
        </p>
        <p className="text-sm text-base-content/70">
          Batteries: <span className="font-mono font-bold">{(bomb?.aaBatteryCount ?? 0) + (bomb?.dBatteryCount ?? 0)}</span>
        </p>
        <p className="text-sm text-base-content/70">
          Strikes: <span className="font-mono font-bold">{bomb?.strikes ?? 0}</span>
        </p>
        <p className="text-sm text-base-content/70">
          Indicators: <span className="font-mono font-bold">{bomb?.indicators ? Object.entries(bomb.indicators).filter(([, value]) => value).map(([key]) => key).join(", ") || "None" : "None"}</span>
        </p>
        <p className="text-sm text-base-content/70">
          Ports: <span className="font-mono font-bold">{bomb?.portPlates?.flatMap(plate => plate.ports).join(", ") || "None"}</span>
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-4">
        {!showUpdatedFace ? (
          <button
            onClick={handleSolve}
            className="btn btn-primary flex-1"
            disabled={!initialFace || isLoading}
          >
            {isLoading ? <span className="loading loading-spinner loading-sm"></span> : ""}
            {isLoading ? "Checking..." : "Check"}
          </button>
        ) : (
          <button
            onClick={handleSolve}
            className="btn btn-primary flex-1"
            disabled={!updatedFace || isLoading}
          >
            {isLoading ? <span className="loading loading-spinner loading-sm"></span> : ""}
            {isLoading ? "Solving..." : "Solve"}
          </button>
        )}
        <button onClick={fullReset} className="btn btn-outline" disabled={isLoading}>
          Reset
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error mb-4">
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
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

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

      {/* Twitch Command - only show when fully solved */}
      {twitchCommand && isSolved && (
        <div className="bg-purple-900/20 border border-purple-500 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-purple-400 mb-1">Twitch Chat Command:</h4>
              <code className="text-lg font-mono text-purple-200">{twitchCommand}</code>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(twitchCommand);
              }}
              className="btn btn-sm btn-outline btn-purple"
              title="Copy to clipboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Click the face to cycle through: Front → Back → Left → Right</p>
        {showUpdatedFace && (
          <p className="text-warning">Please select the updated face.</p>
        )}
      </div>
    </div>
  );
}
