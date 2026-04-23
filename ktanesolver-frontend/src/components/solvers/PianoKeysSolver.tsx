import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solvePianoKeys, type PianoKeysSymbol, type PianoKeysNote } from "../../services/pianoKeysService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
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

interface PianoKeysSolverProps {
  bomb: BombEntity | null | undefined;
}

const SYMBOLS: { symbol: PianoKeysSymbol; unicode: string; label: string }[] = [
  { symbol: "FLAT", unicode: "♭", label: "Flat" },
  { symbol: "SHARP", unicode: "♯", label: "Sharp" },
  { symbol: "NATURAL", unicode: "♮", label: "Natural" },
  { symbol: "FERMATA", unicode: "𝄐", label: "Fermata" },
  { symbol: "C_CLEF", unicode: "𝄡", label: "C Clef" },
  { symbol: "MORDENT", unicode: "𝄽", label: "Mordent" },
  { symbol: "TURN", unicode: "~", label: "Turn" },
  { symbol: "COMMON_TIME", unicode: "c", label: "Common Time" },
  { symbol: "CUT_TIME", unicode: "¢", label: "Cut Time" },
];

const NOTES: { note: PianoKeysNote; isBlack: boolean; position: number }[] = [
  { note: "C", isBlack: false, position: 0 },
  { note: "C_SHARP", isBlack: true, position: 0.5 },
  { note: "D", isBlack: false, position: 1 },
  { note: "D_SHARP", isBlack: true, position: 1.5 },
  { note: "E", isBlack: false, position: 2 },
  { note: "F", isBlack: false, position: 3 },
  { note: "F_SHARP", isBlack: true, position: 3.5 },
  { note: "G", isBlack: false, position: 4 },
  { note: "G_SHARP", isBlack: true, position: 4.5 },
  { note: "A", isBlack: false, position: 5 },
  { note: "A_SHARP", isBlack: true, position: 5.5 },
  { note: "B", isBlack: false, position: 6 },
];

const getNoteDisplay = (note: PianoKeysNote): string => note.replace("_SHARP", "♯");

