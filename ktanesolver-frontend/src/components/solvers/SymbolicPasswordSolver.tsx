import { useCallback, useMemo, useState } from "react";
import {
  KEYPAD_SYMBOL_DISPLAY,
  KEYPAD_SYMBOLS,
  type KeypadSymbol,
} from "../../services/keypadsService";
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
    setResult(null);
    setTwitchCommand("");
    clearError();
  };

  const reset = useCallback(() => {
    setSymbols(Array(6).fill(""));
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Current symbol layout" description="Enter the display from left to right, top row first.">
      <div className="mx-auto grid max-w-lg grid-cols-3 gap-2">
        {symbols.map((symbol, index) => <label key={index} className="space-y-1 text-xs text-muted-foreground">
          <span>{POSITIONS[index]}</span>
          <select
            aria-label={`${POSITIONS[index]} symbol`}
            value={symbol}
            onChange={(event) => chooseSymbol(index, event.target.value as KeypadSymbol | "")}
            disabled={isLoading || isSolved}
            className="h-12 w-full rounded-md border border-border bg-background px-2 text-center text-lg text-foreground"
          >
            <option value="">—</option>
            {KEYPAD_SYMBOLS.map((option) => <option key={option} value={option}>
              {KEYPAD_SYMBOL_DISPLAY[option]} {option.toLowerCase().replaceAll("_", " ")}
            </option>)}
          </select>
        </label>)}
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
        >{KEYPAD_SYMBOL_DISPLAY[symbol]}</div>)}
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
