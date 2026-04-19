import { useCallback, useEffect, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveKeypads, type KeypadSymbol } from "../../services/keypadsService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { useRoundStore } from "../../store/useRoundStore";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import { cn } from "../../lib/cn";

interface KeypadsSolverProps {
  bomb: BombEntity | null | undefined;
}

const SYMBOL_DISPLAY: Record<KeypadSymbol, string> = {
  BALLOON: "Ϙ", AT: "Ѧ", LAMBDA: "ƛ", LIGHTNING: "ϟ", SQUID_KNIFE: "Ѭ",
  CURSIVE: "Ҩ", BACKWARD_C: "Ͽ", EURO: "Ӭ", N_WITH_HAT: "Ҋ", HOLLOW_STAR: "☆",
  QUESTION_MARK: "¿", COPYRIGHT: "©", PUMPKIN: "Ѽ", DOUBLE_K: "Җ", MELTED_3: "Ԇ",
  SIX: "б", PARAGRAPH: "¶", BT: "Ѣ", SMILEY: "ټ", PITCHFORK: "Ψ",
  C: "Ͼ", DRAGON: "Ѯ", FILLED_STAR: "★", TRACK: "҂", AE: "æ",
  HOOK_N: "ⳤ", OMEGA: "Ω",
};

const UNIQUE_SYMBOLS: readonly KeypadSymbol[] = [
  "BALLOON", "AT", "LAMBDA", "LIGHTNING", "SQUID_KNIFE", "HOOK_N", "BACKWARD_C",
  "EURO", "CURSIVE", "HOLLOW_STAR", "QUESTION_MARK", "COPYRIGHT", "PUMPKIN",
  "DOUBLE_K", "MELTED_3", "SIX", "PARAGRAPH", "BT", "SMILEY", "PITCHFORK",
  "C", "DRAGON", "FILLED_STAR", "TRACK", "AE", "N_WITH_HAT", "OMEGA",
] as const;

