import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import {
  solveCruelPianoKeys,
  type CruelPianoKeysSymbol,
  type CruelPianoKeysNote,
} from "../../services/cruelPianoKeysService";
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
import { Input } from "../ui/input";
import { cn } from "../../lib/cn";

interface CruelPianoKeysSolverProps {
  bomb: BombEntity | null | undefined;
}

const DOUBLE_BOW_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="38" height="42" viewBox="0 0 19 21.1" preserveAspectRatio="xMidYMid meet" shape-rendering="auto"><path d="M0 0v21h2.1V6.5h14.8V21.1h2.1V0H0"/></svg>';
const QUARTER_REST_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="105" viewBox="0 0 17.8 60" preserveAspectRatio="xMidYMid meet" shape-rendering="auto"><path d="M17.8 40.8c-2.8-4.5-8.5-9.4-8.5-13 0-2.4 2.1-6.1 6.4-11.3L3.7 0C2.9 1 2.5 4 2.5 9c0 0 5 5.9 5 9.5 0 3.5-2.3 7.3-7 11.6 5.3 6.5 8.2 9.6 10.3 12.9a8.8 8.8 0 0 0-4-1.2c-4.2 0-6.8 4-6.8 8 0 4.8 8.1 10.7 9.7 10.7.3 0 .5-.1.5-.4C7.4 49.2 6 46.7 6 44.3c0-3.1 2.6-4.9 6-4.9 1.9 0 3.9.5 5.8 1.4"/></svg>';

const SYMBOLS: {
  symbol: CruelPianoKeysSymbol;
  display: string;
  label: string;
  svg?: string;
}[] = [
  { symbol: "BREVE", display: "𝄺", label: "Breve" },
  { symbol: "DOUBLE_SHARP", display: "𝄪", label: "Double sharp" },
  { symbol: "DOWN_BOW", display: "𝆱", label: "Double bow", svg: DOUBLE_BOW_SVG },
  { symbol: "SIXTEENTH_REST", display: "𝄿", label: "16th rest" },
  { symbol: "QUARTER_REST", display: "𝄾", label: "Quarter rest", svg: QUARTER_REST_SVG },
  { symbol: "SHARP", display: "♯", label: "Sharp" },
  { symbol: "T", display: "T", label: "T" },
  { symbol: "U", display: "U", label: "U" },
  { symbol: "B", display: "B", label: "B" },
  { symbol: "C", display: "C", label: "C" },
  { symbol: "C_LOWER", display: "c", label: "c" },
  { symbol: "N", display: "n", label: "n" },
  { symbol: "M", display: "m", label: "m" },
  { symbol: "B_LOWER", display: "b", label: "b" },
];

