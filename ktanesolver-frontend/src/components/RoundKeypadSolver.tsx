import React, { useState } from 'react';
import type { BombEntity } from '../types';
import { ModuleType } from '../types';
import { useRoundStore } from '../store/useRoundStore';
import { generateTwitchCommand } from '../utils/twitchCommands';
import { solveRoundKeypad, type RoundKeypadInput, type RoundKeypadOutput, type RoundKeypadSymbol } from '../services/roundKeypadService';
import ModuleNumberInput from './ModuleNumberInput';

// Symbol display configuration - same as Keypads component
const SYMBOL_DISPLAY: Record<RoundKeypadSymbol, { display: string; className?: string }> = {
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

const ROUND_KEYPAD_SYMBOLS: RoundKeypadSymbol[] = [
  "BALLOON", "AT", "LAMBDA", "LIGHTNING", "SQUID_KNIFE", "HOOK_N", "BACKWARD_C",
  "EURO", "CURSIVE", "HOLLOW_STAR", "QUESTION_MARK", "COPYRIGHT", "PUMPKIN",
  "DOUBLE_K", "MELTED_3", "SIX", "PARAGRAPH", "BT", "SMILEY", "PITCHFORK",
  "C", "DRAGON", "FILLED_STAR", "TRACK", "AE", "N_WITH_HAT", "OMEGA"
];

interface RoundKeypadSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function RoundKeypadSolver({ bomb }: RoundKeypadSolverProps) {
  const [selectedSymbols, setSelectedSymbols] = useState<RoundKeypadSymbol[]>([]);
  const [solution, setSolution] = useState<RoundKeypadOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [isSolved, setIsSolved] = useState(false);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

  const handleSymbolClick = (symbol: RoundKeypadSymbol) => {
    if (isLoading || isSolved) return;
    
    if (selectedSymbols.includes(symbol)) {
      setSelectedSymbols(selectedSymbols.filter(s => s !== symbol));
    } else if (selectedSymbols.length < 8) {
      setSelectedSymbols([...selectedSymbols, symbol]);
    }
    setError("");
  };

  const handleSolve = async () => {
    if (selectedSymbols.length !== 8) {
      setError('Please select exactly 8 symbols');
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError('Missing required information');
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const input: RoundKeypadInput = { symbols: selectedSymbols };
      const response = await solveRoundKeypad(round.id, bomb.id, currentModule.id, { input });
      setSolution(response.output);
      
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      
      const command = generateTwitchCommand({
        moduleType: ModuleType.ROUND_KEYPAD,
        result: response.output,
        moduleNumber
      });
      setTwitchCommand(command);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to solve module');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedSymbols([]);
    setSolution(null);
    setError("");
    setIsSolved(false);
    setTwitchCommand("");
  };

  const getSymbolDisplay = (symbol: RoundKeypadSymbol) => {
    return SYMBOL_DISPLAY[symbol].display;
  };

  return (
    <div className="w-full">
      <ModuleNumberInput />
      
      {/* Round Keypad Module Visualization */}
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">ROUND KEYPAD MODULE</h3>
        
        {!isSolved ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-gray-200">Selected Symbols ({selectedSymbols.length}/8)</h4>
              <button className="btn btn-outline btn-sm" onClick={handleReset}>
                Reset
              </button>
            </div>
            
            {/* Circular layout for selected symbols */}
            <div className="relative mx-auto w-80 h-80">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-gray-900 rounded-full flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Press symbols in order</span>
                </div>
              </div>
              {selectedSymbols.map((symbol, index) => {
                const angle = (index * 360) / 8 - 90;
                const radius = 120;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;
                return (
                  <button
                    key={symbol}
                    className="absolute w-16 h-16 bg-gray-700 border-2 border-gray-600 rounded-lg flex items-center justify-center text-2xl font-bold hover:border-gray-500 transition-all duration-200"
                    style={{
                      transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
                      left: '50%',
                      top: '50%'
                    }}
                    onClick={() => handleSymbolClick(symbol)}
                  >
                    {getSymbolDisplay(symbol)}
                  </button>
                );
              })}
            </div>

            <button 
              onClick={handleSolve} 
              disabled={selectedSymbols.length !== 8 || isLoading || isSolved}
              className="btn btn-primary w-full"
            >
              {isLoading ? <span className="loading loading-spinner loading-sm"></span> : ""}
              {isLoading ? 'Solving...' : 'Solve'}
            </button>
          </div>
        ) : (
          <div className="bg-green-900/50 border border-green-600 rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2 text-green-300">Solution</h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-100 mb-2">Press these symbols:</p>
              <div className="flex flex-wrap gap-2">
                {solution?.symbolsToPress?.map((symbol) => (
                  <span key={symbol} className="badge badge-success">
                    {SYMBOL_DISPLAY[symbol].display}
                  </span>
                ))}
              </div>
              {solution?.symbolsToPress?.length === 0 && (
                <p className="text-green-300">All symbols are in the correct column. No buttons need to be pressed.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Symbol selector grid */}
      <div className="bg-base-200 rounded-lg p-4 mb-4">
        <h3 className="text-center text-base-content/70 mb-3 text-sm font-medium">
          SELECT SYMBOLS ({selectedSymbols.length}/8)
        </h3>
        <div className="grid grid-cols-6 sm:grid-cols-7 md:grid-cols-8 gap-2">
          {ROUND_KEYPAD_SYMBOLS.map((symbol) => {
            const isSelected = selectedSymbols.includes(symbol);
            return (
              <button
                key={symbol}
                onClick={() => handleSymbolClick(symbol)}
                disabled={isSolved || (!isSelected && selectedSymbols.length >= 8)}
                className={`h-12 rounded border-2 transition-all duration-200 flex items-center justify-center text-lg ${
                  isSelected
                    ? "bg-primary border-primary text-primary-content"
                    : selectedSymbols.length >= 8 && !isSelected
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

      {/* Controls for solved state */}
      {isSolved && (
        <div className="flex gap-3 mb-4">
          <button
            onClick={handleReset}
            className="btn btn-outline"
          >
            Reset
          </button>
        </div>
      )}

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

      {/* Twitch Command */}
      {twitchCommand && (
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
        <p className="mb-2">Select the 8 symbols visible on the circular keypad.</p>
        <p>• The solver will identify the column with the most matches (rightmost on tie)</p>
        <p>• Press the symbols in the order shown in the solution</p>
      </div>
    </div>
  );
}
