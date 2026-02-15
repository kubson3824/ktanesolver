import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { solveListening, type ListeningInput, type ListeningOutput } from "../../services/listeningService";
import { 
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverControls
} from "../common";

interface ListeningSolverProps {
  bomb: BombEntity | null | undefined;
}

const SOUND_OPTIONS = [
  "Taxi Dispatch", "Dial-up Internet", "Cow", "Police Radio Scanner", "Extractor Fan",
  "Censorship Bleep", "Train Station", "Medieval Weapons", "Arcade", "Door Closing",
  "Casino", "Chainsaw", "Supermarket", "Compressed Air", "Soccer Match",
  "Servo Motor", "Tawny Owl", "Waterfall", "Sewing Machine", "Tearing Fabric",
  "Thrush Nightingale", "Zipper", "Car Engine", "Vacuum Cleaner", "Reloading Glock 19",
  "Ballpoint Pen Writing", "Oboe", "Rattling Iron Chain", "Saxophone", "Book Page Turning",
  "Tuba", "Table Tennis", "Marimba", "Squeaky Toy", "Phone Ringing",
  "Helicopter", "Tibetan Nuns", "Firework Exploding", "Throat Singing", "Glass Shattering",
  "Beach"
];

export default function ListeningSolver({ bomb }: ListeningSolverProps) {
  const [selectedSound, setSelectedSound] = useState<string>("");
  const [result, setResult] = useState<ListeningOutput | null>(null);
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
  } = useSolver();

  const moduleState = useMemo(
    () => ({ selectedSound, result, twitchCommand }),
    [selectedSound, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: { selectedSound?: string; result?: ListeningOutput | null; twitchCommand?: string }) => {
      if (state.selectedSound !== undefined) setSelectedSound(state.selectedSound);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (solution: ListeningOutput) => {
      if (!solution?.code) return;
      setResult(solution);

      const command = generateTwitchCommand({
        moduleType: ModuleType.LISTENING,
        result: { code: solution.code },
      });
      setTwitchCommand(command);
    },
  []);

  useSolverModulePersistence<
    { selectedSound: string; result: ListeningOutput | null; twitchCommand: string },
    ListeningOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; code?: unknown };
        if (anyRaw.output && typeof anyRaw.output === "object") return anyRaw.output as ListeningOutput;
        if (typeof anyRaw.code === "string") return raw as ListeningOutput;
        return raw as ListeningOutput;
      }
      return null;
    },
    inferSolved: (_sol, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solveListeningModule = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    if (!selectedSound) {
      setError("Please select a sound");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const input: ListeningInput = {
        soundDescription: selectedSound,
      };
      
      const response = await solveListening(round.id, bomb.id, currentModule.id, {
        input
      });
      
      setResult(response.output);
      
      if (response.output.code) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
        
        const command = generateTwitchCommand({
          moduleType: ModuleType.LISTENING,
          result: response.output,
        });
        setTwitchCommand(command);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Listening");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setSelectedSound("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  return (
    <SolverLayout>
      {/* Listening Module Interface */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">LISTENING MODULE</h3>
        
        {/* Sound Selection */}
        <div className="mb-4">
          <p className="text-sm text-gray-400 mb-2">Play the sound on the module, then select it below.</p>
          <select
            value={selectedSound}
            onChange={(e) => setSelectedSound(e.target.value)}
            className="select select-bordered w-full"
            disabled={isLoading || isSolved}
          >
            <option value="">Select a sound...</option>
            {SOUND_OPTIONS.map((sound) => (
              <option key={sound} value={sound}>{sound}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Controls */}
      <SolverControls
        onSolve={solveListeningModule}
        onReset={reset}
        isSolveDisabled={!selectedSound}
        isLoading={isLoading}
        solveText="Get Code"
      />

      {/* Error display */}
      <ErrorAlert error={error} />

      {/* Results */}
      {result && (
        <div className={`alert mb-4 ${result.code ? 'alert-success' : 'alert-info'}`}>
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
              d={result.code 
                ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                : "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              }
            />
          </svg>
          <div className="w-full">
            <span className="font-bold">{result.code ? "Code Found!" : "Sound not found"}</span>
            {result.code && (
              <div className="mt-4">
                <div className="font-semibold mb-2">Enter this code:</div>
                <div className="flex justify-center gap-2">
                  {result.code.split('').map((symbol, index) => (
                    <div key={index} className="w-12 h-12 bg-gray-900 border-2 border-green-500 rounded flex items-center justify-center text-2xl font-mono text-green-400">
                      {symbol}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Twitch command display */}
      <TwitchCommandDisplay command={twitchCommand} />

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Play the sound on the module, then select it from the list above.</p>
        <p>• The solver will provide the code to enter</p>
        <p>• Enter the code using the $ * & # buttons on the module</p>
        <p>• Pressing play on the module clears any previously entered code</p>
      </div>
    </SolverLayout>
  );
}