const NOTES: { note: CruelPianoKeysNote; isBlack: boolean; position: number }[] = [
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

const getNoteDisplay = (note: CruelPianoKeysNote): string => note.replace("_SHARP", "♯");

function SymbolGlyph({ display, svg }: { display: string; svg?: string }) {
  if (svg) {
    return (
      <span
        className="inline-flex h-[1.6em] select-none items-center justify-center [&_svg]:h-full [&_svg]:w-auto [&_svg]:fill-current [&_svg]:stroke-current"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }
  return <span className="music-symbol inline-block select-none">{display}</span>;
}

export default function CruelPianoKeysSolver({ bomb }: CruelPianoKeysSolverProps) {
  const [selectedSymbols, setSelectedSymbols] = useState<CruelPianoKeysSymbol[]>([]);
  const [minutesRemaining, setMinutesRemaining] = useState<number | "">("");
  const [solution, setSolution] = useState<{ notes: CruelPianoKeysNote[] } | null>(null);
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

  const moduleState = useMemo(
    () => ({ selectedSymbols, minutesRemaining, solution, twitchCommands }),
    [selectedSymbols, minutesRemaining, solution, twitchCommands],
  );

  const onRestoreState = useCallback(
    (state: {
      selectedSymbols?: CruelPianoKeysSymbol[];
      input?: { symbols?: CruelPianoKeysSymbol[]; minutesRemaining?: number };
      solution?: typeof solution;
      twitchCommands?: string[];
    }) => {
      const symbols = state.selectedSymbols ?? state.input?.symbols;
      if (symbols && Array.isArray(symbols)) setSelectedSymbols(symbols);
      if (state.input?.minutesRemaining != null) setMinutesRemaining(state.input.minutesRemaining);
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
        moduleType: ModuleType.CRUEL_PIANO_KEYS,
        result: { notes: noteSequence, count: restored.notes.length },
      });
      setTwitchCommands([command]);
    }
  }, []);

  useSolverModulePersistence<
    {
      selectedSymbols: CruelPianoKeysSymbol[];
      minutesRemaining: number | "";
      solution: typeof solution;
      twitchCommands: string[];
    },
    NonNullable<typeof solution>
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as {
          output?: unknown;
          result?: unknown;
          solution?: unknown;
          notes?: unknown;
        };
        const candidate =
          (anyRaw.output && typeof anyRaw.output === "object" ? anyRaw.output : undefined) ??
          (anyRaw.solution && typeof anyRaw.solution === "object" ? anyRaw.solution : undefined) ??
          (anyRaw.result && typeof anyRaw.result === "object" ? anyRaw.result : undefined) ??
          raw;
        if (
          candidate &&
          typeof candidate === "object" &&
          Array.isArray((candidate as { notes?: unknown }).notes)
        ) {
          return candidate as NonNullable<typeof solution>;
        }
      }
      return null;
    },
    inferSolved: (_sol, currentModule) =>
      Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleSymbolClick = (symbol: CruelPianoKeysSymbol) => {
    if (isSolved || isLoading) return;
    clearError();
    if (selectedSymbols.includes(symbol)) {
      setSelectedSymbols(selectedSymbols.filter((s) => s !== symbol));
    } else if (selectedSymbols.length < 4) {
      setSelectedSymbols([...selectedSymbols, symbol]);
    }
    setSolution(null);
    setTwitchCommands([]);
  };

  const handleSolve = async () => {
    if (selectedSymbols.length !== 4) {
      setError("Please select exactly 4 symbols");
      return;
    }
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }
    setIsLoading(true);
    clearError();
    try {
      const input: { symbols: CruelPianoKeysSymbol[]; minutesRemaining?: number } = {
        symbols: selectedSymbols,
      };
      if (typeof minutesRemaining === "number") input.minutesRemaining = minutesRemaining;
      const response = await solveCruelPianoKeys(round.id, bomb.id, currentModule.id, { input });
      setSolution(response.output);
      const command = generateTwitchCommand({
        moduleType: ModuleType.CRUEL_PIANO_KEYS,
        result: response.output,
      });
      setTwitchCommands([command]);
      if (response.output?.notes?.length && bomb?.id && currentModule?.id) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Cruel Piano Keys");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setSelectedSymbols([]);
    setMinutesRemaining("");
    setSolution(null);
    setTwitchCommands([]);
    resetSolverState();
  };

  return (
    <SolverLayout>
      <SolverSection
        title="Symbols on the module"
        description={`Pick the four symbols shown. Selected: ${selectedSymbols.length}/4.`}
      >
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-7">
          {SYMBOLS.map(({ symbol, display, label, svg }) => {
            const isSelected = selectedSymbols.includes(symbol);
            const order = isSelected ? selectedSymbols.indexOf(symbol) + 1 : null;
            const disabled = isSolved || isLoading || (!isSelected && selectedSymbols.length >= 4);
            return (
              <button
                key={symbol}
                type="button"
                onClick={() => handleSymbolClick(symbol)}
                disabled={disabled}
                aria-pressed={isSelected}
                aria-label={label}
                title={label}
                className={cn(
                  "relative flex min-h-[72px] items-center justify-center rounded-lg border-2 p-2 transition-colors",
                  isSelected
                    ? "border-ring bg-accent/15 text-foreground ring-2 ring-ring ring-offset-1 ring-offset-card"
                    : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
                  disabled && !isSelected && "cursor-not-allowed opacity-60",
                )}
              >
                {order != null && (
                  <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                    {order}
                  </span>
                )}
                <SymbolGlyph display={display} svg={svg} />
              </button>
            );
          })}
        </div>
      </SolverSection>

      <SolverSection
        title="Bomb time (optional)"
        description="If the module's behaviour depends on remaining minutes, enter that here."
      >
        <div className="flex items-center gap-2">
          <label htmlFor="cruel-piano-mins" className="text-sm text-muted-foreground">
            Minutes remaining
          </label>
          <Input
            id="cruel-piano-mins"
            type="number"
            min={0}
            max={99}
            value={minutesRemaining === "" ? "" : minutesRemaining}
            onChange={(e) => {
              const v = e.target.value;
              setMinutesRemaining(v === "" ? "" : Math.max(0, parseInt(v, 10) || 0));
            }}
            disabled={isSolved}
            className="w-20 text-center"
          />
        </div>
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={selectedSymbols.length !== 4}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Get solution"
      />

      <ErrorAlert error={error} />

      {solution && (
        <SolverSection
          title="Play these notes"
          description={`${solution.notes.length}-note sequence — press each key in the numbered order.`}
        >
          <Keyboard notes={solution.notes} />
          <p className="mt-3 break-all text-center font-mono text-sm text-foreground">
            {solution.notes.map(getNoteDisplay).join(" → ")}
          </p>
        </SolverSection>
      )}

      {twitchCommands.length > 0 && <TwitchCommandDisplay command={twitchCommands} />}

      <SolverInstructions>
        Cruel Piano Keys uses a wider symbol set; the solver returns a 12-note sequence to perform.
      </SolverInstructions>
    </SolverLayout>
  );
}

function Keyboard({ notes }: { notes: CruelPianoKeysNote[] }) {
  const firstIndex = (n: CruelPianoKeysNote): number | null => {
    const i = notes.indexOf(n);
    return i === -1 ? null : i;
  };
  const countFor = (n: CruelPianoKeysNote): number => notes.filter((x) => x === n).length;

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
