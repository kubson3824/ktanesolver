import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveSimon, type SimonColor } from "../../services/simonService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { 
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverControls
} from "../common";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface SimonSolverProps {
  bomb: BombEntity | null | undefined;
}

const SIMON_COLORS: {
  color: SimonColor;
  display: string;
  className: string;
  lightClass: string;
  bgClass: string;
  textClass: string;
  position: string;
}[] = [
  {
    color: "BLUE",
    display: "Blue",
    className: "bg-blue-600 hover:bg-blue-500 border-blue-700",
    lightClass: "bg-blue-400 shadow-blue-400",
    bgClass: "bg-blue-900/30 border-blue-800",
    textClass: "text-blue-300",
    position: "TOP_LEFT"
  },
  {
    color: "YELLOW",
    display: "Yellow",
    className: "bg-yellow-500 hover:bg-yellow-400 border-yellow-600",
    lightClass: "bg-yellow-300 shadow-yellow-300",
    bgClass: "bg-yellow-900/30 border-yellow-800",
    textClass: "text-yellow-300",
    position: "TOP_RIGHT"
  },
  {
    color: "GREEN",
    display: "Green",
    className: "bg-green-600 hover:bg-green-500 border-green-700",
    lightClass: "bg-green-400 shadow-green-400",
    bgClass: "bg-green-900/30 border-green-800",
    textClass: "text-green-300",
    position: "BOTTOM_LEFT"
  },
  {
    color: "RED",
    display: "Red",
    className: "bg-red-600 hover:bg-red-500 border-red-700",
    lightClass: "bg-red-400 shadow-red-400",
    bgClass: "bg-red-900/30 border-red-800",
    textClass: "text-red-300",
    position: "BOTTOM_RIGHT"
  }
];

function getColorConfig(color: SimonColor) {
  return SIMON_COLORS.find((c) => c.color === color);
}


