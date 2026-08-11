import { useCallback, useMemo, useState } from "react";
import { solveThreeDTunnels, type ThreeDTunnelsOutput } from "../../services/threeDTunnelsService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const SYMBOLS = [..."ghidefabcpqrmnojklyz.vwxstu"];
type Walls = { front: boolean; left: boolean; right: boolean; up: boolean; down: boolean };
const EMPTY_WALLS: Walls = { front: false, left: false, right: false, up: false, down: false };

export default function ThreeDTunnelsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [currentSymbol, setCurrentSymbol] = useState("");
  const [targetSymbol, setTargetSymbol] = useState("g");
  const [walls, setWalls] = useState<Walls>(EMPTY_WALLS);
  const [restartTracking, setRestartTracking] = useState(true);
  const [result, setResult] = useState<ThreeDTunnelsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ currentSymbol, targetSymbol, walls, restartTracking, result, twitchCommand }), [currentSymbol, targetSymbol, walls, restartTracking, result, twitchCommand]);
  useSolverModulePersistence<typeof state, ThreeDTunnelsOutput>({ state,
    onRestoreState: useCallback((saved) => { if (saved.currentSymbol !== undefined) setCurrentSymbol(saved.currentSymbol); if (saved.targetSymbol) setTargetSymbol(saved.targetSymbol); if (saved.walls) setWalls(saved.walls); if (saved.restartTracking !== undefined) setRestartTracking(saved.restartTracking); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []),
    onRestoreSolution: useCallback((solution: ThreeDTunnelsOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.THREE_D_TUNNELS, result: solution })); }, []), currentModule, setIsSolved,
  });
  const changed = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const input = { currentSymbol, targetSymbol, frontWall: walls.front, leftWall: walls.left, rightWall: walls.right, upWall: walls.up, downWall: walls.down, restartTracking };
      const response = await solveThreeDTunnels(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.THREE_D_TUNNELS, result: response.output });
      setResult(response.output); setTwitchCommand(command); setRestartTracking(false); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, restartTracking: false, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve 3D Tunnels"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setCurrentSymbol(""); setTargetSymbol("g"); setWalls(EMPTY_WALLS); setRestartTracking(true); setResult(null); setTwitchCommand(""); resetSolverState(); };

  return <SolverLayout>
    <SolverSection title="Visible symbols"><div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium">Current node<select aria-label="Current node symbol" value={currentSymbol} onChange={(event) => { setCurrentSymbol(event.target.value); changed(); }} disabled={isLoading || isSolved} className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3"><option value="">No symbol shown</option>{SYMBOLS.map((symbol) => <option key={symbol}>{symbol}</option>)}</select></label>
      <label className="text-sm font-medium">Goal node<select aria-label="Goal node symbol" value={targetSymbol} onChange={(event) => { setTargetSymbol(event.target.value); changed(); }} disabled={isLoading || isSolved} className="mt-1 h-11 w-full rounded-md border border-input bg-background px-3">{SYMBOLS.map((symbol) => <option key={symbol}>{symbol}</option>)}</select></label>
    </div></SolverSection>
    <SolverSection title="Current tunnel view"><div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{(["front", "left", "right", "up", "down"] as const).map((direction) => <label key={direction} className="flex items-center gap-2 rounded-md border border-input p-3 text-sm capitalize"><input type="checkbox" aria-label={`${direction} wall`} checked={walls[direction]} onChange={(event) => { setWalls({ ...walls, [direction]: event.target.checked }); changed(); }} disabled={isLoading || isSolved} />{direction} wall</label>)}</div></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find safe route" />
    <ErrorAlert error={error} />
    {result && <SolverSection title={result.localizationStep ? "Localization move" : `Stage ${result.stage} route`} className="border-emerald-500/40">
      <p className="text-2xl font-bold">{result.actions.join(" → ")}</p>
      {result.localizationStep && <p className="mt-2 text-sm text-muted-foreground">{result.candidateCount} orientations remain. Perform this safe move, then replace the symbol and five wall observations.</p>}
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Mark every visible wall and enter the current symbol only when it appears. Follow a localization move, then update the observation. A full route ends with SUBMIT; after stages 1 and 2, replace the goal symbol and current view. Use Reset if the physical path diverges after a strike.</SolverInstructions>
  </SolverLayout>;
}
