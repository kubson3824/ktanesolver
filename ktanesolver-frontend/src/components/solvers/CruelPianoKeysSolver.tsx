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
  ErrorAlert,
  TwitchCommandDisplay,
  SolverControls,
} from "../common";

interface CruelPianoKeysSolverProps {
  bomb: BombEntity | null | undefined;
}

// Double bow – 10× viewBox/path for finer lines, auto rendering to avoid blocky edges
const DOUBLE_BOW_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="38" height="42" viewBox="0 0 19 21.1" preserveAspectRatio="xMidYMid meet" shape-rendering="auto"><path d="M0 0v21h2.1V6.5h14.8V21.1h2.1V0H0"/></svg>';
// Quarter rest – 10× viewBox/path; extra space at bottom so it sits higher in the button
const QUARTER_REST_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="105" viewBox="0 0 17.8 60" preserveAspectRatio="xMidYMid meet" shape-rendering="auto"><path d="M17.8 40.8c-2.8-4.5-8.5-9.4-8.5-13 0-2.4 2.1-6.1 6.4-11.3L3.7 0C2.9 1 2.5 4 2.5 9c0 0 5 5.9 5 9.5 0 3.5-2.3 7.3-7 11.6 5.3 6.5 8.2 9.6 10.3 12.9a8.8 8.8 0 0 0-4-1.2c-4.2 0-6.8 4-6.8 8 0 4.8 8.1 10.7 9.7 10.7.3 0 .5-.1.5-.4C7.4 49.2 6 46.7 6 44.3c0-3.1 2.6-4.9 6-4.9 1.9 0 3.9.5 5.8 1.4"/></svg>';

// Actual symbols from the manual (Unicode musical glyphs + letters); label is for tooltip only.
// Symbols with `svg` use custom SVG; others use .music-symbol (OpusStd) display.
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

const getNoteDisplay = (note: CruelPianoKeysNote): string => {
  return note.replace("_SHARP", "♯");
};