export default function SimonSolver({ bomb }: SimonSolverProps) {
  const [flashes, setFlashes] = useState<SimonColor[]>([]);
  const [presses, setPresses] = useState<SimonColor[]>([]);
  const [twitchCommands, setTwitchCommands] = useState<string[]>([]);
  const [activeFlash, setActiveFlash] = useState<number | null>(null);
  const [activePress, setActivePress] = useState<number | null>(null);
  const [manuallySolved, setManuallySolved] = useState(false);

  // Use the common solver hook for shared state
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
    (state: { flashes?: SimonColor[]; presses?: SimonColor[]; twitchCommands?: string[]; manuallySolved?: boolean } | { input?: { flashes?: SimonColor[] } }) => {
      if ("input" in state && state.input?.flashes) {
        setFlashes(state.input.flashes);
      } else if ("flashes" in state && Array.isArray(state.flashes)) {
        setFlashes(state.flashes);
      }
      if ("presses" in state && Array.isArray(state.presses)) {
        setPresses(state.presses);
      }
      if ("twitchCommands" in state && Array.isArray(state.twitchCommands)) {
        setTwitchCommands(state.twitchCommands);
      }
      if ("manuallySolved" in state && state.manuallySolved !== undefined) {
        setManuallySolved(state.manuallySolved);
      }
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (restored: { presses?: SimonColor[]; manuallySolved?: boolean } | null) => {
      if (!restored) return;
      if (restored.presses) {
        setPresses(restored.presses);
        
        // Regenerate Twitch commands from the presses
        const commands = restored.presses.map((color: SimonColor) => {
          return generateTwitchCommand({
            moduleType: ModuleType.SIMON_SAYS,
            result: { color: color },
          });
        });
        setTwitchCommands(commands);
      }
      if (restored.manuallySolved !== undefined) setManuallySolved(restored.manuallySolved);
    },
  []);

  useSolverModulePersistence<
    { flashes: SimonColor[]; presses: SimonColor[]; twitchCommands: string[]; manuallySolved: boolean } | { input?: { flashes?: SimonColor[] } },
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

  const handleColorClick = (color: SimonColor) => {
    if (isSolved || isLoading) return;
    
    clearError();
    setFlashes([...flashes, color]);
    setPresses([]);
    setTwitchCommands([]);
    setManuallySolved(false);
    
    // Flash animation - light up the button that was clicked
    const colorIndex = SIMON_COLORS.findIndex(c => c.color === color);
    setActiveFlash(colorIndex);
    setTimeout(() => setActiveFlash(null), 300);
  };

  const handleRemoveFlash = (index: number) => {
    if (isSolved || isLoading) return;
    
    const newFlashes = flashes.filter((_, i) => i !== index);
    setFlashes(newFlashes);
    setPresses([]);
    setTwitchCommands([]);
    clearError();
    setManuallySolved(false);
  };

  const handleCheckAnswer = async () => {
    if (flashes.length === 0) {
      setError("Please add at least one flash color");
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
        input: {
          flashes: flashes
        }
      });

      setPresses(response.output.presses);
      
      // Generate Twitch commands for each press in sequence
      const commands = response.output.presses.map((color: SimonColor) => {
        return generateTwitchCommand({
          moduleType: ModuleType.SIMON_SAYS,
          result: { color: color },
        });
      });
      setTwitchCommands(commands);
      
      // Animate the press sequence after checking
      if (response.output.presses.length > 0) {
        response.output.presses.forEach((color: SimonColor, index: number) => {
          setTimeout(() => {
            const colorIndex = SIMON_COLORS.findIndex(c => c.color === color);
            setActivePress(colorIndex);
            setTimeout(() => setActivePress(null), 400);
          }, index * 600);
        });
      }
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
      {/* 1. Record flash order */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-base-content">
            Record flash order
          </CardTitle>
          <p className="text-sm text-base-content/60">
            Tap each color in the order the module flashes.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 max-w-[240px] mx-auto">
            {SIMON_COLORS.map((color, index) => {
              const isFlashActive = activeFlash === index;
              const isPressActive = activePress === index;
              const isActive = isFlashActive || isPressActive;
              return (
                <button
                  key={color.color}
                  type="button"
                  className={`min-h-[72px] rounded-xl border-2 transition-all duration-200 flex items-center justify-center ${
                    isActive ? `${color.lightClass} shadow-lg scale-[0.98]` : color.className
                  } ${isSolved ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
                  onClick={() => handleColorClick(color.color)}
                  disabled={isSolved || isLoading}
                >
                  <span className="text-white font-semibold text-base drop-shadow-sm">
                    {color.display}
                  </span>
                </button>
              );
            })}
          </div>

          {flashes.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-base-content/80">
                Your sequence ({flashes.length} flash{flashes.length !== 1 ? "es" : ""})
              </p>
              <div className="flex flex-wrap gap-2">
                {flashes.map((color, index) => {
                  const config = getColorConfig(color);
                  return (
                    <div
                      key={`${color}-${index}`}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config?.bgClass ?? ""}`}
                    >
                      <span className="text-xs font-medium text-base-content/60">
                        {index + 1}
                      </span>
                      <span className={`font-semibold text-sm ${config?.textClass ?? ""}`}>
                        {color}
                      </span>
                      {!isSolved && !isLoading && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFlash(index)}
                          className="ml-0.5 p-0.5 rounded text-base-content/50 hover:text-error hover:bg-error/10 transition-colors"
                          aria-label={`Remove flash ${index + 1}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Solution */}
      {presses.length > 0 && (
        <Card className="mb-4 border-success/30 bg-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-success">
              Press in this order
            </CardTitle>
            <p className="text-sm text-base-content/70">
              Respond with these colors in sequence.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="flex flex-wrap gap-2 list-none p-0 m-0">
              {presses.map((color, index) => {
                const config = getColorConfig(color);
                return (
                  <li
                    key={`${color}-${index}`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-base-200 border border-base-300"
                  >
                    <span className="text-sm font-bold text-success tabular-nums">
                      {index + 1}.
                    </span>
                    <span className={`font-semibold text-sm ${config?.textClass ?? ""}`}>
                      {color}
                    </span>
                  </li>
                );
              })}
            </ol>
            <TwitchCommandDisplay command={twitchCommands} className="mt-1" />
          </CardContent>
        </Card>
      )}

      <SolverControls
        onSolve={handleCheckAnswer}
        onReset={reset}
        onSolveManually={handleManualSolve}
        isSolveDisabled={flashes.length === 0}
        isManualSolveDisabled={isSolved}
        isLoading={isLoading}
        solveText="Check Answer"
        loadingText="Checking..."
        showManualSolve={true}
      />

      <ErrorAlert error={error} />

      <Card className="mt-4 border-base-300/50">
        <CardContent className="pt-4">
          <p className="text-sm text-base-content/60 mb-2">
            Click the colored buttons in the order they flash. The solution depends on strikes and whether the serial number contains a vowel.
          </p>
          {manuallySolved && (
            <p className="text-sm text-success font-medium">
              This module was marked as solved manually.
            </p>
          )}
        </CardContent>
      </Card>
    </SolverLayout>
  );
}
