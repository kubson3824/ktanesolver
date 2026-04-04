import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveSimonStates, type SimonStatesColor } from "../../services/simonStatesService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverControls,
} from "../common";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface SimonStatesSolverProps {
  bomb: BombEntity | null | undefined;
}

interface StageResult {
  stage: number;
  flashes: SimonStatesColor[];
  press: SimonStatesColor;
}

const COLOR_CONFIG: {
  color: SimonStatesColor;
  display: string;
  btnClass: string;
  lightClass: string;
  bgClass: string;
  textClass: string;
}[] = [
  {
    color: "RED",
    display: "Red",
    btnClass: "bg-red-600 hover:bg-red-500 border-red-700",
    lightClass: "bg-red-400 shadow-red-400",
    bgClass: "bg-red-900/30 border-red-800",
    textClass: "text-red-300",
  },
  {
    color: "BLUE",
    display: "Blue",
    btnClass: "bg-blue-600 hover:bg-blue-500 border-blue-700",
    lightClass: "bg-blue-400 shadow-blue-400",
    bgClass: "bg-blue-900/30 border-blue-800",
    textClass: "text-blue-300",
  },
  {
    color: "GREEN",
    display: "Green",
    btnClass: "bg-green-600 hover:bg-green-500 border-green-700",
    lightClass: "bg-green-400 shadow-green-400",
    bgClass: "bg-green-900/30 border-green-800",
    textClass: "text-green-300",
  },
  {
    color: "YELLOW",
    display: "Yellow",
    btnClass: "bg-yellow-500 hover:bg-yellow-400 border-yellow-600",
    lightClass: "bg-yellow-300 shadow-yellow-300",
    bgClass: "bg-yellow-900/30 border-yellow-800",
    textClass: "text-yellow-300",
  },
];

// Module button layout: RED top-left, YELLOW top-right, GREEN bottom-left, BLUE bottom-right
const GRID_LAYOUT: SimonStatesColor[] = ["RED", "YELLOW", "GREEN", "BLUE"];

function cfg(color: SimonStatesColor) {
  return COLOR_CONFIG.find((c) => c.color === color)!;
}

