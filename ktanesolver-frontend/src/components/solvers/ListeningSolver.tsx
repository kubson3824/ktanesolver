import { useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { solveListening, type ListeningInput, type ListeningOutput } from "../../services/listeningService";
import ModuleNumberInput from "../ModuleNumberInput";

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
  const [customSound, setCustomSound] = useState<string>("");
  const [useCustom, setUseCustom] = useState<boolean>(false);
  const [result, setResult] = useState<ListeningOutput | null>(null);
  const [isSolved, setIsSolved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

  const solveListeningModule = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    const soundDescription = useCustom ? customSound.trim() : selectedSound;
    
    if (!soundDescription) {
      setError("Please select or enter a sound description");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const input: ListeningInput = {
        soundDescription: soundDescription
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
          result: { code: response.output.code },
          moduleNumber
        });
        setTwitchCommand(command);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve listening module");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setSelectedSound("");
    setCustomSound("");
    setUseCustom(false);
    setResult(null);
    setIsSolved(false);
    setError("");
    setTwitchCommand("");
  };

  const currentSound = useCustom ? customSound : selectedSound;

  return (
    <div className="w-full">
      <ModuleNumberInput />
      
      {/* Listening Module Interface */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">LISTENING MODULE</h3>
        
        {/* Sound Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={!useCustom}
                onChange={() => setUseCustom(false)}
                className="radio radio-sm"
                disabled={isLoading || isSolved}
              />
              <span className="text-sm">Select from list</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={useCustom}
                onChange={() => setUseCustom(true)}
                className="radio radio-sm"
                disabled={isLoading || isSolved}
              />
              <span className="text-sm">Enter custom sound</span>
            </label>
          </div>

          {!useCustom ? (
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
          ) : (
            <input
              type="text"
              value={customSound}
              onChange={(e) => setCustomSound(e.target.value)}
              placeholder="Enter sound description..."
              className="input input-bordered w-full"
              disabled={isLoading || isSolved}
            />
          )}
        </div>

        {/* Play Button Visualization */}
        <div className="bg-black rounded-lg p-8 mb-6 flex justify-center">
          <button
            className="btn btn-circle btn-lg bg-green-600 hover:bg-green-700 border-green-700"
            disabled={isLoading || isSolved}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        </div>

        {/* Symbol Buttons Display */}
        <div className="mb-4">
          <h4 className="text-sm text-gray-400 mb-2 text-center">Code Entry Buttons:</h4>
          <div className="flex justify-center gap-4">
            {["$", "*", "&", "#"].map((symbol) => (
              <button
                key={symbol}
                className="btn btn-lg btn-circle bg-gray-700 hover:bg-gray-600 border-gray-600 text-2xl font-mono"
                disabled
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Current Selection */}
        {currentSound && (
          <div className="text-center text-sm text-gray-400 mb-4">
            Selected Sound: <span className="text-white font-medium">{currentSound}</span>
          </div>
        )}
      </div>

      {/* Solve button */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={solveListeningModule}
          className="btn btn-primary flex-1"
          disabled={isLoading || isSolved || !currentSound}
        >
          {isLoading ? <span className="loading loading-spinner loading-sm"></span> : ""}
          {isLoading ? "Solving..." : "Get Code"}
        </button>
        <button onClick={reset} className="btn btn-outline" disabled={isLoading}>
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

      {/* Twitch Command */}
      {twitchCommand && result && (
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
        <p className="mb-2">Press the play button on the module to hear a sound, then select or enter that sound.</p>
        <p>• Select the sound from the dropdown list or enter a custom description</p>
        <p>• The solver will provide the 4-symbol code to enter</p>
        <p>• Enter the code using the $ * & # buttons on the module</p>
        <p>• Pressing play on the module clears any previously entered code</p>
      </div>
    </div>
  );
}
