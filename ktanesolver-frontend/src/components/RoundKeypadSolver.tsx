import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { BombEntity } from '@/types';
import { ModuleType } from '@/types';
import { useRoundStore } from '@/store/useRoundStore';
import { generateTwitchCommand } from '@/utils/twitchCommands';
import { solveRoundKeypad, type RoundKeypadInput, type RoundKeypadOutput, type RoundKeypadSymbol } from '@/services/roundKeypadService';

const ROUND_KEYPAD_SYMBOLS: RoundKeypadSymbol[] = [
  'BALLOON', 'AT', 'LAMBDA', 'LIGHTNING', 'SQUID_KNIFE', 'HOOK_N', 'BACKWARD_C',
  'EURO', 'CURSIVE', 'HOLLOW_STAR', 'QUESTION_MARK',
  'COPYRIGHT', 'PUMPKIN', 'DOUBLE_K', 'MELTED_3',
  'SIX', 'PARAGRAPH', 'BT', 'SMILEY',
  'PITCHFORK', 'C', 'DRAGON', 'FILLED_STAR',
  'TRACK', 'AE', 'N_WITH_HAT', 'OMEGA'
];

interface RoundKeypadSolverProps {
  bomb: BombEntity | null | undefined;
}

export function RoundKeypadSolver({ bomb }: RoundKeypadSolverProps) {
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

  const getSymbolDisplay = (symbol: string) => {
    const symbolMap: Record<string, string> = {
      'BALLOON': '🎈',
      'AT': '@',
      'LAMBDA': 'λ',
      'LIGHTNING': '⚡',
      'SQUID_KNIFE': '🦑🔪',
      'HOOK_N': 'ɲ',
      'BACKWARD_C': 'Ↄ',
      'EURO': '€',
      'CURSIVE': 'ℎ',
      'HOLLOW_STAR': '☆',
      'QUESTION_MARK': '?',
      'COPYRIGHT': '©',
      'PUMPKIN': '🎃',
      'DOUBLE_K': 'KK',
      'MELTED_3': 'Ɛ',
      'SIX': '6',
      'PARAGRAPH': '¶',
      'BT': 'BT',
      'SMILEY': '☺',
      'PITCHFORK': 'Ϯ',
      'C': 'C',
      'DRAGON': '🐉',
      'FILLED_STAR': '★',
      'TRACK': '⌗',
      'AE': 'Æ',
      'N_WITH_HAT': 'Ñ',
      'OMEGA': 'Ω'
    };
    return symbolMap[symbol] || symbol;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Round Keypad Solver</CardTitle>
        <p className="text-sm text-muted-foreground">
          Select the 8 symbols visible on the circular keypad. The solver will identify the column with the most matches
          (rightmost on tie) and tell you which symbols to press.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Select Symbols ({selectedSymbols.length}/8)</h3>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Reset
            </Button>
          </div>
          
          <div className="grid grid-cols-7 gap-2 mb-4">
            {ROUND_KEYPAD_SYMBOLS.map((symbol) => (
              <Button
                key={symbol}
                variant={selectedSymbols.includes(symbol) ? "default" : "outline"}
                className="h-12 text-xs p-1"
                onClick={() => handleSymbolClick(symbol)}
                disabled={!selectedSymbols.includes(symbol) && selectedSymbols.length >= 8}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg">{getSymbolDisplay(symbol)}</span>
                  <span className="text-xs opacity-70">{symbol}</span>
                </div>
              </Button>
            ))}
          </div>

          {selectedSymbols.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm font-medium">Selected:</span>
              {selectedSymbols.map((symbol) => (
                <Badge key={symbol} variant="secondary" className="gap-1">
                  <span>{getSymbolDisplay(symbol)}</span>
                  <span className="text-xs">{symbol}</span>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Button 
          onClick={handleSolve} 
          disabled={selectedSymbols.length !== 8 || isLoading || isSolved}
          className="w-full"
        >
          {isLoading ? 'Solving...' : isSolved ? 'Solved' : 'Solve'}
        </Button>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {solution && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Solution Found</span>
              </div>
              <div className="text-sm">
                <p className="mb-2">Press these symbols:</p>
                <div className="flex flex-wrap gap-2">
                  {solution.symbolsToPress?.map((symbol) => (
                    <Badge key={symbol} variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
                      <span>{getSymbolDisplay(symbol)}</span>
                      <span className="text-xs">{symbol}</span>
                    </Badge>
                  ))}
                </div>
                {solution.symbolsToPress?.length === 0 && (
                  <p className="text-green-700">All symbols are in the correct column. No buttons need to be pressed.</p>
                )}
              </div>
              {twitchCommand && (
                <div className="mt-3 p-2 bg-green-100 rounded">
                  <p className="text-xs text-green-800 font-mono">{twitchCommand}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