export default function PianoKeysSolver({ bomb }: PianoKeysSolverProps) {
  const [selectedSymbols, setSelectedSymbols] = useState<PianoKeysSymbol[]>([]);
  const [solution, setSolution] = useState<{ notes: PianoKeysNote[] } | null>(null);
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
  } = useSolver();

  const moduleState = useMemo(
    () => ({ selectedSymbols, solution, twitchCommands }),
    [selectedSymbols, solution, twitchCommands],
  );

  const onRestoreState = useCallback(
    (state: {
      selectedSymbols?: PianoKeysSymbol[];
      input?: { symbols?: PianoKeysSymbol[] };
      solution?: typeof solution;
      twitchCommands?: string[];
    }) => {
      const symbols = state.selectedSymbols ?? state.input?.symbols;
      if (symbols && Array.isArray(symbols)) setSelectedSymbols(symbols);
      if (state.solution !== undefined) setSolution(state.solution ?? null);
      if (state.twitchCommands) setTwitchCommands(state.twitchCommands);
    },
    [],
  );

  const onRestoreSolution = useCallback((restored: NonNullable<typeof solution>) => {
    if (restored && Array.isArray(restored.notes)) {
      setSolution(restored);
      const noteSequence = restored.notes.map(getNoteDisplay).join("-");
      const command = generateTwitchCommand({
        moduleType: ModuleType.PIANO_KEYS,
        result: { notes: noteSequence, count: restored.notes.length },
      });
      setTwitchCommands([command]);
    }
  }, []);

  useSolverModulePersistence<
    { selectedSymbols: PianoKeysSymbol[]; solution: typeof solution; twitchCommands: string[] },
    NonNullable<typeof solution>
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; result?: unknown; solution?: unknown; notes?: unknown };
        const candidate =
          (anyRaw.output && typeof anyRaw.output === "object" ? anyRaw.output : undefined) ??
          (anyRaw.solution && typeof anyRaw.solution === "object" ? anyRaw.solution : undefined) ??
          (anyRaw.result && typeof anyRaw.result === "object" ? anyRaw.result : undefined) ??
          raw;
        if (candidate && typeof candidate === "object" && Array.isArray((candidate as { notes?: unknown }).notes)) {
          return candidate as NonNullable<typeof solution>;
        }
      }
      return null;
    },
    inferSolved: (_sol, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleSymbolClick = (symbol: PianoKeysSymbol) => {
    if (isSolved || isLoading) return;
    clearError();
    if (selectedSymbols.includes(symbol)) {
      setSelectedSymbols(selectedSymbols.filter((s) => s !== symbol));
    } else if (selectedSymbols.length < 3) {
      setSelectedSymbols([...selectedSymbols, symbol]);
    }
    setSolution(null);
    setTwitchCommands([]);
  };

  const handleSolve = async () => {
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
      const response = await solvePianoKeys(round.id, bomb.id, currentModule.id, {
        input: { symbols: selectedSymbols },
      });
      setSolution(response.output);
      const command = generateTwitchCommand({
        moduleType: ModuleType.PIANO_KEYS,
        result: response.output,
      });
      setTwitchCommands([command]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve piano keys");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setSelectedSymbols([]);
    setSolution(null);
    setTwitchCommands([]);
    resetSolverState();
  };

  return (
    <SolverLayout>
      <SolverSection
        title="Symbols on the module"
        description={`Pick the three musical symbols shown. Selected: ${selectedSymbols.length}/3.`}
      >
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {SYMBOLS.map(({ symbol, unicode, label }) => {
            const isSelected = selectedSymbols.includes(symbol);
            const order = isSelected ? selectedSymbols.indexOf(symbol) + 1 : null;
            const disabled = isSolved || isLoading || (!isSelected && selectedSymbols.length >= 3);
            return (
              <button
                key={symbol}
                type="button"
                onClick={() => handleSymbolClick(symbol)}
                disabled={disabled}
                aria-pressed={isSelected}
                title={label}
                className={cn(
                  "relative flex h-24 flex-col items-center justify-center rounded-lg border-2 p-3 transition-colors",
                  isSelected
                    ? "border-ring bg-accent/15 text-foreground ring-2 ring-ring ring-offset-1 ring-offset-card"
                    : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
                  disabled && !isSelected && "cursor-not-allowed opacity-60",
                )}
              >
                {order != null && (
                  <span className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                    {order}
                  </span>
                )}
                <span className="text-3xl font-bold leading-none">{unicode}</span>
                <span className="mt-1.5 text-center text-xs">{label}</span>
              </button>
            );
          })}
        </div>
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={selectedSymbols.length !== 3}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Get solution"
      />

      <ErrorAlert error={error} />

      {solution && (
        <SolverSection
          title="Play these notes"
          description="Press each key in the numbered order."
        >
          <Keyboard notes={solution.notes} />
          <p className="mt-3 break-all text-center font-mono text-sm text-foreground">
            {solution.notes.map(getNoteDisplay).join(" → ")}
          </p>
        </SolverSection>
      )}

      {twitchCommands.length > 0 && <TwitchCommandDisplay command={twitchCommands} />}

      <SolverInstructions>
        Pick the three symbols that appear on the module. The solver maps them to a note sequence;
        press the highlighted keys in order.
      </SolverInstructions>
    </SolverLayout>
  );
}

function Keyboard({ notes }: { notes: PianoKeysNote[] }) {
  const firstIndex = (n: PianoKeysNote): number | null => {
    const i = notes.indexOf(n);
    return i === -1 ? null : i;
  };
  const countFor = (n: PianoKeysNote): number => notes.filter((x) => x === n).length;

  const WHITE_W = 56;
  const WHITE_GAP = 2;
  const BLACK_W = 36;
  const BLACK_H = 90;
  const WHITE_H = 140;
  const whiteCount = NOTES.filter((n) => !n.isBlack).length;
  const totalWidth = whiteCount * WHITE_W + (whiteCount - 1) * WHITE_GAP;

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-muted/20 p-3">
      <div
        className="relative mx-auto"
        style={{ height: `${WHITE_H}px`, width: `${totalWidth}px` }}
      >
        {/* White keys */}
        <div className="flex h-full">
          {NOTES.filter((n) => !n.isBlack).map(({ note }, idx) => {
            const first = firstIndex(note);
            const count = countFor(note);
            const highlighted = first !== null;
            return (
              <div
                key={note}
                className={cn(
                  "relative flex flex-col items-center justify-end rounded-b-md border transition-colors",
                  highlighted
                    ? "border-blue-600 bg-blue-500 text-white shadow-md"
                    : "border-border bg-card text-foreground",
                )}
                style={{
                  width: `${WHITE_W}px`,
                  height: `${WHITE_H}px`,
                  marginLeft: idx > 0 ? `${WHITE_GAP}px` : 0,
                }}
              >
                <div className="flex flex-col items-center pb-2 text-center leading-tight">
                  {highlighted && (
                    <span className="text-xs font-bold">
                      #{first! + 1}
                      {count > 1 ? ` +${count - 1}` : ""}
                    </span>
                  )}
                  <span className="text-sm font-bold">{getNoteDisplay(note)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Black keys */}
        {NOTES.filter((n) => n.isBlack).map(({ note, position }) => {
          const first = firstIndex(note);
          const count = countFor(note);
          const highlighted = first !== null;
          const left = Math.floor(position) * (WHITE_W + WHITE_GAP) + WHITE_W - BLACK_W / 2;
          return (
            <div
              key={note}
              className={cn(
                "absolute top-0 z-10 flex flex-col items-center justify-end rounded-b-md transition-colors",
                highlighted
                  ? "bg-blue-700 text-white shadow-md"
                  : "bg-foreground text-background",
              )}
              style={{ width: `${BLACK_W}px`, height: `${BLACK_H}px`, left: `${left}px` }}
            >
              <div className="flex flex-col items-center pb-1.5 text-center leading-tight">
                {highlighted && (
                  <span className="text-[0.65rem] font-bold">
                    #{first! + 1}
                    {count > 1 ? ` +${count - 1}` : ""}
                  </span>
                )}
                <span className="text-xs font-bold">{getNoteDisplay(note)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
