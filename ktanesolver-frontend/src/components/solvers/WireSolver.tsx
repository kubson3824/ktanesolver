import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveWires as solveWiresApi } from "../../services/wiresService";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { 
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverControls
} from "../common";

type WireColor = "RED" | "BLUE" | "BLACK" | "YELLOW" | "WHITE" | null;

interface WireSolverProps {
  bomb: BombEntity | null | undefined;
}

const WIRE_COLORS: { color: WireColor; display: string; className: string }[] = [
  { color: "RED", display: "Red", className: "bg-red-500" },
  { color: "BLUE", display: "Blue", className: "bg-blue-500" },
  { color: "BLACK", display: "Black", className: "bg-gray-900" },
  { color: "YELLOW", display: "Yellow", className: "bg-yellow-400" },
  { color: "WHITE", display: "White", className: "bg-white border border-gray-300" },
  { color: null, display: "Empty", className: "bg-transparent" },
];

export default function WireSolver({ bomb }: WireSolverProps) {
  const [wires, setWires] = useState<WireColor[]>(Array(6).fill(null));
  const [result, setResult] = useState<string>("");
  const [wireToCut, setWireToCut] = useState<number>(-1);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

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
    () => ({ wires, result, wireToCut, twitchCommand }),
    [wires, result, wireToCut, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: { wires?: WireColor[]; result?: string; wireToCut?: number; twitchCommand?: string }) => {
      if (state.wires && Array.isArray(state.wires)) setWires(state.wires);
      if (state.result !== undefined) setResult(state.result);
      if (state.wireToCut !== undefined) setWireToCut(state.wireToCut);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (solution: { instruction: string; wirePosition: number }) => {
      if (!solution) return;

      setResult(solution.instruction);
      setWireToCut(solution.wirePosition);

      const command = generateTwitchCommand({
        moduleType: ModuleType.WIRES,
        result: {
          instruction: solution.instruction,
          wirePosition: solution.wirePosition,
        },
      });
      setTwitchCommand(command);
    },
  []);

  useSolverModulePersistence<
    { wires: WireColor[]; result: string; wireToCut: number; twitchCommand: string },
    { instruction: string; wirePosition: number }
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; instruction?: unknown; wirePosition?: unknown };
        if (anyRaw.output && typeof anyRaw.output === "object") return anyRaw.output as { instruction: string; wirePosition: number };
        if (typeof anyRaw.instruction === "string" && typeof anyRaw.wirePosition === "number") {
          return { instruction: anyRaw.instruction, wirePosition: anyRaw.wirePosition };
        }
      }
      return null;
    },
    inferSolved: (_sol, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solveWires = async () => {
    const activeWires = wires.filter((w) => w !== null);
    const wireCount = activeWires.length;

    if (wireCount < 3 || wireCount > 6) {
      setError("Invalid number of wires (must be 3-6)");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const wireColors: ("RED" | "BLUE" | "BLACK" | "YELLOW" | "WHITE")[] = activeWires.filter((w): w is "RED" | "BLUE" | "BLACK" | "YELLOW" | "WHITE" => w !== null);
      const response = await solveWiresApi(round.id, bomb.id, currentModule.id, {input: {wires: wireColors}});

      setResult(response.output.instruction);
      setWireToCut(response.output.wirePosition);
      setIsSolved(true);

      // Generate Twitch command
      const command = generateTwitchCommand({
        moduleType: ModuleType.WIRES,
        result: response.output,
      });
      setTwitchCommand(command);

      markModuleSolved(bomb.id, currentModule.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve wires");
    } finally {
      setIsLoading(false);
    }
  };

  const cycleWireColor = (index: number) => {
    const currentColor = wires[index];
    const currentIndex = WIRE_COLORS.findIndex((w) => w.color === currentColor);
    const nextIndex = (currentIndex + 1) % WIRE_COLORS.length;
    const newWires = [...wires];
    newWires[index] = WIRE_COLORS[nextIndex].color;
    setWires(newWires);
    setIsSolved(false);
    setResult("");
    setWireToCut(-1);
    setError("");
  };


    return (
        <SolverLayout>
          {/* Bomb module visualization */}
          <div className="bg-gray-800 rounded-lg p-6 mb-4">
            <div className="space-y-3">
              {wires.map((wire, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {/* Left port */}
                    <div className="w-4 h-4 bg-gray-600 rounded-full border-2 border-gray-500"></div>

                    {/* Wire */}
                    <button
                        onClick={() => cycleWireColor(index)}
                        className={`flex-1 h-8 rounded transition-all duration-200 ${
                            wire
                                ? WIRE_COLORS.find((w) => w.color === wire)?.className || ""
                                : "bg-gray-700 hover:bg-gray-600"
                        } ${wire ? "shadow-lg" : ""} ${
                            isSolved && wireToCut === index
                                ? "ring-4 ring-green-400 ring-opacity-75"
                                : ""
                        }`}
                        disabled={isSolved}
                    >
                      {wire && (
                          <span
                              className={`text-xs font-medium ${wire === 'WHITE' || wire === 'YELLOW' ? 'text-black' : 'text-white'}`}>
                    {index + 1}{index === 0 ? "st" : index === 1 ? "nd" : index === 2 ? "rd" : "th"}
                  </span>
                      )}
                    </button>

                    {/* Right port */}
                    <div className="w-4 h-4 bg-gray-600 rounded-full border-2 border-gray-500"></div>

                    {/* Wire number label */}
                    <span className="text-gray-400 text-sm w-12">
                {index + 1}{index === 0 ? "st" : index === 1 ? "nd" : index === 2 ? "rd" : "th"}
              </span>
                  </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <SolverControls
              onSolve={solveWires}
              onReset={resetSolverState}
              isSolveDisabled={wires.filter((w) => w !== null).length < 3}
              isLoading={isLoading}
              solveText="Solve Wires"
          />

          {/* Error */}
          <ErrorAlert error={error}/>

          {/* Result */}
          {result && (
              <div className="alert alert-success mb-4">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                  <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-bold">{result}</span>
              </div>
          )}

          {/* Twitch Command */}
          <TwitchCommandDisplay command={twitchCommand}/>

          {/* Instructions */}
          <div className="text-sm text-base-content/60">
            <p className="mb-2">Click on each wire slot to cycle through colors:</p>
            <div className="flex flex-wrap gap-2">
              {WIRE_COLORS.filter((w) => w.color !== null).map((wire) => (
                  <div key={wire.color} className="flex items-center gap-1">
                    <div className={`w-4 h-4 rounded ${wire.className}`}></div>
                    <span className="text-xs">{wire.display}</span>
                  </div>
              ))}
            </div>
          </div>
        </SolverLayout>
    );
  }
