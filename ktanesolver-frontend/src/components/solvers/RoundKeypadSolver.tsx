import { useCallback, useMemo, useState } from 'react';
import type { BombEntity } from '../../types';
import { ModuleType } from '../../types';
import { useRoundStore } from '../../store/useRoundStore';
import { generateTwitchCommand } from '../../utils/twitchCommands';
import { solveRoundKeypad, type RoundKeypadInput, type RoundKeypadOutput, type RoundKeypadSymbol } from '../../services/roundKeypadService';
import { 
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverControls
} from '../common';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

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
    () => ({ selectedSymbols, solution, twitchCommand }),
    [selectedSymbols, solution, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: { selectedSymbols?: RoundKeypadSymbol[]; symbols?: RoundKeypadSymbol[]; solution?: RoundKeypadOutput | null; twitchCommand?: string }) => {
      // Backend stores input as state.symbols; frontend also persists selectedSymbols
      const symbols = state.selectedSymbols ?? state.symbols;
      if (symbols && Array.isArray(symbols)) {
        setSelectedSymbols(symbols);
      }
      if (state.solution !== undefined) setSolution(state.solution);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (restored: RoundKeypadOutput) => {
      if (!restored?.symbolsToPress) return;
      setSolution(restored);

      const command = generateTwitchCommand({
        moduleType: ModuleType.ROUND_KEYPAD,
        result: restored,
      });
      setTwitchCommand(command);
    },
  []);

  useSolverModulePersistence<
    { selectedSymbols: RoundKeypadSymbol[]; solution: RoundKeypadOutput | null; twitchCommand: string },
    RoundKeypadOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === 'object') {
        const anyRaw = raw as { output?: unknown };
        if (anyRaw.output && typeof anyRaw.output === 'object') return anyRaw.output as RoundKeypadOutput;
        return raw as RoundKeypadOutput;
      }
      return null;
    },
    inferSolved: (_sol, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleSymbolClick = (symbol: RoundKeypadSymbol) => {
    if (isLoading || isSolved) return;
    
    let newSymbols: RoundKeypadSymbol[];
    if (selectedSymbols.includes(symbol)) {
      newSymbols = selectedSymbols.filter(s => s !== symbol);
    } else if (selectedSymbols.length < 8) {
      newSymbols = [...selectedSymbols, symbol];
    } else {
      return;
    }
    
    setSelectedSymbols(newSymbols);
    clearError();
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
    clearError();

    try {
      const input: RoundKeypadInput = { symbols: selectedSymbols };
      const response = await solveRoundKeypad(round.id, bomb.id, currentModule.id, { input });
      setSolution(response.output);
      
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      
      const command = generateTwitchCommand({
        moduleType: ModuleType.ROUND_KEYPAD,
        result: response.output,
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
    setTwitchCommand("");
    resetSolverState();
  };

  const getSymbolDisplay = (symbol: RoundKeypadSymbol) => {
    return SYMBOL_DISPLAY[symbol].display;
  };

  const slotRadius = 120;
  const slotAngle = (index: number) => (index * 360) / 8 - 90;
  const slotPosition = (index: number) => {
    const angle = slotAngle(index);
    const rad = (angle * Math.PI) / 180;
    return {
      x: Math.cos(rad) * slotRadius,
      y: Math.sin(rad) * slotRadius,
    };
  };

  return (
    <SolverLayout>
      {/* Symbol selector grid - first (match Keypads order) */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-base-content/70 text-sm font-medium">
            SELECT SYMBOLS ({selectedSymbols.length}/8)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
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
                      ? "bg-base-300 border-base-300 text-base-content/50 cursor-not-allowed"
                      : "bg-base-100 border-base-300 hover:border-primary hover:bg-primary/10"
                  }`}
                  title={symbol}
                >
                  {SYMBOL_DISPLAY[symbol].display}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Round Keypad Module Visualization - 8 slots in circle */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-base-content/70 text-sm font-medium">
            ROUND KEYPAD MODULE
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {!isSolved ? (
            <div className="relative mx-auto w-80 h-80">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-base-300 rounded-full flex items-center justify-center border border-base-300">
                  <span className="text-base-content/60 text-sm">Round Keypad</span>
                </div>
              </div>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => {
                const { x, y } = slotPosition(index);
                const symbol = selectedSymbols[index];
                const style = {
                  transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
                  left: '50%',
                  top: '50%',
                };
                if (symbol) {
                  return (
                    <button
                      key={`${index}-${symbol}`}
                      type="button"
                      className="absolute w-16 h-16 bg-base-300 border-2 border-base-300 rounded-lg flex items-center justify-center text-2xl font-bold hover:border-primary transition-all duration-200"
                      style={style}
                      onClick={() => handleSymbolClick(symbol)}
                    >
                      {getSymbolDisplay(symbol)}
                    </button>
                  );
                }
                return (
                  <div
                    key={`empty-${index}`}
                    className="absolute w-16 h-16 rounded-lg border-2 border-dashed border-base-300 bg-base-100/50 flex items-center justify-center"
                    style={style}
                    aria-hidden
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-success/10 border border-success rounded-lg p-4">
              <h3 className="font-bold text-lg mb-2 text-success-content">Solution</h3>
              <div className="space-y-3">
                {solution?.symbolsToPress && solution.symbolsToPress.length > 0 ? (
                  <>
                    <p className="text-sm text-base-content mb-2">Press in order:</p>
                    <div className="flex flex-wrap gap-2 items-center">
                      {solution.symbolsToPress.map((symbol, i) => (
                        <span key={`${i}-${symbol}`} className="inline-flex items-center gap-1 bg-success/20 border border-success rounded px-3 py-1.5">
                          <span className="text-success-content font-semibold">{i + 1}.</span>
                          <span className="text-lg">{SYMBOL_DISPLAY[symbol].display}</span>
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-success-content">All symbols are in the correct column. No buttons need to be pressed.</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controls - single Solve/Reset */}
      <SolverControls
        onSolve={handleSolve}
        onReset={handleReset}
        isSolveDisabled={selectedSymbols.length !== 8}
        isLoading={isLoading}
        solveText="Solve"
      />

      <ErrorAlert error={error} />

      <TwitchCommandDisplay command={twitchCommand} />

      <div className="text-sm text-base-content/60">
        <p className="mb-2">Select the 8 symbols visible on the circular keypad.</p>
        <p>• The solver identifies the column with the most matches (rightmost on tie)</p>
        <p>• Press the symbols in the order shown in the solution</p>
      </div>
    </SolverLayout>
  );
}
