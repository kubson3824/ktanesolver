import { useState, useEffect } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solvePianoKeys, type PianoKeysSymbol, type PianoKeysNote } from "../../services/pianoKeysService";
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

interface PianoKeysSolverProps {
  bomb: BombEntity | null | undefined;
}

const SYMBOLS: { symbol: PianoKeysSymbol; unicode: string; label: string }[] = [
  { symbol: "FLAT", unicode: "♭", label: "Flat" },
  { symbol: "SHARP", unicode: "♯", label: "Sharp" },
  { symbol: "NATURAL", unicode: "♮", label: "Natural" },
  { symbol: "FERMATA", unicode: "𝄐", label: "Fermata" },
  { symbol: "C_CLEF", unicode: "𝄡", label: "C Clef" },
  { symbol: "MORDENT", unicode: "𝄽", label: "Mordent" },
  { symbol: "TURN", unicode: "~", label: "Turn" },
  { symbol: "COMMON_TIME", unicode: "c", label: "Common Time" },
  { symbol: "CUT_TIME", unicode: "¢", label: "Cut Time" },
];

const NOTES: { note: PianoKeysNote; isBlack: boolean; position: number }[] = [
  { note: "C", isBlack: false, position: 0 },
  { note: "C_SHARP", isBlack: true, position: 0.5 },
  { note: "D", isBlack: false, position: 1 },
  { note: "D_SHARP", isBlack: true, position: 1.5 },
  { note: "E", isBlack: false, position: 2 },
  { note: "F", isBlack: false, position: 3 },
  { note: "F_SHARP", isBlack: true, position: 3.5 },
  { note: "G", isBlack: false, position: 4 },
  { note: "G_SHARP", isBlack: true, position: 4.5 },
  { note: "A", isBlack: false, position: 5 },
  { note: "A_SHARP", isBlack: true, position: 5.5 },
  { note: "B", isBlack: false, position: 6 },
];

const getNoteDisplay = (note: PianoKeysNote): string => {
  return note.replace("_SHARP", "♯");
};

