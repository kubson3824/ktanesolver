import { useState } from "react";
import { useRoundStore } from "../../store/useRoundStore";
import {
  SKINNY_WIRE_COLORS, solveSkinnyWires, type SkinnyWire, type SkinnyWireColor,
  type SkinnyWireLetterPort, type SkinnyWireNumberPort, type SkinnyWiresOutput,
} from "../../services/skinnyWiresService";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverResult,
  SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const initialWires = (): SkinnyWire[] => [
  { color: "RED", letterPort: "A", numberPort: 1 },
  { color: "BLACK", letterPort: "A", numberPort: 2 },
  { color: "WHITE", letterPort: "A", numberPort: 3 },
  { color: "GREEN", letterPort: "B", numberPort: 1 },
  { color: "ORANGE", letterPort: "B", numberPort: 2 },
];
const colorStyles: Record<SkinnyWireColor, string> = {
  BLACK: "#171717", BLUE: "#3b82f6", GREEN: "#22c55e", ORANGE: "#f97316",
  PINK: "#ec4899", RED: "#ef4444", WHITE: "#e5e7eb", YELLOW: "#eab308",
};
const label = (value: string) => value[0] + value.slice(1).toLowerCase();

export default function SkinnyWiresSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [wires, setWires] = useState(initialWires);
  const [result, setResult] = useState<SkinnyWiresOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const solver = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);

  useSolverModulePersistence<{ wires?: SkinnyWire[]; result?: SkinnyWiresOutput | null; twitchCommand?: string }, SkinnyWiresOutput>({
    state: { wires, result, twitchCommand },
    onRestoreState: (saved) => {
      if (Array.isArray(saved.wires) && saved.wires.length === 5) setWires(saved.wires);
      if (saved.result !== undefined) setResult(saved.result);
      if (saved.twitchCommand !== undefined) setTwitchCommand(saved.twitchCommand);
    },
    onRestoreSolution: (solution) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.SKINNY_WIRES, result: solution }));
    },
    extractSolution: (raw) => raw && typeof raw === "object" && typeof (raw as SkinnyWiresOutput).coordinate === "string"
      ? raw as SkinnyWiresOutput : null,
    currentModule: solver.currentModule,
    setIsSolved: solver.setIsSolved,
  });

  const updateWire = (index: number, patch: Partial<SkinnyWire>) =>
    setWires((current) => current.map((wire, i) => i === index ? { ...wire, ...patch } : wire));

  const solve = async () => {
    if (!solver.round?.id || !bomb?.id || !solver.currentModule?.id) return solver.setError("Missing round, bomb, or module.");
    solver.clearError();
    solver.setIsLoading(true);
    try {
      const response = await solveSkinnyWires(solver.round.id, bomb.id, solver.currentModule.id, wires);
      const command = generateTwitchCommand({ moduleType: ModuleType.SKINNY_WIRES, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      solver.setIsSolved(response.solved);
      if (response.solved) solver.markModuleSolved(bomb.id, solver.currentModule.id);
      updateModuleAfterSolve(bomb.id, solver.currentModule.id, { wires, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) {
      solver.setError(cause instanceof Error ? cause.message : "Failed to solve Skinny Wires.");
    } finally {
      solver.setIsLoading(false);
    }
  };

  const reset = () => {
    setWires(initialWires());
    setResult(null);
    setTwitchCommand("");
    solver.reset();
  };

  return <SolverLayout>
    <SolverSection title="Wires" description="Enter each visible wire's color and its letter-number connection.">
      <div className="grid gap-2">
        {wires.map((wire, index) => <div key={index} style={{ borderLeftColor: colorStyles[wire.color] }} className="grid gap-2 rounded-md border border-l-4 p-2 sm:grid-cols-[5rem_repeat(3,1fr)] sm:items-center">
          <strong className="text-sm">Wire {index + 1}</strong>
          <select aria-label={`Wire ${index + 1} color`} value={wire.color} disabled={solver.isLoading || solver.isSolved} onChange={(event) => updateWire(index, { color: event.target.value as SkinnyWireColor })} className="h-9 rounded-md border bg-background px-2 text-sm">
            {SKINNY_WIRE_COLORS.map((color) => <option key={color} value={color}>{label(color)}</option>)}
          </select>
          <select aria-label={`Wire ${index + 1} letter port`} value={wire.letterPort} disabled={solver.isLoading || solver.isSolved} onChange={(event) => updateWire(index, { letterPort: event.target.value as SkinnyWireLetterPort })} className="h-9 rounded-md border bg-background px-2 text-sm">
            {(["A", "B", "C"] as const).map((port) => <option key={port} value={port}>Letter {port}</option>)}
          </select>
          <select aria-label={`Wire ${index + 1} number port`} value={wire.numberPort} disabled={solver.isLoading || solver.isSolved} onChange={(event) => updateWire(index, { numberPort: Number(event.target.value) as SkinnyWireNumberPort })} className="h-9 rounded-md border bg-background px-2 text-sm">
            {([1, 2, 3] as const).map((port) => <option key={port} value={port}>Number {port}</option>)}
          </select>
        </div>)}
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={solver.isLoading} isSolved={solver.isSolved} solveText="Find wire" />
    <ErrorAlert error={solver.error} />
    {result && <SolverResult title={`Cut ${result.coordinate}`} description={`${label(result.color)} wire · rule ${result.ruleNumber}`} />}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Connections must be unique. The solver applies the manual's rules from top to bottom and returns one valid wire for the first matching rule.</SolverInstructions>
  </SolverLayout>;
}
