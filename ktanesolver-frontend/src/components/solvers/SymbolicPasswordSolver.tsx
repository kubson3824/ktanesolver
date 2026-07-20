import { useCallback, useMemo, useState } from "react";
import {
  KEYPAD_SYMBOLS,
  keypadSymbolImageUrl,
  type KeypadSymbol,
} from "../../services/keypadsService";
import { cn } from "../../lib/cn";
import {
  solveSymbolicPassword,
  type SymbolicPasswordOutput,
} from "../../services/symbolicPasswordService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const MOVE_LABELS: Record<string, string> = {
  LEFT_COLUMN: "Swap left column",
  MIDDLE_COLUMN: "Swap middle column",
  RIGHT_COLUMN: "Swap right column",
  TOP_LEFT: "Top row left",
  TOP_RIGHT: "Top row right",
  BOTTOM_LEFT: "Bottom row left",
  BOTTOM_RIGHT: "Bottom row right",
};

const MOVE_TOKENS: Record<string, string> = {
  LEFT_COLUMN: "l", MIDDLE_COLUMN: "m", RIGHT_COLUMN: "r",
  TOP_LEFT: "tl", TOP_RIGHT: "tr", BOTTOM_LEFT: "bl", BOTTOM_RIGHT: "br",
};

const POSITIONS = ["top-left", "top-middle", "top-right", "bottom-left", "bottom-middle", "bottom-right"];

export default function SymbolicPasswordSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [symbols, setSymbols] = useState<(KeypadSymbol | "")[]>(Array(6).fill(""));
  const [activePosition, setActivePosition] = useState(0);
  const [result, setResult] = useState<SymbolicPasswordOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ symbols }), [symbols]);

  const restoreSolution = useCallback((solution: SymbolicPasswordOutput) => {
    setResult(solution);
    setTwitchCommand(commandFor(solution.moves));
  }, []);

  useSolverModulePersistence<typeof moduleState, SymbolicPasswordOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (Array.isArray(state.symbols) && state.symbols.length === 6) setSymbols(state.symbols);
    },
    onRestoreSolution: restoreSolution,
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (symbols.some((symbol) => !symbol)) return setError("Enter all six symbols");
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError();
    setIsLoading(true);
    try {
      const response = await solveSymbolicPassword(
        round.id, bomb.id, currentModule.id, symbols as KeypadSymbol[],
      );
      const command = commandFor(response.output.moves);
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id, { symbols }, response.output, response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Symbolic Password");
    } finally {
      setIsLoading(false);
    }
  }, [symbols, round?.id, bomb?.id, currentModule?.id, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const chooseSymbol = (index: number, symbol: KeypadSymbol | "") => {
    setSymbols((current) => current.map((value, position) => position === index ? symbol : value));
    setActivePosition(Math.min(index + 1, 5));
    setResult(null);
    setTwitchCommand("");
    clearError();
  };

  const reset = useCallback(() => {
    setSymbols(Array(6).fill(""));
    setActivePosition(0);
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Current symbol layout" description="Enter the display from left to right, top row first.">
      <div className="mx-auto grid max-w-sm grid-cols-3 gap-2">
        {symbols.map((symbol, index) => <button
          key={index}
          type="button"
          aria-label={`${POSITIONS[index]}${symbol ? `: ${symbol}` : " (empty)"}`}
          aria-pressed={activePosition === index}
          onClick={() => setActivePosition(index)}
          disabled={isLoading || isSolved}
          className={cn(
            "flex aspect-square flex-col items-center justify-center rounded-md border bg-background text-xs text-muted-foreground",
            activePosition === index && "border-ring ring-2 ring-ring",
          )}
        >
          {symbol
            ? <img src={keypadSymbolImageUrl(symbol)} alt="" className="h-12 w-12 object-contain" />
            : <span className="text-2xl">—</span>}
          <span>{POSITIONS[index]}</span>
        </button>)}
      </div>
      <div className="mt-4 grid grid-cols-6 gap-1.5 sm:grid-cols-9">
        {KEYPAD_SYMBOLS.map((symbol) => <button
          key={symbol}
          type="button"
          title={symbol.toLowerCase().replaceAll("_", " ")}
          aria-label={`Choose ${symbol.toLowerCase().replaceAll("_", " ")}`}
          onClick={() => chooseSymbol(activePosition, symbol)}
          disabled={isLoading || isSolved}
          className="flex h-11 items-center justify-center rounded-md border border-border bg-muted/40 hover:border-foreground/40 hover:bg-muted disabled:cursor-not-allowed"
        >
          <img src={keypadSymbolImageUrl(symbol)} alt="" className="h-8 w-8 object-contain" />
        </button>)}
      </div>
    </SolverSection>

    <SolverControls
      onSolve={solve}
      onReset={reset}
      isSolveDisabled={symbols.some((symbol) => !symbol)}
      isLoading={isLoading}
      isSolved={isSolved}
      solveText="Find arrangement"
    />
    <ErrorAlert error={error} />

    {result && <SolverSection title="Target arrangement" className="border-emerald-500/40">
      <div className="mx-auto grid max-w-sm grid-cols-3 gap-2" aria-label="Target symbol layout">
        {result.targetSymbols.map((symbol, index) => <div
          key={index}
          aria-label={`${POSITIONS[index]}: ${symbol}`}
          className="flex aspect-square items-center justify-center rounded-md border-2 border-emerald-500 bg-emerald-500/10 text-4xl"
        ><img src={keypadSymbolImageUrl(symbol)} alt="" className="h-16 w-16 object-contain" /></div>)}
      </div>
      <ol className="mt-4 list-inside list-decimal space-y-1 text-sm">
        {result.moves.length === 0
          ? <li>Submit the current arrangement</li>
          : result.moves.map((move, index) => <li key={`${move}-${index}`}>{MOVE_LABELS[move]}</li>)}
      </ol>
      <TwitchCommandDisplay command={twitchCommand} className="mt-3" />
    </SolverSection>}

    <SolverInstructions>Use each arrow in order, then submit. Column arrows simply swap the two symbols in that column.</SolverInstructions>
  </SolverLayout>;
}

function commandFor(moves: string[]) {
  return moves.length ? `cycle ${moves.map((move) => MOVE_TOKENS[move]).join(" ")}; submit` : "submit";
}
