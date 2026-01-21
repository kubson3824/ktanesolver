import { useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveSimon, type SimonColor } from "../../services/simonService";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { 
  useSolverState,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  BombInfoDisplay,
  SolverControls
} from "../common";

interface SimonSolverProps {
  bomb: BombEntity | null | undefined;
}

const SIMON_COLORS: {
  color: SimonColor;
  display: string;
  className: string;
  lightClass: string;
  bgClass: string;
  position: string;
}[] = [
  {
    color: "BLUE",
    display: "Blue",
    className: "bg-blue-600 hover:bg-blue-500 border-blue-700",
    lightClass: "bg-blue-400 shadow-blue-400",
    bgClass: "bg-blue-900/30 border-blue-800",
    position: "TOP_LEFT"
  },
  {
    color: "YELLOW",
    display: "Yellow",
    className: "bg-yellow-500 hover:bg-yellow-400 border-yellow-600",
    lightClass: "bg-yellow-300 shadow-yellow-300",
    bgClass: "bg-yellow-900/30 border-yellow-800",
    position: "TOP_RIGHT"
  },
  {
    color: "GREEN",
    display: "Green",
    className: "bg-green-600 hover:bg-green-500 border-green-700",
    lightClass: "bg-green-400 shadow-green-400",
    bgClass: "bg-green-900/30 border-green-800",
    position: "BOTTOM_LEFT"
  },
  {
    color: "RED",
    display: "Red",
    className: "bg-red-600 hover:bg-red-500 border-red-700",
    lightClass: "bg-red-400 shadow-red-400",
    bgClass: "bg-red-900/30 border-red-800",
    position: "BOTTOM_RIGHT"
  }
];