export default function CruelPianoKeysSolver({ bomb }: CruelPianoKeysSolverProps) {
  const [selectedSymbols, setSelectedSymbols] = useState<CruelPianoKeysSymbol[]>([]);
  const [minutesRemaining, setMinutesRemaining] = useState<number | "">("");
  const [solution, setSolution] = useState<{
    notes: CruelPianoKeysNote[];
  } | null>(null);
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

  const onRestoreSolution = useCallback(
    (restored: NonNullable<typeof solution>) => {
      if (restored && Array.isArray(restored.notes)) {
        setSolution(restored);
        const noteSequence = restored.notes.map(getNoteDisplay).join("-");
        const command = generateTwitchCommand({
          moduleType: ModuleType.CRUEL_PIANO_KEYS,
          result: {
            notes: noteSequence,
            count: restored.notes.length,
          },
        });
        setTwitchCommands([command]);
      }
    },
    [],
  );

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
      const response = await solveCruelPianoKeys(round.id, bomb.id, currentModule.id, {
        input,
      });
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
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h3 className="text-center text-gray-400 mb-4 text-sm font-medium">MODULE VIEW</h3>

        <div className="mb-6">
          <p className="text-center text-gray-400 mb-3 text-sm">
            Select the 4 symbols shown on the module:
          </p>
          <div className="grid grid-cols-5 gap-2 max-w-2xl mx-auto sm:grid-cols-7">
            {SYMBOLS.map(({ symbol, display, label, svg }) => {
              const isSelected = selectedSymbols.includes(symbol);
              return (
                <button
                  key={symbol}
                  onClick={() => handleSymbolClick(symbol)}
                  className={`relative transition-all duration-200 flex items-center justify-center ${
                    isSelected
                      ? "bg-blue-600 hover:bg-blue-500 text-white scale-105"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  } rounded-lg p-3 border-2 min-h-[72px] ${
                    isSelected ? "border-blue-400" : "border-gray-600"
                  }`}
                  disabled={
                    isSolved || isLoading || (!isSelected && selectedSymbols.length >= 4)
                  }
                  title={label}
                  aria-label={label}
                >
                  {svg ? (
                    <span
                      className="select-none inline-flex h-[1.6em] items-center justify-center [&_svg]:h-full [&_svg]:w-auto [&_svg]:fill-current [&_svg]:stroke-current"
                      dangerouslySetInnerHTML={{ __html: svg }}
                    />
                  ) : (
                    <span className="music-symbol select-none inline-block">
                      {display}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-center gap-4">
          <label className="text-gray-400 text-sm flex items-center gap-2">
            Minutes remaining (optional):
            <input
              type="number"
              min={0}
              max={99}
              value={minutesRemaining === "" ? "" : minutesRemaining}
              onChange={(e) => {
                const v = e.target.value;
                setMinutesRemaining(v === "" ? "" : Math.max(0, parseInt(v, 10) || 0));
              }}
              className="w-16 rounded bg-gray-700 border border-gray-600 text-white px-2 py-1 text-center"
            />
          </label>
        </div>

        {selectedSymbols.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-center text-gray-400 mb-2 text-sm">
              Selected ({selectedSymbols.length}/4):
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              {selectedSymbols.map((symbol, index) => {
                const { display, label, svg } = SYMBOLS.find((s) => s.symbol === symbol)!;
                return (
                  <div
                    key={index}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg border border-blue-400 flex items-center justify-center min-w-[3rem]"
                    title={label}
                  >
                    {svg ? (
                      <span
                        className="select-none inline-flex h-[1.6em] items-center justify-center [&_svg]:h-full [&_svg]:w-auto [&_svg]:fill-current [&_svg]:stroke-current"
                        dangerouslySetInnerHTML={{ __html: svg }}
                      />
                    ) : (
                      <span className="music-symbol select-none inline-block">
                        {display}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {solution && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <p className="text-center text-gray-400 mb-3 text-sm">
              Play these 12 notes in order:
            </p>
            <div className="relative bg-gray-900 p-6 rounded-lg">
              <div className="flex relative mx-auto" style={{ height: "160px", width: "441px" }}>
                {NOTES.filter((n) => !n.isBlack).map(({ note, position }) => {
                  const notePositions: number[] = [];
                  solution.notes.forEach((n, idx) => {
                    if (n === note) notePositions.push(idx);
                  });
                  const isHighlighted = notePositions.length > 0;
                  return (
                    <div
                      key={note}
                      className={`relative transition-all duration-300 flex flex-col items-center justify-end ${
                        isHighlighted
                          ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50"
                          : "bg-white text-gray-800 hover:bg-gray-100"
                      } border border-gray-400 rounded-b-lg cursor-pointer`}
                      style={{
                        width: "60px",
                        height: "140px",
                        marginLeft: position > 0 ? "3px" : "0",
                      }}
                    >
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-center">
                        {isHighlighted && (
                          <div
                            className={`text-sm font-bold mb-1 ${
                              isHighlighted ? "text-blue-100" : "text-blue-900"
                            }`}
                          >
                            #{notePositions[0] + 1}
                            {notePositions.length > 1
                              ? ` +${notePositions.length - 1}`
                              : ""}
                          </div>
                        )}
                        <div className="text-lg font-bold">{getNoteDisplay(note)}</div>
                      </div>
                    </div>
                  );
                })}
                {NOTES.filter((n) => n.isBlack).map(({ note, position }) => {
                  const notePositions: number[] = [];
                  solution.notes.forEach((n, idx) => {
                    if (n === note) notePositions.push(idx);
                  });
                  const isHighlighted = notePositions.length > 0;
                  return (
                    <div
                      key={note}
                      className={`absolute transition-all duration-300 flex flex-col items-center justify-end z-10 ${
                        isHighlighted
                          ? "bg-blue-700 text-white shadow-lg shadow-blue-700/50"
                          : "bg-gray-900 text-gray-300 hover:bg-gray-800"
                      } rounded-b-lg cursor-pointer`}
                      style={{
                        width: "40px",
                        height: "90px",
                        left: `${Math.floor(position) * 63 + 43}px`,
                      }}
                    >
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-center">
                        {isHighlighted && (
                          <div className="text-xs font-bold mb-1 text-blue-200">
                            #{notePositions[0] + 1}
                            {notePositions.length > 1
                              ? ` +${notePositions.length - 1}`
                              : ""}
                          </div>
                        )}
                        <div className="text-sm font-bold">{getNoteDisplay(note)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-400 mb-2">Note Sequence:</p>
              <p className="font-mono text-lg text-blue-400">
                {solution.notes.map(getNoteDisplay).join(" → ")}
              </p>
            </div>
            <TwitchCommandDisplay command={twitchCommands} className="mb-0" />
          </div>
        )}
      </div>

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={selectedSymbols.length !== 4}
        isLoading={isLoading}
        solveText="Get Solution"
      />
      <ErrorAlert error={error} />
      <div className="text-sm text-base-content/60">
        <p className="mb-2">Select the 4 symbols displayed on the Cruel Piano Keys module.</p>
        <p className="mb-2">The solution is a 12-note sequence to play in order.</p>
        <p>Follow the numbered sequence on the highlighted keys.</p>
      </div>
    </SolverLayout>
  );
}
