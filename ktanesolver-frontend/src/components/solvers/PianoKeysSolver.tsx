import { useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solvePianoKeys, type PianoKeysSymbol, type PianoKeysNote } from "../../services/pianoKeysService";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import ModuleNumberInput from "../ModuleNumberInput";

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
  const [isSolved, setIsSolved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [twitchCommands, setTwitchCommands] = useState<string[]>([]);
  
  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

  const handleSymbolClick = (symbol: PianoKeysSymbol) => {
    if (isSolved || isLoading) return;
    
    setError("");
    
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
    setError("");

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
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Piano Keys");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setSelectedSymbols([]);
    setSolution(null);
    setIsSolved(false);
    setError("");
    setTwitchCommands([]);
  };

  return (
    <div className="w-full">
      <ModuleNumberInput />
      
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

            {/* Twitch Commands */}
            <div className="bg-purple-900/20 border border-purple-500 rounded-lg p-3 mt-3">
              <h4 className="text-sm font-medium text-purple-400 mb-2">Twitch Chat Commands:</h4>
              <div className="space-y-1">
                {twitchCommands.map((command, index) => (
                  <div key={index} className="flex items-center justify-between gap-2">
                    <code className="text-sm font-mono text-purple-200">{command}</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(command);
                      }}
                      className="btn btn-xs btn-outline btn-purple"
                      title="Copy to clipboard"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bomb Info */}
      <div className="bg-base-200 rounded p-3 mb-4">
        <p className="text-sm text-base-content/70">
          Serial Number: <span className="font-mono font-bold">{bomb?.serialNumber || "Unknown"}</span>
        </p>
        <p className="text-sm text-base-content/70">
          Strikes: <span className="font-mono font-bold">{bomb?.strikes || 0}</span>
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={handleSolve}
          className="btn btn-primary flex-1"
          disabled={selectedSymbols.length !== 3 || isLoading || isSolved}
        >
          {isLoading ? <span className="loading loading-spinner loading-sm"></span> : ""}
          {isLoading ? "Solving..." : "Get Solution"}
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

      {/* Instructions */}
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Select the 3 musical symbols displayed on the module.</p>
        <p className="mb-2">The solution will show you which piano keys to press in order.</p>
        <p>Follow the numbered sequence on the highlighted keys.</p>
      </div>
    </div>
  );
}
