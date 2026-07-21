import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import {
  solveFestivePianoKeys,
  type FestivePianoKeysNote,
  type FestivePianoKeysSymbol,
} from "../../services/festivePianoKeysService";
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

interface FestivePianoKeysSolverProps {
  bomb: BombEntity | null | undefined;
}

const SYMBOLS: { symbol: FestivePianoKeysSymbol; glyph: string; label: string }[] = [
  { symbol: "MORDENT", glyph: "𝄽", label: "Mordent" },
  { symbol: "DOWN_BOW", glyph: "𝆱", label: "Down-bow" },
  { symbol: "SIXTEENTH_REST", glyph: "𝄿", label: "16th rest" },
  { symbol: "BREVE", glyph: "𝄺", label: "Breve" },
  { symbol: "C_CLEF", glyph: "𝄡", label: "C clef" },
  { symbol: "CAESURA", glyph: "𝄓", label: "Caesura" },
  { symbol: "DAL_SEGNO", glyph: "𝄋", label: "Dal segno" },
  { symbol: "SIXTEENTH_NOTE", glyph: "𝅘𝅥𝅯", label: "16th note" },
  { symbol: "PEDAL_UP", glyph: "✱", label: "Pedal up" },
  { symbol: "UP_BOW", glyph: "𝆪", label: "Up-bow" },
  { symbol: "MARCATO", glyph: "^", label: "Marcato" },
  { symbol: "SEMIBREVE_NOTE", glyph: "𝅝", label: "Semibreve" },
  { symbol: "ACCENT", glyph: ">", label: "Accent" },
];

const noteLabel = (note: FestivePianoKeysNote) => note.replace("_SHARP", "♯");

export default function FestivePianoKeysSolver({ bomb }: FestivePianoKeysSolverProps) {
  const [selectedSymbols, setSelectedSymbols] = useState<FestivePianoKeysSymbol[]>([]);
  const [solution, setSolution] = useState<{ notes: FestivePianoKeysNote[] } | null>(null);

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
    () => ({ selectedSymbols, solution }),
    [selectedSymbols, solution],
  );

  const onRestoreState = useCallback(
    (state: {
      selectedSymbols?: FestivePianoKeysSymbol[];
      input?: { symbols?: FestivePianoKeysSymbol[] };
      solution?: typeof solution;
    }) => {
      const symbols = state.selectedSymbols ?? state.input?.symbols;
      if (Array.isArray(symbols)) setSelectedSymbols(symbols);
      if (state.solution !== undefined) setSolution(state.solution ?? null);
    },
    [],
  );

  const onRestoreSolution = useCallback((restored: NonNullable<typeof solution>) => {
    if (Array.isArray(restored.notes)) setSolution(restored);
  }, []);

  useSolverModulePersistence<
    { selectedSymbols: FestivePianoKeysSymbol[]; solution: typeof solution },
    NonNullable<typeof solution>
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as { output?: unknown; solution?: unknown; notes?: unknown };
      const candidate = value.output ?? value.solution ?? raw;
      return candidate && typeof candidate === "object" && Array.isArray((candidate as { notes?: unknown }).notes)
        ? candidate as NonNullable<typeof solution>
        : null;
    },
    inferSolved: (_sol, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const toggleSymbol = (symbol: FestivePianoKeysSymbol) => {
    if (isSolved || isLoading) return;
    clearError();
    setSelectedSymbols((selected) =>
      selected.includes(symbol)
        ? selected.filter((item) => item !== symbol)
        : selected.length < 3 ? [...selected, symbol] : selected,
    );
    setSolution(null);
  };

  const solve = async () => {
    if (selectedSymbols.length !== 3) {
      setError("Please select exactly 3 symbols");
      return;
    }
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();
    try {
      const response = await solveFestivePianoKeys(
        round.id,
        bomb.id,
        currentModule.id,
        selectedSymbols,
      );
      setSolution(response.output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Festive Piano Keys");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setSelectedSymbols([]);
    setSolution(null);
    resetSolverState();
  };

  const twitchCommand = solution
    ? generateTwitchCommand({ moduleType: ModuleType.FESTIVE_PIANO_KEYS, result: solution })
    : "";

  return (
    <SolverLayout>
      <SolverSection
        title="Symbols on the module"
        description={`Pick the three musical symbols shown. Selected: ${selectedSymbols.length}/3.`}
      >
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {SYMBOLS.map(({ symbol, glyph, label }) => {
            const selected = selectedSymbols.includes(symbol);
            const disabled = isSolved || isLoading || (!selected && selectedSymbols.length === 3);
            return (
              <button
                key={symbol}
                type="button"
                aria-label={label}
                aria-pressed={selected}
                disabled={disabled}
                onClick={() => toggleSymbol(symbol)}
                className={cn(
                  "flex min-h-20 flex-col items-center justify-center rounded-lg border-2 p-2 transition-colors",
                  selected
                    ? "border-ring bg-accent/15 ring-2 ring-ring"
                    : "border-border bg-muted/40 hover:text-foreground",
                  disabled && !selected && "cursor-not-allowed opacity-50",
                )}
              >
                <span aria-hidden="true" className="text-3xl leading-none">{glyph}</span>
                <span className="mt-2 text-center text-xs">{label}</span>
              </button>
            );
          })}
        </div>
      </SolverSection>

      <SolverControls
        onSolve={solve}
        onReset={reset}
        isSolveDisabled={selectedSymbols.length !== 3}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Get melody"
      />

      <ErrorAlert error={error} />

      {solution && (
        <SolverSection
          title="Play these notes"
          description={`${solution.notes.length}-note sequence. A strike resets it to the first note.`}
        >
          <ol className="flex flex-wrap justify-center gap-2">
            {solution.notes.map((note, index) => (
              <li
                key={`${note}-${index}`}
                className="rounded-md border border-border bg-muted px-3 py-2 font-mono text-sm"
              >
                <span className="mr-1 text-muted-foreground">{index + 1}.</span>
                {noteLabel(note)}
              </li>
            ))}
          </ol>
        </SolverSection>
      )}

      {twitchCommand && <TwitchCommandDisplay command={[twitchCommand]} />}

      <SolverInstructions>
        Rules are checked from top to bottom; the first matching festive melody is the answer.
      </SolverInstructions>
    </SolverLayout>
  );
}
