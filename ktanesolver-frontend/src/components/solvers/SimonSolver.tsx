import { useCallback, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveSimon, type SimonColor } from "../../services/simonService";
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

interface SimonSolverProps {
  bomb: BombEntity | null | undefined;
}

interface ColorSpec {
  color: SimonColor;
  label: string;
  /** Base button color (dimmed). */
  base: string;
  /** Lit/active state. */
  lit: string;
  /** Chip bg for sequence list. */
  chip: string;
  /** Chip text. */
  chipText: string;
}

const COLORS: readonly ColorSpec[] = [
  {
    color: "BLUE",
    label: "Blue",
    base: "bg-blue-700 hover:bg-blue-600",
    lit: "bg-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.8)]",
    chip: "bg-blue-500/15 border-blue-500/40",
    chipText: "text-blue-700 dark:text-blue-300",
  },
  {
    color: "YELLOW",
    label: "Yellow",
    base: "bg-yellow-600 hover:bg-yellow-500",
    lit: "bg-yellow-300 shadow-[0_0_20px_rgba(253,224,71,0.8)]",
    chip: "bg-yellow-500/15 border-yellow-500/40",
    chipText: "text-yellow-700 dark:text-yellow-300",
  },
  {
    color: "GREEN",
    label: "Green",
    base: "bg-green-700 hover:bg-green-600",
    lit: "bg-green-400 shadow-[0_0_20px_rgba(74,222,128,0.8)]",
    chip: "bg-green-500/15 border-green-500/40",
    chipText: "text-green-700 dark:text-green-300",
  },
  {
    color: "RED",
    label: "Red",
    base: "bg-red-700 hover:bg-red-600",
    lit: "bg-red-400 shadow-[0_0_20px_rgba(248,113,113,0.8)]",
    chip: "bg-red-500/15 border-red-500/40",
    chipText: "text-red-700 dark:text-red-300",
  },
] as const;

function spec(color: SimonColor): ColorSpec {
  return COLORS.find((c) => c.color === color)!;
}

