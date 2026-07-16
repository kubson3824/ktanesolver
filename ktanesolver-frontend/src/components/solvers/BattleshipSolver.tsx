import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { cn } from "../../lib/cn";
import { solveBattleship, type BattleshipOutput } from "../../services/battleshipService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Input } from "../ui/input";

const EMPTY_FIVE = [0, 0, 0, 0, 0];
const EMPTY_FOUR = [0, 0, 0, 0];
const COLUMNS = ["A", "B", "C", "D", "E"];

type SavedState = {
  rowCounts?: number[];
  columnCounts?: number[];
  shipCounts?: number[];
  safeLocations?: string[];
  scannedLocations?: string[];
  radarShips?: string[] | null;
  result?: BattleshipOutput | null;
  twitchCommand?: string;
  input?: Pick<SavedState, "rowCounts" | "columnCounts" | "shipCounts" | "radarShips">;
};

export default function BattleshipSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [rowCounts, setRowCounts] = useState(EMPTY_FIVE);
  const [columnCounts, setColumnCounts] = useState(EMPTY_FIVE);
  const [shipCounts, setShipCounts] = useState(EMPTY_FOUR);
  const [safeLocations, setSafeLocations] = useState<string[]>([]);
  const [scannedLocations, setScannedLocations] = useState<string[]>([]);
  const [radarShips, setRadarShips] = useState<string[]>([]);
  const [result, setResult] = useState<BattleshipOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo<SavedState>(() => ({
    rowCounts, columnCounts, shipCounts, safeLocations, scannedLocations, radarShips, result, twitchCommand,
  }), [rowCounts, columnCounts, shipCounts, safeLocations, scannedLocations, radarShips, result, twitchCommand]);

  useSolverModulePersistence<SavedState, BattleshipOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      const input = saved.input ?? saved;
      if (input.rowCounts?.length === 5) setRowCounts(input.rowCounts);
      if (input.columnCounts?.length === 5) setColumnCounts(input.columnCounts);
      if (input.shipCounts?.length === 4) setShipCounts(input.shipCounts);
      if (saved.safeLocations) setSafeLocations(saved.safeLocations);
      if (saved.scannedLocations) setScannedLocations(saved.scannedLocations);
      if (input.radarShips) setRadarShips(input.radarShips);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: BattleshipOutput) => {
      setSafeLocations(solution.safeLocations ?? []);
      if (solution.shipLocations?.length) {
        setResult(solution);
        setTwitchCommand(`torpedo ${solution.shipLocations.join(" ")}`);
      }
    }, []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const changeCount = (setter: Dispatch<SetStateAction<number[]>>, index: number, value: number) => {
    setter((counts) => counts.map((count, i) => i === index ? Math.max(0, Math.min(5, value || 0)) : count));
    setSafeLocations([]); setScannedLocations([]); setRadarShips([]); setResult(null); setTwitchCommand(""); clearError();
  };

  const cycleRadar = (location: string) => {
    if (!scannedLocations.includes(location)) {
      setScannedLocations((current) => [...current, location]);
    } else if (!radarShips.includes(location)) {
      setRadarShips((current) => [...current, location]);
    } else {
      setScannedLocations((current) => current.filter((item) => item !== location));
      setRadarShips((current) => current.filter((item) => item !== location));
    }
    clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const input = { rowCounts, columnCounts, shipCounts, radarShips: safeLocations.length ? radarShips : null };
      const response = await solveBattleship(round.id, bomb.id, currentModule.id, input);
      const command = response.solved ? `torpedo ${response.output.shipLocations.join(" ")}` : "";
      setSafeLocations(response.output.safeLocations); setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, {
        ...input, safeLocations: response.output.safeLocations, scannedLocations, result: response.output, twitchCommand: command,
      }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Battleship"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, rowCounts, columnCounts, shipCounts, safeLocations.length, radarShips, scannedLocations, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setRowCounts(EMPTY_FIVE); setColumnCounts(EMPTY_FIVE); setShipCounts(EMPTY_FOUR);
    setSafeLocations([]); setScannedLocations([]); setRadarShips([]); setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  const totalShips = shipCounts.reduce((total, count) => total + count, 0);
  const radarComplete = safeLocations.every((location) => scannedLocations.includes(location));
  const shipSet = new Set(result?.shipLocations ?? []);

  return <SolverLayout>
    <SolverSection title="Edge counts" description="Enter the five column counts above the grid and the five row counts beside it.">
      <div className="grid grid-cols-5 gap-2">
        {columnCounts.map((count, index) => <label key={`column-${index}`} className="text-center text-xs font-medium">{COLUMNS[index]}
          <Input type="number" min={0} max={5} value={count} disabled={isLoading || isSolved} aria-label={`Column ${COLUMNS[index]} ship count`} onChange={(event) => changeCount(setColumnCounts, index, event.target.valueAsNumber)} className="mt-1 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
        </label>)}
        {rowCounts.map((count, index) => <label key={`row-${index}`} className="text-center text-xs font-medium">Row {index + 1}
          <Input type="number" min={0} max={5} value={count} disabled={isLoading || isSolved} aria-label={`Row ${index + 1} ship count`} onChange={(event) => changeCount(setRowCounts, index, event.target.valueAsNumber)} className="mt-1 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
        </label>)}
      </div>
    </SolverSection>
    <SolverSection title="Fleet" description="Enter how many ships of each displayed length are present.">
      <div className="grid grid-cols-4 gap-2">
        {shipCounts.map((count, index) => <label key={index} className="text-center text-xs font-medium">Length {index + 1}
          <Input type="number" min={0} max={5} value={count} disabled={isLoading || isSolved} aria-label={`Length ${index + 1} ship count`} onChange={(event) => changeCount(setShipCounts, index, event.target.valueAsNumber)} className="mt-1 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
        </label>)}
      </div>
    </SolverSection>
    {safeLocations.length > 0 && !isSolved && <SolverSection title="Safe radar cells" description="Scan every listed cell. Click once for water, twice for ship, and a third time to clear.">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {safeLocations.map((location) => {
          const scanned = scannedLocations.includes(location);
          const ship = radarShips.includes(location);
          return <button key={location} type="button" onClick={() => cycleRadar(location)} disabled={isLoading} aria-label={`${location}: ${!scanned ? "unknown" : ship ? "ship" : "water"}`} className={cn(
            "rounded-lg border-2 px-3 py-2 text-sm font-semibold",
            !scanned ? "border-border text-muted-foreground" : ship ? "border-amber-500 bg-amber-500/15" : "border-sky-500 bg-sky-500/15",
          )}>{location} · {!scanned ? "Unknown" : ship ? "Ship" : "Water"}</button>;
        })}
      </div>
    </SolverSection>}
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={totalShips === 0 || (safeLocations.length > 0 && !radarComplete)} solveText={safeLocations.length ? "Solve board" : "Show safe radar cells"} />
    <ErrorAlert error={error} />
    {isSolved && result && <SolverSection title="Torpedo every ship cell" className="border-emerald-500/40">
      <div className="grid grid-cols-5 gap-1" role="img" aria-label={`Ships at ${result.shipLocations.join(", ")}`}>
        {Array.from({ length: 25 }, (_, index) => {
          const location = `${COLUMNS[index % 5]}${Math.floor(index / 5) + 1}`;
          return <div key={location} className={cn("flex aspect-square items-center justify-center rounded border text-xs font-bold", shipSet.has(location) ? "border-emerald-500 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : "border-border bg-sky-500/10 text-muted-foreground")}>{shipSet.has(location) ? "●" : "·"}</div>;
        })}
      </div>
      <p className="mt-3 text-center font-mono text-sm">{result.shipLocations.join(" ")}</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Use radar only on the safe cells shown here. Report each scan, then fire torpedoes at every highlighted ship cell.</SolverInstructions>
  </SolverLayout>;
}