export default function SimonStatesSolver({ bomb }: SimonStatesSolverProps) {
  const [topLeft, setTopLeft] = useState<SimonStatesColor | null>(null);
  const [flashes, setFlashes] = useState<Set<SimonStatesColor>>(new Set());
  const [currentStage, setCurrentStage] = useState(1);
  const [stageHistory, setStageHistory] = useState<StageResult[]>([]);
  const [result, setResult] = useState<SimonStatesColor | null>(null);
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
    () => ({ topLeft, currentStage, stageHistory, result, twitchCommands }),
    [topLeft, currentStage, stageHistory, result, twitchCommands]
  );

  const onRestoreState = useCallback(
    (state: unknown) => {
      const s = state as Record<string, unknown>;
      // Backend shape: { pressHistory: SimonStatesColor[], topLeft: SimonStatesColor }
      if (Array.isArray(s.pressHistory)) {
        const pressHistory = s.pressHistory as SimonStatesColor[];
        setCurrentStage(Math.min(pressHistory.length + 1, 4));
        if (typeof s.topLeft === "string") setTopLeft(s.topLeft as SimonStatesColor);
        // Can't reconstruct full history without flash data, so just set stage
        setStageHistory([]);
        setResult(null);
        setFlashes(new Set());
        return;
      }
      // Frontend-persisted shape
      if (typeof s.topLeft === "string") setTopLeft(s.topLeft as SimonStatesColor);
      if (typeof s.currentStage === "number") setCurrentStage(s.currentStage);
      if (Array.isArray(s.stageHistory)) setStageHistory(s.stageHistory as StageResult[]);
      if (typeof s.result === "string" || s.result === null) setResult(s.result as SimonStatesColor | null);
      if (Array.isArray(s.twitchCommands)) setTwitchCommands(s.twitchCommands as string[]);
    },
    []
  );

  const onRestoreSolution = useCallback((solution: { press: SimonStatesColor } | null) => {
    if (!solution) return;
    setResult(solution.press);
  }, []);

  useSolverModulePersistence<
    { topLeft: SimonStatesColor | null; currentStage: number; stageHistory: StageResult[]; result: SimonStatesColor | null; twitchCommands: string[] },
    { press: SimonStatesColor } | null
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const r = raw as { output?: { press?: SimonStatesColor }; press?: SimonStatesColor };
      if (r.output?.press) return { press: r.output.press };
      if (r.press) return { press: r.press };
      return null;
    },
    inferSolved: (_sol, currentModule) =>
      Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const toggleFlash = (color: SimonStatesColor) => {
    if (isSolved || isLoading) return;
    setFlashes((prev) => {
      const next = new Set(prev);
      if (next.has(color)) next.delete(color);
      else next.add(color);
      return next;
    });
    clearError();
    setResult(null);
  };

  const handleSolve = async () => {
    if (!topLeft) {
      setError("Select the top-left button colour first");
      return;
    }
    if (flashes.size === 0) {
      setError("Select at least one colour that flashed");
      return;
    }
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveSimonStates(round.id, bomb.id, currentModule.id, {
        input: {
          stage: currentStage,
          topLeft,
          flashes: Array.from(flashes),
        },
      });

      const press = response.output.press;
      setResult(press);

      const cmd = generateTwitchCommand({
        moduleType: ModuleType.SIMON_STATES,
        result: { press },
      });

      const newHistory: StageResult[] = [
        ...stageHistory,
        { stage: currentStage, flashes: Array.from(flashes), press },
      ];
      const newCommands = [...twitchCommands, cmd];

      setStageHistory(newHistory);
      setTwitchCommands(newCommands);

      if (response.solved) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
      } else {
        setCurrentStage(currentStage + 1);
        setFlashes(new Set());
        setResult(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Simon States");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setTopLeft(null);
    setFlashes(new Set());
    setCurrentStage(1);
    setStageHistory([]);
    setResult(null);
    setTwitchCommands([]);
    resetSolverState();
  };

  const topLeftLocked = currentStage > 1 || isSolved;

  return (
    <SolverLayout>
      {/* Top-left colour picker */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-base-content">
            Top-left button colour
          </CardTitle>
          <p className="text-sm text-base-content/60">
            Which colour is in the top-left position on the module?
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {COLOR_CONFIG.map((c) => {
              const selected = topLeft === c.color;
              return (
                <button
                  key={c.color}
                  type="button"
                  disabled={topLeftLocked}
                  onClick={() => setTopLeft(c.color)}
                  className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                    selected
                      ? `${c.lightClass} shadow-lg text-white border-transparent`
                      : `${c.btnClass} text-white`
                  } ${topLeftLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {c.display}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Stage progress */}
      <div className="bg-base-200 rounded-lg p-4 mb-4">
        <p className="text-center text-base-content/60 mb-2 text-xs font-medium uppercase tracking-wide">
          Stage progress
        </p>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                s < currentStage
                  ? "bg-green-600 text-white"
                  : s === currentStage
                  ? "bg-primary text-primary-content"
                  : "bg-base-300 text-base-content/40"
              }`}
            >
              {s < currentStage ? "✓" : s}
            </div>
          ))}
        </div>
      </div>

      {/* Flash selector */}
      {!isSolved && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-base-content">
              Stage {currentStage} — which colours flashed?
            </CardTitle>
            <p className="text-sm text-base-content/60">Toggle all colours that lit up.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 max-w-[240px] mx-auto">
              {GRID_LAYOUT.map((color) => {
                const c = cfg(color);
                const active = flashes.has(color);
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => toggleFlash(color)}
                    disabled={isLoading}
                    className={`min-h-[72px] rounded-xl border-2 transition-all duration-150 flex items-center justify-center ${
                      active
                        ? `${c.lightClass} shadow-lg scale-[0.98] border-transparent text-white`
                        : `${c.btnClass} text-white`
                    } ${isLoading ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                  >
                    <span className="font-semibold text-base drop-shadow-sm">{c.display}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current stage answer */}
      {result && !isSolved && (
        <Card className="mb-4 border-success/30 bg-success/5">
          <CardContent className="pt-4">
            <p className="text-sm text-base-content/70 mb-2">Press this colour:</p>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${cfg(result).bgClass}`}>
              <span className={`font-bold text-lg ${cfg(result).textClass}`}>{cfg(result).display}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={!topLeft || flashes.size === 0 || isSolved}
        isLoading={isLoading}
        solveText={isSolved ? "Solved" : `Solve Stage ${currentStage}`}
        loadingText="Solving..."
      />

      <ErrorAlert error={error} />

      {/* Stage history */}
      {stageHistory.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-base-content/70">Stage history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stageHistory.map((entry) => (
              <div
                key={entry.stage}
                className="flex flex-wrap items-center gap-2 bg-base-200 rounded-lg px-3 py-2 text-sm"
              >
                <span className="font-medium text-base-content/60 shrink-0">
                  Stage {entry.stage}
                </span>
                <span className="text-base-content/40 shrink-0">flashed:</span>
                <div className="flex gap-1 flex-wrap">
                  {entry.flashes.map((c) => (
                    <span
                      key={c}
                      className={`px-2 py-0.5 rounded text-xs font-semibold border ${cfg(c).bgClass} ${cfg(c).textClass}`}
                    >
                      {cfg(c).display}
                    </span>
                  ))}
                </div>
                <span className="text-base-content/40 shrink-0">→ press:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${cfg(entry.press).bgClass} ${cfg(entry.press).textClass}`}>
                  {cfg(entry.press).display}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {twitchCommands.length > 0 && (
        <TwitchCommandDisplay command={twitchCommands} className="mt-4" />
      )}
    </SolverLayout>
  );
}
