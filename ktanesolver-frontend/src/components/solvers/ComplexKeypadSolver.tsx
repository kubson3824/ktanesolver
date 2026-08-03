import { useCallback, useMemo, useState } from "react";
import {
  solveComplexKeypad,
  type ComplexKeypadOutput,
  type ComplexKeypadSymbol,
} from "../../services/complexKeypadService";
import { ModuleType, PortType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { cn } from "../../lib/cn";
import {
  ErrorAlert,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverSection,
  TwitchCommandDisplay,
  useSolver,
  useSolverModulePersistence,
} from "../common";

const SYMBOLS: Array<{ value: ComplexKeypadSymbol; glyph: string; name: string }> = [
  { value: "ALPHA", glyph: "α", name: "alpha" },
  { value: "EPSILON", glyph: "ε", name: "epsilon" },
  { value: "THETA", glyph: "θ", name: "theta" },
  { value: "PSI", glyph: "ψ", name: "psi" },
  { value: "MU", glyph: "μ", name: "mu" },
  { value: "XI", glyph: "Ξ", name: "xi" },
  { value: "ZETA", glyph: "ζ", name: "zeta" },
  { value: "SIGMA", glyph: "σ", name: "sigma" },
  { value: "BETA", glyph: "β", name: "beta" },
  { value: "UPPER_DELTA", glyph: "Δ", name: "uppercase delta" },
  { value: "PI", glyph: "π", name: "pi" },
  { value: "OMEGA", glyph: "ω", name: "omega" },
  { value: "LOWER_DELTA", glyph: "δ", name: "lowercase delta" },
  { value: "GAMMA", glyph: "Γ", name: "gamma" },
  { value: "ETA", glyph: "η", name: "eta" },
  { value: "ARABIC_MEEM", glyph: "م", name: "Arabic meem" },
  { value: "HORSESHOE", glyph: "⊃", name: "horseshoe" },
  { value: "KAPPA", glyph: "κ", name: "kappa" },
  { value: "PHI", glyph: "φ", name: "phi" },
  { value: "HEBREW_NUN", glyph: "נ", name: "Hebrew nun" },
  { value: "ARABIC_NOON", glyph: "ن", name: "Arabic noon" },
];

const symbolByValue = new Map(SYMBOLS.map((symbol) => [symbol.value, symbol]));

interface ComplexKeypadSolverProps {
  bomb: BombEntity | null | undefined;
}

type PersistedState = {
  selectedSymbols: ComplexKeypadSymbol[];
  solution: ComplexKeypadOutput | null;
  twitchCommand: string;
};

export default function ComplexKeypadSolver({ bomb }: ComplexKeypadSolverProps) {
  const [selectedSymbols, setSelectedSymbols] = useState<ComplexKeypadSymbol[]>([]);
  const [solution, setSolution] = useState<ComplexKeypadOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();

  const readingOrder = Boolean(
    bomb
      && bomb.aaBatteryCount + bomb.dBatteryCount > 2
      && bomb.portPlates.some((plate) => plate.ports.includes(PortType.PARALLEL)),
  );
  const moduleState = useMemo(
    () => ({ selectedSymbols, solution, twitchCommand }),
    [selectedSymbols, solution, twitchCommand],
  );
  const onRestoreState = useCallback((state: PersistedState & { symbols?: ComplexKeypadSymbol[] }) => {
    setSelectedSymbols(state.selectedSymbols ?? state.symbols ?? []);
    setSolution(state.solution ?? null);
    setTwitchCommand(state.twitchCommand ?? "");
  }, []);
  const onRestoreSolution = useCallback((restored: ComplexKeypadOutput) => {
    if (!restored?.pressPositions) return;
    setSolution(restored);
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.COMPLEX_KEYPAD, result: restored }));
  }, []);

  useSolverModulePersistence<PersistedState, ComplexKeypadOutput>({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as { output?: unknown };
      return (value.output && typeof value.output === "object" ? value.output : raw) as ComplexKeypadOutput;
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const toggleSymbol = (symbol: ComplexKeypadSymbol) => {
    if (isLoading || isSolved || readingOrder) return;
    setSelectedSymbols((selected) => selected.includes(symbol)
      ? selected.filter((value) => value !== symbol)
      : selected.length < 9 ? [...selected, symbol] : selected);
    clearError();
  };

  const handleSolve = async () => {
    if (!readingOrder && selectedSymbols.length !== 9) {
      setError("Select all nine symbols in reading order");
      return;
    }
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }
    setIsLoading(true);
    clearError();
    try {
      const response = await solveComplexKeypad(
        round.id, bomb.id, currentModule.id,
        { symbols: readingOrder ? [] : selectedSymbols },
      );
      setSolution(response.output);
      setTwitchCommand(generateTwitchCommand({
        moduleType: ModuleType.COMPLEX_KEYPAD,
        result: response.output,
      }));
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
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

  return (
    <SolverLayout>
      {readingOrder ? (
        <SolverSection
          title="Reading-order shortcut applies"
          description="The bomb has more than two batteries and a parallel port, so no symbol entry is needed."
        >
          <p className="text-sm text-muted-foreground">Press Solve to generate the nine-button sequence.</p>
        </SolverSection>
      ) : (
        <>
          <SolverSection
            title="Symbols"
            description={`Select the keypad from left to right, top to bottom (${selectedSymbols.length}/9).`}
          >
            <div className="grid grid-cols-7 gap-2">
              {SYMBOLS.map(({ value, glyph, name }) => {
                const selected = selectedSymbols.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleSymbol(value)}
                    disabled={isSolved || (!selected && selectedSymbols.length === 9)}
                    aria-label={`Select ${name} symbol`}
                    aria-pressed={selected}
                    className={cn(
                      "relative h-12 rounded-md border-2 text-2xl",
                      selected ? "border-ring bg-accent/20" : "border-border bg-muted/40",
                    )}
                  >
                    {selected && (
                      <span className="absolute left-1 top-1 text-[0.65rem] font-bold">
                        {selectedSymbols.indexOf(value) + 1}
                      </span>
                    )}
                    {glyph}
                  </button>
                );
              })}
            </div>
          </SolverSection>

          <SolverSection title="Keypad" description="Positions are numbered in reading order.">
            <div className="mx-auto grid max-w-xs grid-cols-3 gap-2">
              {Array.from({ length: 9 }, (_, index) => {
                const symbol = selectedSymbols[index];
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => symbol && toggleSymbol(symbol)}
                    disabled={!symbol || isSolved}
                    aria-label={symbol ? `Remove symbol from position ${index + 1}` : `Empty position ${index + 1}`}
                    className="h-16 rounded-md border-2 border-border bg-card text-2xl"
                  >
                    {symbol ? symbolByValue.get(symbol)?.glyph : index + 1}
                  </button>
                );
              })}
            </div>
          </SolverSection>
        </>
      )}

      <SolverControls
        onSolve={handleSolve}
        onReset={handleReset}
        isSolveDisabled={!readingOrder && selectedSymbols.length !== 9}
        isLoading={isLoading}
        isSolved={isSolved}
      />
      <ErrorAlert error={error} />

      {solution && (
        <SolverSection
          title="Press in this order"
          description={solution.rule === "READING_ORDER" ? "Reading-order edgework rule." : solution.rule === "CHART_REVERSE" ? "Chart order, right to left." : "Chart order, left to right."}
        >
          <div className="flex flex-wrap gap-2">
            {solution.pressPositions.map((position, index) => (
              <span key={position} className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2">
                {index + 1}. {selectedSymbols[position - 1]
                  ? symbolByValue.get(selectedSymbols[position - 1])?.glyph
                  : `button ${position}`}
              </span>
            ))}
          </div>
        </SolverSection>
      )}
      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
      <SolverInstructions>
        Enter the nine symbols in reading order. The solver identifies their chart row and applies the bomb edgework rules.
      </SolverInstructions>
    </SolverLayout>
  );
}
