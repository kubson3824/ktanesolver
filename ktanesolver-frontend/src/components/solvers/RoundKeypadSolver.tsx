import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  solveRoundKeypad,
  type RoundKeypadInput,
  type RoundKeypadOutput,
  type RoundKeypadSymbol,
} from "../../services/roundKeypadService";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  SolverResult,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import { cn } from "../../lib/cn";

const SYMBOL_DISPLAY: Record<RoundKeypadSymbol, { display: string }> = {
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
  "C", "DRAGON", "FILLED_STAR", "TRACK", "AE", "N_WITH_HAT", "OMEGA",
];

interface RoundKeypadSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function RoundKeypadSolver({ bomb }: RoundKeypadSolverProps) {
  const [selectedSymbols, setSelectedSymbols] = useState<RoundKeypadSymbol[]>([]);
  const [solution, setSolution] = useState<RoundKeypadOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

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
      const symbols = state.selectedSymbols ?? state.symbols;
      if (symbols && Array.isArray(symbols)) setSelectedSymbols(symbols);
      if (state.solution !== undefined) setSolution(state.solution);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback((restored: RoundKeypadOutput) => {
    if (!restored?.symbolsToPress) return;
    setSolution(restored);
    const command = generateTwitchCommand({
      moduleType: ModuleType.ROUND_KEYPAD,
      result: restored,
    });
    setTwitchCommand(command);
  }, []);

  useSolverModulePersistence<
    { selectedSymbols: RoundKeypadSymbol[]; solution: RoundKeypadOutput | null; twitchCommand: string },
    RoundKeypadOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown };
        if (anyRaw.output && typeof anyRaw.output === "object") return anyRaw.output as RoundKeypadOutput;
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
    if (selectedSymbols.includes(symbol)) {
      setSelectedSymbols(selectedSymbols.filter((s) => s !== symbol));
    } else if (selectedSymbols.length < 8) {
      setSelectedSymbols([...selectedSymbols, symbol]);
    } else {
      return;
    }
    clearError();
  };

  const handleSolve = async () => {
    if (selectedSymbols.length !== 8) {
      setError("Please select exactly 8 symbols");
      return;
    }
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
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
      setError(err instanceof Error ? err.message : "Failed to solve module");
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

  const slotRadius = 120;
  const slotPosition = (index: number) => {
    const angle = ((index * 360) / 8 - 90) * (Math.PI / 180);
    return { x: Math.cos(angle) * slotRadius, y: Math.sin(angle) * slotRadius };
  };

  const pressIndex = (symbol: RoundKeypadSymbol | undefined): number | null => {
    if (!symbol || !solution?.symbolsToPress) return null;
    const i = solution.symbolsToPress.indexOf(symbol);
    return i === -1 ? null : i + 1;
  };

  return (
    <SolverLayout>
      <SolverSection
        title="Symbols on the keypad"
        description={`Tap each of the eight symbols on the circular keypad. Selected: ${selectedSymbols.length}/8.`}
      >
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-7 md:grid-cols-8">
          {ROUND_KEYPAD_SYMBOLS.map((symbol) => {
            const isSelected = selectedSymbols.includes(symbol);
            const order = isSelected ? selectedSymbols.indexOf(symbol) + 1 : null;
            const disabled = isSolved || (!isSelected && selectedSymbols.length >= 8);
            return (
              <button
                key={symbol}
                type="button"
                onClick={() => handleSymbolClick(symbol)}
                disabled={disabled}
                aria-pressed={isSelected}
                title={symbol}
                className={cn(
                  "relative flex h-12 items-center justify-center rounded-md border-2 text-xl transition-colors",
                  isSelected
                    ? "border-ring bg-accent/15 text-foreground ring-2 ring-ring ring-offset-1 ring-offset-card"
                    : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
                  disabled && !isSelected && "cursor-not-allowed opacity-60",
                )}
              >
                {order != null && (
                  <span className="absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[0.6rem] font-bold text-white">
                    {order}
                  </span>
                )}
                <span>{SYMBOL_DISPLAY[symbol].display}</span>
              </button>
            );
          })}
        </div>
      </SolverSection>

      <SolverSection
        title="Keypad preview"
        description="Eight positions around the ring in the order selected. After solving, press order is shown."
      >
        <div className="relative mx-auto h-80 w-80">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-32 w-32 items-center justify-center rounded-full border border-border bg-muted/40 text-sm text-muted-foreground">
              Round Keypad
            </div>
          </div>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => {
            const { x, y } = slotPosition(index);
            const symbol = selectedSymbols[index];
            const style = {
              transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
              left: "50%",
              top: "50%",
            } as const;
            if (symbol) {
              const order = pressIndex(symbol);
              const isPress = order != null;
              return (
                <button
                  key={`${index}-${symbol}`}
                  type="button"
                  className={cn(
                    "absolute flex h-16 w-16 items-center justify-center rounded-lg border-2 text-2xl font-bold transition-colors",
                    isPress
                      ? "border-emerald-500 bg-emerald-500/15 text-foreground"
                      : "border-border bg-card text-foreground hover:border-ring",
                  )}
                  style={style}
                  onClick={() => handleSymbolClick(symbol)}
                  disabled={isSolved}
                  title={symbol}
                >
                  {isPress && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[0.65rem] font-bold text-white">
                      {order}
                    </span>
                  )}
                  {SYMBOL_DISPLAY[symbol].display}
                </button>
              );
            }
            return (
              <div
                key={`empty-${index}`}
                className="absolute flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 text-xs text-muted-foreground"
                style={style}
                aria-hidden
              >
                {index + 1}
              </div>
            );
          })}
        </div>
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={handleReset}
        isSolveDisabled={selectedSymbols.length !== 8}
        isLoading={isLoading}
        isSolved={isSolved}
      />

      <ErrorAlert error={error} />

      {solution && (
        <>
          {solution.symbolsToPress && solution.symbolsToPress.length > 0 ? (
            <SolverSection
              title="Press in this order"
              description="The solver picked the column with the most matches (rightmost on tie)."
            >
              <div className="flex flex-wrap gap-2">
                {solution.symbolsToPress.map((symbol, i) => (
                  <span
                    key={`${i}-${symbol}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-700 dark:text-emerald-300"
                  >
                    <span className="font-semibold">{i + 1}.</span>
                    <span className="text-lg text-foreground">{SYMBOL_DISPLAY[symbol].display}</span>
                  </span>
                ))}
              </div>
            </SolverSection>
          ) : (
            <SolverResult
              variant="info"
              title="Nothing to press"
              description="All symbols are already in the correct column."
            />
          )}
        </>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        Tap each of the eight symbols in the ring, then solve. The solution highlights the press
        order both in the symbol grid and on the ring preview.
      </SolverInstructions>
    </SolverLayout>
  );
}
