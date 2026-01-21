import { useState } from "react";
import type { BombEntity} from "../../types";
import { ModuleType } from "../../types";
import { solveKeypads, type KeypadSymbol } from "../../services/keypadsService";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import ModuleNumberInput from "../ModuleNumberInput";

interface KeypadsSolverProps {
  bomb: BombEntity | null | undefined;
}

// Symbol display configuration - mapping symbols to their visual representation
const SYMBOL_DISPLAY: Record<KeypadSymbol, { display: string; className?: string }> = {
  BALLOON: { display: "Ϙ" },
  AT: { display: "Ѧ" },
  LAMBDA: { display: "ƛ" },
  LIGHTNING: { display: "ϟ" },
  SQUID_KNIFE: { display: "Ѭ" },
  CURSIVE: { display: "Ҩ" },
  BACKWARD_C: { display: "Ͽ" },
  EURO: { display: "Ӭ" },
  N_WITH_HAT: { display: "Ҋ" },
  HOLLOW_STAR: { display: "☆" },
  QUESTION_MARK: { display: "¿" },
  COPYRIGHT: { display: "©" },
  PUMPKIN: { display: "Ѽ" },
  DOUBLE_K: { display: "Җ" },
  MELTED_3: { display: "Ԇ" },
  SIX: { display: "б" },
  PARAGRAPH: { display: "¶" },
  BT: { display: "Ѣ" },
  SMILEY: { display: "ټ" },
  PITCHFORK: { display: "Ψ" },
  C: { display: "Ͼ" },
  DRAGON: { display: "Ѯ" },
  FILLED_STAR: { display: "★" },
  TRACK: { display: "҂" },
  AE: { display: "æ" },
  HOOK_N: { display: "ⳤ" },
  OMEGA: { display: "Ω" },
};

// Unique symbols for selection (removing duplicates)
const UNIQUE_SYMBOLS: KeypadSymbol[] = [
  "BALLOON", "AT", "LAMBDA", "LIGHTNING", "SQUID_KNIFE", "HOOK_N", "BACKWARD_C",
  "EURO", "CURSIVE", "HOLLOW_STAR", "QUESTION_MARK", "COPYRIGHT", "PUMPKIN",
  "DOUBLE_K", "MELTED_3", "SIX", "PARAGRAPH", "BT", "SMILEY", "PITCHFORK",
  "C", "DRAGON", "FILLED_STAR", "TRACK", "AE", "N_WITH_HAT", "OMEGA"
];

export default function KeypadsSolver({ bomb }: KeypadsSolverProps) {
  const [selectedSymbols, setSelectedSymbols] = useState<KeypadSymbol[]>([]);
  const [result, setResult] = useState<KeypadSymbol[]>([]);
  const [isSolved, setIsSolved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [twitchCommands, setTwitchCommands] = useState<string[]>([]);

  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

  const handleSymbolClick = (symbol: KeypadSymbol) => {
    if (isSolved) return;

    setError("");
    
    if (selectedSymbols.includes(symbol)) {
      // Deselect if already selected
      setSelectedSymbols(selectedSymbols.filter(s => s !== symbol));
    } else if (selectedSymbols.length < 4) {
      // Select if we have room
      setSelectedSymbols([...selectedSymbols, symbol]);
    }
  };

  const handleSolve = async () => {
    if (selectedSymbols.length !== 4) {
      setError("Please select exactly 4 symbols");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await solveKeypads(round.id, bomb.id, currentModule.id, {
        input: {
          symbols: selectedSymbols
        }
      });

      setResult(response.output.pressOrder);
      
      // Generate Twitch commands for each press in sequence
      const positionNames = ['TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT'];
      const commands = response.output.pressOrder.map((symbol: KeypadSymbol) => {
        const positionIndex = selectedSymbols.indexOf(symbol);
        const positionName = positionNames[positionIndex];
        return generateTwitchCommand({
          moduleType: ModuleType.KEYPADS,
          result: { position: positionName },
          moduleNumber
        });
      });
      setTwitchCommands(commands);
      
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve keypads");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setSelectedSymbols([]);
    setResult([]);
    setIsSolved(false);
    setError("");
    setTwitchCommands([]);
  };

  return (
    <div className="w-full">
      <ModuleNumberInput />
      {/* Module visualization - 2x2 grid showing selected symbols */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">MODULE VIEW</h3>
        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
          {[0, 1, 2, 3].map((index) => (
            <button
              key={index}
              className={`h-20 rounded-lg border-2 transition-all duration-200 flex items-center justify-center text-2xl font-bold ${
                selectedSymbols[index]
                  ? "bg-gray-700 border-gray-600 hover:border-gray-500"
                  : "bg-gray-900 border-gray-700"
              } ${isSolved ? "cursor-not-allowed" : "cursor-pointer"}`}
              onClick={() => {
                if (selectedSymbols[index] && !isSolved) {
                  handleSymbolClick(selectedSymbols[index]);
                }
              }}
              disabled={isSolved}
            >
              {selectedSymbols[index] ? SYMBOL_DISPLAY[selectedSymbols[index]].display : ""}
            </button>
          ))}
        </div>
        {isSolved && (
          <div className="mt-4 text-center">
            <p className="text-green-400 text-sm font-medium mb-2">Press in order:</p>
            <div className="flex justify-center gap-2 mb-3">
              {result.map((symbol, index) => (
                <div key={index} className="bg-green-900/50 border border-green-600 rounded px-3 py-2">
                  <span className="text-green-300 font-bold">{index + 1}.</span>
                  <span className="text-xl ml-1">{SYMBOL_DISPLAY[symbol].display}</span>
                </div>
              ))}
            </div>
            
            {/* Twitch Commands */}
            <div className="bg-purple-900/20 border border-purple-500 rounded-lg p-3">
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

      {/* Symbol selector grid */}
      <div className="bg-base-200 rounded-lg p-4 mb-4">
        <h3 className="text-center text-base-content/70 mb-3 text-sm font-medium">
          SELECT SYMBOLS ({selectedSymbols.length}/4)
        </h3>
        <div className="grid grid-cols-6 sm:grid-cols-7 md:grid-cols-8 gap-2">
          {UNIQUE_SYMBOLS.map((symbol) => {
            const isSelected = selectedSymbols.includes(symbol);
            return (
              <button
                key={symbol}
                onClick={() => handleSymbolClick(symbol)}
                disabled={isSolved || (!isSelected && selectedSymbols.length >= 4)}
                className={`h-12 rounded border-2 transition-all duration-200 flex items-center justify-center text-lg ${
                  isSelected
                    ? "bg-primary border-primary text-primary-content"
                    : selectedSymbols.length >= 4 && !isSelected
                    ? "bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed"
                    : "bg-base-100 border-base-300 hover:border-primary hover:bg-primary/10"
                }`}
                title={symbol}
              >
                {SYMBOL_DISPLAY[symbol].display}
              </button>
            );
          })}
        </div>
      </div>
        
      {/* Controls */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={handleSolve}
          className="btn btn-primary flex-1"
          disabled={selectedSymbols.length !== 4 || isLoading || isSolved}
        >
          {isLoading ? <span className="loading loading-spinner loading-sm"></span> : ""}
          {isLoading ? "Solving..." : "Solve"}
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
        <p className="mb-2">Click symbols to select the 4 symbols shown on the module. Click selected symbols to deselect them.</p>
        <p>The module shows 4 buttons arranged in a 2x2 grid. Select the symbols that appear on your module and press Solve.</p>
      </div>
    </div>
  );
}