export default function SimonSolver({ bomb }: SimonSolverProps) {
  const [flashes, setFlashes] = useState<SimonColor[]>([]);
  const [presses, setPresses] = useState<SimonColor[]>([]);
  const [twitchCommands, setTwitchCommands] = useState<string[]>([]);
  const [activeFlash, setActiveFlash] = useState<number | null>(null);
  const [activePress, setActivePress] = useState<number | null>(null);
  const [manuallySolved, setManuallySolved] = useState(false);

  const { isLoading, error, isSolved, setIsLoading, setIsSolved, setError, clearError, reset: resetSolverState } = useSolverState();
  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

  const handleColorClick = (color: SimonColor) => {
    if (isSolved || isLoading) return;
    
    clearError();
    setFlashes([...flashes, color]);
    setPresses([]);
    setTwitchCommands([]);
    setManuallySolved(false);
    
    // Flash animation - light up the button that was clicked
    const colorIndex = SIMON_COLORS.findIndex(c => c.color === color);
    setActiveFlash(colorIndex);
    setTimeout(() => setActiveFlash(null), 300);
  };

  const handleRemoveFlash = (index: number) => {
    if (isSolved || isLoading) return;
    
    const newFlashes = flashes.filter((_, i) => i !== index);
    setFlashes(newFlashes);
    setPresses([]);
    setTwitchCommands([]);
    clearError();
    setManuallySolved(false);
  };

  const handleCheckAnswer = async () => {
    if (flashes.length === 0) {
      setError("Please add at least one flash color");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveSimon(round.id, bomb.id, currentModule.id, {
        input: {
          flashes: flashes
        }
      });

      setPresses(response.output.presses);
      
      // Generate Twitch commands for each press in sequence
      const commands = response.output.presses.map((color: SimonColor) => {
        const colorInfo = SIMON_COLORS.find(c => c.color === color);
        const positionName = colorInfo?.position || 'UNKNOWN';
        return generateTwitchCommand({
          moduleType: ModuleType.SIMON_SAYS,
          result: { position: positionName },
          moduleNumber
        });
      });
      setTwitchCommands(commands);
      
      // DO NOT set solved state - just show the answer
      // The backend might return solved=true but we ignore it until manual solve
      
      // Animate the press sequence after checking
      if (response.output.presses.length > 0) {
        response.output.presses.forEach((color: SimonColor, index: number) => {
          setTimeout(() => {
            const colorIndex = SIMON_COLORS.findIndex(c => c.color === color);
            setActivePress(colorIndex);
            setTimeout(() => setActivePress(null), 400);
          }, index * 600);
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check Simon Says answer");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setFlashes([]);
    setPresses([]);
    setTwitchCommands([]);
    setActiveFlash(null);
    setActivePress(null);
    setManuallySolved(false);
    resetSolverState();
  };
  
  const handleManualSolve = () => {
    if (!bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }
    setIsSolved(true);
    setManuallySolved(true);
    markModuleSolved(bomb.id, currentModule.id);
  };

  return (
    <SolverLayout>
      
      {/* Simon Says Module Visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">MODULE VIEW</h3>
        
        {/* Simon Says Buttons */}
        <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-6">
          {SIMON_COLORS.map((color, index) => {
            const isFlashActive = activeFlash === index;
            const isPressActive = activePress === index;
            const isActive = isFlashActive || isPressActive;
            
            return (
              <button
                key={color.color}
                className={`h-24 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
                  isActive
                    ? `${color.lightClass} shadow-lg scale-95`
                    : color.className
                } ${isSolved ? "cursor-not-allowed opacity-75" : "cursor-pointer"}`}
                onClick={() => handleColorClick(color.color)}
                disabled={isSolved || isLoading}
              >
                <span className="text-white font-bold text-lg">
                  {color.display}
                </span>
              </button>
            );
          })}
        </div>

        {/* Flash Sequence */}
        {flashes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-center text-gray-400 mb-2 text-sm">Flash Sequence:</p>
            <div className="flex justify-center gap-2 flex-wrap">
              {flashes.map((color, index) => (
                <div
                  key={index}
                  className={`px-3 py-2 rounded-lg border-2 flex items-center gap-2 ${
                    SIMON_COLORS.find(c => c.color === color)?.bgClass
                  }`}
                >
                  <span className="text-gray-400 text-xs">#{index + 1}</span>
                  <span className={`font-bold ${
                    color === 'YELLOW' ? 'text-yellow-300' : 
                    color === 'RED' ? 'text-red-400' :
                    color === 'BLUE' ? 'text-blue-400' :
                    'text-green-400'
                  }`}>
                    {color}
                  </span>
                  {!isSolved && !isLoading && (
                    <button
                      onClick={() => handleRemoveFlash(index)}
                      className="ml-1 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Solution */}
        {presses.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-center text-green-400 mb-2 text-sm font-medium">Press Sequence:</p>
            <div className="flex justify-center gap-2 flex-wrap mb-3">
              {presses.map((color, index) => (
                <div
                  key={index}
                  className="bg-green-900/50 border border-green-600 rounded px-3 py-2 flex items-center gap-2"
                >
                  <span className="text-green-300 text-sm font-bold">{index + 1}.</span>
                  <span className={`font-bold ${
                    color === 'YELLOW' ? 'text-yellow-300' : 
                    color === 'RED' ? 'text-red-300' :
                    color === 'BLUE' ? 'text-blue-300' :
                    'text-green-300'
                  }`}>
                    {color}
                  </span>
                </div>
              ))}
            </div>

            {/* Twitch Commands */}
            <TwitchCommandDisplay command={twitchCommands} className="mb-0" />
          </div>
        )}
      </div>

      {/* Bomb Info */}
      <BombInfoDisplay 
        bomb={bomb} 
        showSerial={true}
        showStrikes={true}
      />

      {/* Controls */}
      <SolverControls
        onSolve={handleCheckAnswer}
        onReset={reset}
        onSolveManually={handleManualSolve}
        isSolveDisabled={flashes.length === 0}
        isManualSolveDisabled={isSolved}
        isLoading={isLoading}
        solveText="Check Answer"
        loadingText="Checking..."
        showManualSolve={true}
      />

      {/* Error */}
      <ErrorAlert error={error} />

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Click the colored buttons in the order they flash on the module.</p>
        <p className="mb-2">The solution will show you which buttons to press in response. The sequence changes based on strikes and whether the serial number has a vowel.</p>
        {manuallySolved && (
          <p className="text-success font-medium">This module was marked as solved manually.</p>
        )}
      </div>
    </SolverLayout>
  );
}