export default function PianoKeysSolver({ bomb }: PianoKeysSolverProps) {
  const [selectedSymbols, setSelectedSymbols] = useState<PianoKeysSymbol[]>([]);
  const [solution, setSolution] = useState<{
    notes: PianoKeysNote[];
  } | null>(null);
  const [twitchCommands, setTwitchCommands] = useState<string[]>([]);
  
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

  // Save state to module when inputs change
  const saveState = () => {
    if (currentModule) {
      const moduleState = {
        selectedSymbols,
        solution,
        twitchCommands
      };
      // Update the module in the store
      useRoundStore.getState().round?.bombs.forEach(bomb => {
        if (bomb.id === currentModule.bomb.id) {
          const module = bomb.modules.find(m => m.id === currentModule.id);
          if (module) {
            module.state = moduleState;
          }
        }
      });
    }
  };

  // Update state when inputs change
  useEffect(() => {
    saveState();
  }, [selectedSymbols, solution, twitchCommands]);

  // Restore state from module when component loads
  useEffect(() => {
    if (currentModule?.state && typeof currentModule.state === 'object') {
      const moduleState = currentModule.state as { 
        selectedSymbols?: PianoKeysSymbol[];
        solution?: {
          notes: PianoKeysNote[];
        } | null;
        twitchCommands?: string[];
      };
      
      if (moduleState.selectedSymbols) setSelectedSymbols(moduleState.selectedSymbols);
      if (moduleState.solution !== undefined) setSolution(moduleState.solution);
      if (moduleState.twitchCommands) setTwitchCommands(moduleState.twitchCommands);
    }

    // Restore solution if module was solved
    if (currentModule?.solution && typeof currentModule.solution === 'object') {
      const solution = currentModule.solution as { 
        solution?: {
          notes: PianoKeysNote[];
        };
        isSolved?: boolean;
      };
      
      if (solution.solution) {
        setSolution(solution.solution);
      }
      if (solution.isSolved) {
        setIsSolved(true);
      }
    }
  }, [currentModule, moduleNumber, setIsSolved]);

  const handleSymbolClick = (symbol: PianoKeysSymbol) => {
    if (isSolved || isLoading) return;
    
    clearError();
    
    if (selectedSymbols.includes(symbol)) {
      // Remove symbol if already selected
      setSelectedSymbols(selectedSymbols.filter(s => s !== symbol));
    } else if (selectedSymbols.length < 3) {
      // Add symbol if less than 3 selected
      setSelectedSymbols([...selectedSymbols, symbol]);
    }
    setSolution(null);
    setTwitchCommands([]);
  };

  const handleSolve = async () => {
    if (selectedSymbols.length !== 3) {
      setError("Please select exactly 3 symbols");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solvePianoKeys(round.id, bomb.id, currentModule.id, {
        input: {
          symbols: selectedSymbols
        }
      });

      setSolution(response.output);
      
      // Generate Twitch command for the solution
      const noteSequence = response.output.notes.map(getNoteDisplay).join("-");
      const command = generateTwitchCommand({
        moduleType: ModuleType.PIANO_KEYS,
        result: {
          notes: noteSequence,
          count: response.output.notes.length
        },
        moduleNumber
      });
      setTwitchCommands([command]);
      
      // Save solution
      if (currentModule) {
        useRoundStore.getState().round?.bombs.forEach(bomb => {
          if (bomb.id === currentModule.bomb.id) {
            const module = bomb.modules.find(m => m.id === currentModule.id);
            if (module) {
              module.solution = { solution: response.output };
            }
          }
        });
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Piano Keys");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setSelectedSymbols([]);
    setSolution(null);
    setTwitchCommands([]);
    resetSolverState();
  };

  return (
    <SolverLayout>
      {/* Piano Keys Module Visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">MODULE VIEW</h3>
        
        {/* Symbol Selection */}
        <div className="mb-6">
          <p className="text-center text-gray-400 mb-3 text-sm">
            Select the 3 symbols shown on the module:
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {SYMBOLS.map(({ symbol, unicode, label }) => {
              const isSelected = selectedSymbols.includes(symbol);
              return (
                <button
                  key={symbol}
                  onClick={() => handleSymbolClick(symbol)}
                  className={`relative group transition-all duration-200 flex flex-col items-center justify-center ${
                    isSelected
                      ? "bg-blue-600 hover:bg-blue-500 text-white scale-105"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  } rounded-lg p-4 border-2 h-24 ${
                    isSelected ? "border-blue-400" : "border-gray-600"
                  }`}
                  disabled={isSolved || isLoading || (!isSelected && selectedSymbols.length >= 3)}
                  title={label}
                >
                  <span className="text-3xl font-bold mb-1">{unicode}</span>
                  <span className="text-xs text-center opacity-80">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Symbols Display */}
        {selectedSymbols.length > 0 && (
          <div className="mt-8 pt-4 border-t border-gray-700">
            <p className="text-center text-gray-400 mb-2 text-sm">
              Selected Symbols ({selectedSymbols.length}/3):
            </p>
            <div className="flex justify-center gap-2">
              {selectedSymbols.map((symbol, index) => {
                const { unicode, label } = SYMBOLS.find(s => s.symbol === symbol)!;
                return (
                  <div
                    key={index}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg border border-blue-400 flex flex-col items-center"
                  >
                    <span className="text-2xl font-bold">{unicode}</span>
                    <span className="text-xs opacity-80">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Piano Keyboard with Solution */}
        {solution && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-center text-gray-400 mb-3 text-sm">
              Play these notes in order:
            </p>

            {/* Piano Keyboard */}
            <div className="relative bg-gray-900 p-6 rounded-lg">
              <div className="flex relative mx-auto" style={{ height: '160px', width: '441px' }}>
                {/* White keys */}
                {NOTES.filter(n => !n.isBlack).map(({ note, position }) => {
                  const notePositions: number[] = [];
                  solution.notes.forEach((n, idx) => {
                    if (n === note) notePositions.push(idx);
                  });
                  const isHighlighted = notePositions.length > 0;
                  return (
                    <div
                      key={note}
                      className={`relative transition-all duration-300 flex flex-col items-center justify-end ${
                        isHighlighted
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50"
                          : "bg-white text-gray-800 hover:bg-gray-100"
                      } border border-gray-400 rounded-b-lg cursor-pointer`}
                      style={{
                        width: '60px',
                        height: '140px',
                        marginLeft: position > 0 ? '3px' : '0'
                      }}
                    >
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-center">
                        {isHighlighted && (
                          <div className={`text-sm font-bold mb-1 ${
                            isHighlighted ? "text-blue-100" : "text-blue-900"
                          }`}>
                            #{notePositions[0] + 1}{notePositions.length > 1 ? ` +${notePositions.length - 1}` : ''}
                          </div>
                        )}
                        <div className="text-lg font-bold">{getNoteDisplay(note)}</div>
                      </div>
                    </div>
                  );
                })}

                {/* Black keys */}
                {NOTES.filter(n => n.isBlack).map(({ note, position }) => {
                  const notePositions: number[] = [];
                  solution.notes.forEach((n, idx) => {
                    if (n === note) notePositions.push(idx);
                  });
                  const isHighlighted = notePositions.length > 0;
                  return (
                    <div
                      key={note}
                      className={`absolute transition-all duration-300 flex flex-col items-center justify-end ${
                        isHighlighted
                          ? "bg-blue-700 text-white shadow-lg shadow-blue-700/50"
                          : "bg-gray-900 text-gray-300 hover:bg-gray-800"
                      } rounded-b-lg cursor-pointer z-10`}
                      style={{
                        width: '40px',
                        height: '90px',
                        left: `${Math.floor(position) * 63 + 43}px`
                      }}
                    >
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-center">
                        {isHighlighted && (
                          <div className="text-xs font-bold mb-1 text-blue-200">
                            #{notePositions[0] + 1}{notePositions.length > 1 ? ` +${notePositions.length - 1}` : ''}
                          </div>
                        )}
                        <div className="text-sm font-bold">{getNoteDisplay(note)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Note Sequence */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-400 mb-2">Note Sequence:</p>
              <p className="font-mono text-lg text-blue-400">
                {solution.notes.map(getNoteDisplay).join(" → ")}
              </p>
            </div>

            {/* Twitch command display */}
            <TwitchCommandDisplay command={twitchCommands} className="mb-0" />
          </div>
        )}
      </div>

      {/* Bomb info display */}
      <BombInfoDisplay bomb={bomb} />
      
      {/* Controls */}
      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={selectedSymbols.length !== 3}
        isLoading={isLoading}
        solveText="Get Solution"
      />

      {/* Error display */}
      <ErrorAlert error={error} />

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Select the 3 musical symbols displayed on the module.</p>
        <p className="mb-2">The solution will show you which piano keys to press in order.</p>
        <p>Follow the numbered sequence on the highlighted keys.</p>
      </div>
    </div>
  );
}