export default function KeypadsSolver({ bomb }: KeypadsSolverProps) {
  const [selectedSymbols, setSelectedSymbols] = useState<KeypadSymbol[]>([]);
  const [result, setResult] = useState<KeypadSymbol[]>([]);
  const [twitchCommands, setTwitchCommands] = useState<string[]>([]);

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
  const updateModuleAfterSolve = useRoundStore((s) => s.updateModuleAfterSolve);

  const moduleState = useMemo(() => ({ selectedSymbols }), [selectedSymbols]);

  const onRestoreState = useCallback(
    (state: { selectedSymbols?: KeypadSymbol[]; symbols?: KeypadSymbol[] }) => {
      const symbols = state.selectedSymbols ?? state.symbols;
      if (symbols && Array.isArray(symbols)) setSelectedSymbols(symbols);
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (solution: { pressOrder: KeypadSymbol[]; twitchCommands?: string[] } | KeypadSymbol[]) => {
      const pressOrder = Array.isArray(solution) ? solution : solution.pressOrder;
      if (!pressOrder || !Array.isArray(pressOrder)) return;
      setResult(pressOrder);
      if (!Array.isArray(solution) && solution.twitchCommands?.length) {
        setTwitchCommands(solution.twitchCommands);
      } else {
        setTwitchCommands([]);
      }
    },
    [],
  );

  useSolverModulePersistence<
    { selectedSymbols: KeypadSymbol[] },
    { pressOrder: KeypadSymbol[]; twitchCommands?: string[] } | KeypadSymbol[]
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as {
          output?: unknown;
          symbols?: unknown;
          pressOrder?: unknown;
          twitchCommands?: unknown;
        };
        const pressOrder =
          anyRaw.output && typeof anyRaw.output === "object"
            ? (anyRaw.output as { pressOrder?: KeypadSymbol[] }).pressOrder
            : Array.isArray(anyRaw.symbols)
              ? (anyRaw.symbols as KeypadSymbol[])
              : Array.isArray(anyRaw.pressOrder)
                ? (anyRaw.pressOrder as KeypadSymbol[])
                : null;
        if (!pressOrder) return Array.isArray(raw) ? (raw as KeypadSymbol[]) : null;
        const twitchCommands = Array.isArray(anyRaw.twitchCommands)
          ? (anyRaw.twitchCommands as string[])
          : undefined;
        return { pressOrder, twitchCommands };
      }
      if (Array.isArray(raw)) return raw as KeypadSymbol[];
      return null;
    },
    inferSolved: (_sol, currentModule) =>
      Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const POSITIONS = useMemo(
    () => ["TOP_LEFT", "TOP_RIGHT", "BOTTOM_LEFT", "BOTTOM_RIGHT"] as const,
    [],
  );

  useEffect(() => {
    if (result.length !== 4 || selectedSymbols.length !== 4 || twitchCommands.length > 0) return;
    const commands = result.map((symbol) => {
      const positionIndex = selectedSymbols.indexOf(symbol);
      return generateTwitchCommand({
        moduleType: ModuleType.KEYPADS,
        result: { position: POSITIONS[positionIndex] },
      });
    });
    setTwitchCommands(commands);
  }, [result, selectedSymbols, twitchCommands.length, POSITIONS]);

  const toggleSymbol = (symbol: KeypadSymbol) => {
    if (isSolved) return;
    clearError();
    if (selectedSymbols.includes(symbol)) {
      setSelectedSymbols(selectedSymbols.filter((s) => s !== symbol));
    } else if (selectedSymbols.length < 4) {
      setSelectedSymbols([...selectedSymbols, symbol]);
    }
  };

  const handleSolve = async () => {
    if (selectedSymbols.length !== 4) {
      setError("Select exactly 4 symbols.");
      return;
    }
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();
    try {
      const response = await solveKeypads(round.id, bomb.id, currentModule.id, {
        input: { symbols: selectedSymbols },
      });
      setResult(response.output.pressOrder);

      const commands = response.output.pressOrder.map((symbol: KeypadSymbol) => {
        const positionIndex = selectedSymbols.indexOf(symbol);
        return generateTwitchCommand({
          moduleType: ModuleType.KEYPADS,
          result: { position: POSITIONS[positionIndex] },
        });
      });
      setTwitchCommands(commands);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { selectedSymbols },
        { pressOrder: response.output.pressOrder, twitchCommands: commands },
        true,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve keypads");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setSelectedSymbols([]);
    setResult([]);
    setTwitchCommands([]);
    resetSolverState();
  };

  const pressIndexBySymbol = useMemo(() => {
    const map = new Map<KeypadSymbol, number>();
    result.forEach((sym, i) => map.set(sym, i));
    return map;
  }, [result]);

  return (
    <SolverLayout>
      <SolverSection
        title={`Select symbols (${selectedSymbols.length}/4)`}
        description="Tap the 4 symbols shown on the module. Tap again to deselect."
      >
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
          {UNIQUE_SYMBOLS.map((symbol) => {
            const isSelected = selectedSymbols.includes(symbol);
            const disabled = isSolved || (!isSelected && selectedSymbols.length >= 4);
            return (
              <button
                key={symbol}
                type="button"
                onClick={() => toggleSymbol(symbol)}
                disabled={disabled}
                title={symbol}
                aria-pressed={isSelected}
                className={cn(
                  "flex h-11 items-center justify-center rounded-md border text-xl transition-all",
                  isSelected
                    ? "border-ring bg-accent/15 ring-2 ring-ring ring-offset-1 ring-offset-card"
                    : "border-border bg-muted/40 hover:border-foreground/40 hover:bg-muted",
                  disabled && !isSelected && "opacity-40 cursor-not-allowed",
                  isSolved && "cursor-not-allowed",
                )}
              >
                {SYMBOL_DISPLAY[symbol]}
              </button>
            );
          })}
        </div>
      </SolverSection>

      <SolverSection
        title="Module layout"
        description="The four buttons as arranged on the module. Press order is shown once solved."
      >
        <div className="mx-auto grid max-w-xs grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((index) => {
            const sym = selectedSymbols[index];
            const pressOrder = sym != null ? pressIndexBySymbol.get(sym) : undefined;
            const positionLabel = ["Top-left", "Top-right", "Bottom-left", "Bottom-right"][index];
            return (
              <div
                key={index}
                className={cn(
                  "relative flex aspect-square items-center justify-center rounded-xl border text-3xl transition-colors",
                  sym
                    ? "border-border bg-muted/60"
                    : "border-dashed border-border bg-muted/30 text-muted-foreground",
                  isSolved && pressOrder !== undefined && "border-emerald-500 bg-emerald-500/10",
                )}
                aria-label={`${positionLabel}${sym ? `: ${sym}` : " (empty)"}`}
              >
                <span>{sym ? SYMBOL_DISPLAY[sym] : ""}</span>
                {isSolved && pressOrder !== undefined && (
                  <span className="absolute top-1.5 left-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                    {pressOrder + 1}
                  </span>
                )}
                <span className="absolute bottom-1.5 right-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                  {positionLabel}
                </span>
              </div>
            );
          })}
        </div>
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={selectedSymbols.length !== 4}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Solve"
      />

      <ErrorAlert error={error} />

      {isSolved && result.length > 0 && (
        <SolverSection title="Press in this order" className="border-emerald-500/40">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {result.map((sym, index) => (
              <div
                key={`${sym}-${index}`}
                className="flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5"
              >
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {index + 1}.
                </span>
                <span className="text-xl">{SYMBOL_DISPLAY[sym]}</span>
              </div>
            ))}
          </div>
          <TwitchCommandDisplay command={twitchCommands} className="mt-3" />
        </SolverSection>
      )}

      <SolverInstructions>
        Pick the 4 symbols displayed on the module. The module layout below
        shows them in the order you selected. After solving, the press order is
        numbered on each button.
      </SolverInstructions>
    </SolverLayout>
  );
}
