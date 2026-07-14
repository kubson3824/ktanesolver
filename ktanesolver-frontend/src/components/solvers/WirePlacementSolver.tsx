import { useCallback, useMemo, useState } from "react";

import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import {
  solveWirePlacement,
  type WirePlacementColor,
  type WirePlacementOutput,
  type WirePlacementWire,
} from "../../services/wirePlacementService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ColorSwatchPicker,
  ErrorAlert,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverSection,
  TwitchCommandDisplay,
  useSolver,
  useSolverModulePersistence,
  type ColorSwatchOption,
} from "../common";

interface Props { bomb: BombEntity | null | undefined }
type DraftWire = { from: string; to: string; color: WirePlacementColor | null };

const COORDINATES = ["A1", "B1", "C1", "D1", "A2", "B2", "C2", "D2", "A3", "B3", "C3", "D3", "A4", "B4", "C4", "D4"];
const EMPTY_WIRES = (): DraftWire[] => Array.from({ length: 8 }, () => ({ from: "", to: "", color: null }));
const COLORS: ReadonlyArray<ColorSwatchOption<WirePlacementColor>> = [
  { value: "BLACK", label: "Black", swatch: "bg-neutral-900 border border-neutral-500" },
  { value: "BLUE", label: "Blue", swatch: "bg-blue-500" },
  { value: "RED", label: "Red", swatch: "bg-red-500" },
  { value: "WHITE", label: "White", swatch: "bg-white border border-border" },
  { value: "YELLOW", label: "Yellow", swatch: "bg-yellow-400" },
];
const COLOR_LABEL = Object.fromEntries(COLORS.map(({ value, label }) => [value, label])) as Record<WirePlacementColor, string>;

export default function WirePlacementSolver({ bomb }: Props) {
  const [wires, setWires] = useState<DraftWire[]>(EMPTY_WIRES);
  const [result, setResult] = useState<WirePlacementOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const solver = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ wires, result, twitchCommand }), [wires, result, twitchCommand]);

  const restoreState = useCallback((saved: Partial<typeof state>) => {
    if (Array.isArray(saved.wires) && saved.wires.length === 8) setWires(saved.wires);
    if (saved.result !== undefined) setResult(saved.result);
    if (saved.twitchCommand !== undefined) setTwitchCommand(saved.twitchCommand);
  }, []);
  const restoreSolution = useCallback((solution: WirePlacementOutput) => {
    setResult(solution);
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.WIRE_PLACEMENT, result: solution }));
  }, []);

  useSolverModulePersistence<typeof state, WirePlacementOutput>({
    state,
    onRestoreState: restoreState,
    onRestoreSolution: restoreSolution,
    extractSolution: (raw) => raw && typeof raw === "object" && Array.isArray((raw as WirePlacementOutput).cutWires) ? raw as WirePlacementOutput : null,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule: solver.currentModule,
    setIsSolved: solver.setIsSolved,
  });

  const updateWire = (index: number, patch: Partial<DraftWire>) => {
    setWires((current) => current.map((wire, i) => i === index ? { ...wire, ...patch } : wire));
  };

  const solve = async () => {
    if (!solver.round?.id || !bomb?.id || !solver.currentModule?.id) return solver.setError("Missing round, bomb, or module.");
    if (wires.some((wire) => !wire.from || !wire.to || !wire.color)) return solver.setError("Enter both endpoints and a color for all 8 wires.");
    solver.setIsLoading(true);
    solver.clearError();
    try {
      const enteredWires = wires as WirePlacementWire[];
      const { output } = await solveWirePlacement(solver.round.id, bomb.id, solver.currentModule.id, enteredWires);
      const command = generateTwitchCommand({ moduleType: ModuleType.WIRE_PLACEMENT, result: output });
      setResult(output);
      setTwitchCommand(command);
      solver.setIsSolved(true);
      solver.markModuleSolved(bomb.id, solver.currentModule.id);
      updateModuleAfterSolve(bomb.id, solver.currentModule.id, { wires, result: output, twitchCommand: command }, output, true);
    } catch (error) {
      solver.setError(error instanceof Error ? error.message : "Solve failed.");
    } finally {
      solver.setIsLoading(false);
    }
  };

  const reset = () => {
    setWires(EMPTY_WIRES());
    setResult(null);
    setTwitchCommand("");
    solver.reset();
  };

  return (
    <SolverLayout>
      <SolverSection title="Wire grid" description="Enter the two adjacent grid coordinates joined by each wire.">
        <div className="grid gap-2">
          {wires.map((wire, index) => (
            <div key={index} className="grid items-center gap-2 rounded-md border p-2 sm:grid-cols-[4rem_1fr_1fr_2fr]">
              <span className="text-sm font-semibold">Wire {index + 1}</span>
              {(["from", "to"] as const).map((endpoint) => (
                <select
                  key={endpoint}
                  value={wire[endpoint]}
                  onChange={(event) => updateWire(index, { [endpoint]: event.target.value })}
                  disabled={solver.isLoading || solver.isSolved}
                  aria-label={`Wire ${index + 1} ${endpoint} coordinate`}
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                >
                  <option value="">{endpoint === "from" ? "From" : "To"}</option>
                  {COORDINATES.map((coordinate) => <option key={coordinate}>{coordinate}</option>)}
                </select>
              ))}
              <ColorSwatchPicker
                value={wire.color}
                options={COLORS}
                onChange={(color) => updateWire(index, { color })}
                disabled={solver.isLoading || solver.isSolved}
                size="sm"
                ariaLabel={`Wire ${index + 1} color`}
                className="flex-wrap"
              />
            </div>
          ))}
        </div>
      </SolverSection>

      <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={wires.some((wire) => !wire.from || !wire.to || !wire.color)} isLoading={solver.isLoading} isSolved={solver.isSolved} solveText="Find wires to cut" />
      <ErrorAlert error={solver.error} />

      {result && (
        <SolverSection title="Cut wires" className="border-emerald-500/40">
          <p className="text-sm text-muted-foreground">The wire connected to C3 is {COLOR_LABEL[result.referenceColor].toLowerCase()}.</p>
          {result.cutWires.length ? (
            <div className="mt-3 flex flex-wrap gap-2" aria-label={`Cut ${result.cutWires.map((wire) => wire.coordinate).join(", ")}`}>
              {result.cutWires.map((wire) => (
                <span key={wire.number} className="rounded-md bg-emerald-500/15 px-3 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  Wire {wire.number} ({COLOR_LABEL[wire.color]}) at {wire.coordinate}
                </span>
              ))}
            </div>
          ) : <p className="mt-3 font-semibold">No wires match; recheck the entered board.</p>}
        </SolverSection>
      )}
      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
      <SolverInstructions>Number the visible wires in any consistent order. Every coordinate A1–D4 must be used exactly once, and each wire must join two horizontally or vertically adjacent coordinates.</SolverInstructions>
    </SolverLayout>
  );
}