export default function SimonSolver({ bomb }: SimonSolverProps) {
  const [flashes, setFlashes] = useState<SimonColor[]>([]);
  const [presses, setPresses] = useState<SimonColor[]>([]);
  const [twitchCommands, setTwitchCommands] = useState<string[]>([]);
  const [activeFlash, setActiveFlash] = useState<number | null>(null);
  const [activePress, setActivePress] = useState<number | null>(null);
  const [manuallySolved, setManuallySolved] = useState(false);

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
    () => ({ flashes, presses, twitchCommands, manuallySolved }),
    [flashes, presses, twitchCommands, manuallySolved],
  );

  const onRestoreState = useCallback(
    (
      state:
        | {
            flashes?: SimonColor[];
            presses?: SimonColor[];
            twitchCommands?: string[];
            manuallySolved?: boolean;
          }
        | { input?: { flashes?: SimonColor[] } },
    ) => {
      if ("input" in state && state.input?.flashes) setFlashes(state.input.flashes);
      else if ("flashes" in state && Array.isArray(state.flashes)) setFlashes(state.flashes);
      if ("presses" in state && Array.isArray(state.presses)) setPresses(state.presses);
      if ("twitchCommands" in state && Array.isArray(state.twitchCommands))
        setTwitchCommands(state.twitchCommands);
      if ("manuallySolved" in state && state.manuallySolved !== undefined)
        setManuallySolved(state.manuallySolved);
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (restored: { presses?: SimonColor[]; manuallySolved?: boolean } | null) => {
      if (!restored) return;
      if (restored.presses) {
        setPresses(restored.presses);
        const commands = restored.presses.map((color) =>
          generateTwitchCommand({
            moduleType: ModuleType.SIMON_SAYS,
            result: { color },
          }),
        );
        setTwitchCommands(commands);
      }
      if (restored.manuallySolved !== undefined) setManuallySolved(restored.manuallySolved);
    },
    [],
  );

  useSolverModulePersistence<
    | {
        flashes: SimonColor[];
        presses: SimonColor[];
        twitchCommands: string[];
        manuallySolved: boolean;
      }
    | { input?: { flashes?: SimonColor[] } },
    { presses?: SimonColor[]; manuallySolved?: boolean } | null
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; presses?: unknown; manuallySolved?: unknown };
        if (Array.isArray(anyRaw.presses)) {
          return {
            presses: anyRaw.presses as SimonColor[],
            manuallySolved: Boolean(anyRaw.manuallySolved),
          };
        }
        if (anyRaw.output && typeof anyRaw.output === "object") {
          const out = anyRaw.output as { presses?: SimonColor[] };
          return { presses: out.presses, manuallySolved: Boolean(anyRaw.manuallySolved) };
        }
      }
      return null;
    },
    inferSolved: (_sol, currentModule) =>
      Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const recordFlash = (color: SimonColor) => {
    if (isSolved || isLoading) return;
    clearError();
    setFlashes([...flashes, color]);
    setPresses([]);
    setTwitchCommands([]);
    setManuallySolved(false);

    const colorIndex = COLORS.findIndex((c) => c.color === color);
    setActiveFlash(colorIndex);
    setTimeout(() => setActiveFlash(null), 280);
  };

  const removeFlash = (index: number) => {
    if (isSolved || isLoading) return;
    setFlashes(flashes.filter((_, i) => i !== index));
    setPresses([]);
    setTwitchCommands([]);
    clearError();
    setManuallySolved(false);
  };

  const handleCheckAnswer = async () => {
    if (flashes.length === 0) {
      setError("Record at least one flash first.");
      return;
    }
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();
    try {
      const response = await solveSimon(round.id, bomb.id, currentModule.id, {
        input: { flashes },
      });
      setPresses(response.output.presses);
      setTwitchCommands(
        response.output.presses.map((color) =>
          generateTwitchCommand({
            moduleType: ModuleType.SIMON_SAYS,
            result: { color },
          }),
        ),
      );
      // Animate the response sequence.
      response.output.presses.forEach((color, index) => {
        setTimeout(() => {
          const colorIndex = COLORS.findIndex((c) => c.color === color);
          setActivePress(colorIndex);
          setTimeout(() => setActivePress(null), 380);
        }, index * 560);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check Simon Says answer");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setFlashes([]);
    setPresses([]);
    setTwitchCommands([]);
    setActiveFlash(null);
    setActivePress(null);
    setManuallySolved(false);
    resetSolverState();
  };

  const handleManualSolve = () => {
    if (!bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }
    setIsSolved(true);
    setManuallySolved(true);
    markModuleSolved(bomb.id, currentModule.id);
  };

  return (
    <SolverLayout>
      <SolverSection
        title="Record flash sequence"
        description="Tap each color as it flashes on the module."
      >
        <div className="mx-auto grid max-w-[260px] grid-cols-2 gap-3">
          {COLORS.map((c, index) => {
            const isLit = activeFlash === index || activePress === index;
            return (
              <button
                key={c.color}
                type="button"
                onClick={() => recordFlash(c.color)}
                disabled={isSolved || isLoading}
                className={cn(
                  "aspect-square rounded-2xl border-2 border-black/10 transition-all duration-150",
                  isLit ? c.lit : c.base,
                  isLit && "scale-95",
                  isSolved && "cursor-not-allowed opacity-70",
                )}
                aria-label={`Record ${c.label} flash`}
              >
                <span className="sr-only">{c.label}</span>
              </button>
            );
          })}
        </div>

        {flashes.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Sequence ({flashes.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {flashes.map((color, index) => {
                const s = spec(color);
                return (
                  <span
                    key={`${color}-${index}`}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold",
                      s.chip,
                      s.chipText,
                    )}
                  >
                    <span className="tabular-nums text-muted-foreground">{index + 1}.</span>
                    {s.label}
                    {!isSolved && !isLoading && (
                      <button
                        type="button"
                        onClick={() => removeFlash(index)}
                        aria-label={`Remove flash ${index + 1}`}
                        className="ml-0.5 inline-flex rounded text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </SolverSection>

      {presses.length > 0 && (
        <SolverSection
          title="Press sequence"
          description="Press these colors on the module in this exact order."
          className="border-emerald-500/40"
        >
          <ol className="flex flex-wrap gap-1.5">
            {presses.map((color, index) => {
              const s = spec(color);
              return (
                <li
                  key={`${color}-${index}`}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold",
                    s.chip,
                    s.chipText,
                  )}
                >
                  <span className="tabular-nums text-muted-foreground">{index + 1}.</span>
                  {s.label}
                </li>
              );
            })}
          </ol>
          <TwitchCommandDisplay command={twitchCommands} className="mt-3" />
        </SolverSection>
      )}

      <SolverControls
        onSolve={handleCheckAnswer}
        onReset={reset}
        onSolveManually={handleManualSolve}
        isSolveDisabled={flashes.length === 0}
        isManualSolveDisabled={isSolved}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Check answer"
        loadingText="Checking…"
        showManualSolve
      />

      <ErrorAlert error={error} />

      <SolverInstructions>
        Record each flash as it appears. The response depends on strikes and
        whether the serial number contains a vowel.
        {manuallySolved && (
          <span className="mt-1 block text-emerald-600 dark:text-emerald-400">
            Marked as solved manually.
          </span>
        )}
      </SolverInstructions>
    </SolverLayout>
  );
}
