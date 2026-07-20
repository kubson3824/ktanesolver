import { useCallback, useMemo, useState } from "react";

import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { cn } from "../../lib/cn";
import {
  PERPLEXING_ARROW_COLORS, PERPLEXING_ARROW_DIRECTIONS, PERPLEXING_WIRE_COLORS,
  solvePerplexingWires, type PerplexingWire, type PerplexingWiresOutput,
} from "../../services/perplexingWiresService";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const emptyWires = (): PerplexingWire[] => Array.from({ length: 6 }, () => ({
  topConnector: 1, color: "RED", arrowColor: "RED", arrowDirection: "UP",
}));
const WIRE_COLORS: Record<string, string> = {
  RED: "#ef4444", YELLOW: "#eab308", BLUE: "#3b82f6", WHITE: "#e5e7eb",
  GREEN: "#22c55e", ORANGE: "#f97316", PURPLE: "#a855f7", BLACK: "#171717",
};
const label = (value: string) => value[0] + value.slice(1).toLowerCase();

export default function PerplexingWiresSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [wires, setWires] = useState<PerplexingWire[]>(emptyWires);
  const [filledStars, setFilledStars] = useState([false, false, false, false]);
  const [ledsOn, setLedsOn] = useState([false, false, false]);
  const [result, setResult] = useState<PerplexingWiresOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const solver = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ wires, filledStars, ledsOn, result, twitchCommand }), [wires, filledStars, ledsOn, result, twitchCommand]);

  const restoreSolution = useCallback((solution: PerplexingWiresOutput) => {
    if (!solution || !Array.isArray(solution.cutFirst) || !Array.isArray(solution.cutNormal) || !Array.isArray(solution.cutLast)) return;
    setResult(solution);
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.PERPLEXING_WIRES, result: solution }));
  }, []);
  useSolverModulePersistence<typeof state, PerplexingWiresOutput>({
    state,
    onRestoreState: (saved) => {
      if (Array.isArray(saved.wires) && saved.wires.length === 6) setWires(saved.wires);
      if (Array.isArray(saved.filledStars) && saved.filledStars.length === 4) setFilledStars(saved.filledStars);
      if (Array.isArray(saved.ledsOn) && saved.ledsOn.length === 3) setLedsOn(saved.ledsOn);
      if (saved.result !== undefined) setResult(saved.result);
      if (saved.twitchCommand !== undefined) setTwitchCommand(saved.twitchCommand);
    },
    onRestoreSolution: restoreSolution,
    extractSolution: (raw) => raw && typeof raw === "object" && Array.isArray((raw as PerplexingWiresOutput).cutFirst) ? raw as PerplexingWiresOutput : null,
    currentModule: solver.currentModule,
    setIsSolved: solver.setIsSolved,
  });

  const updateWire = (index: number, patch: Partial<PerplexingWire>) =>
    setWires((current) => current.map((wire, i) => i === index ? { ...wire, ...patch } : wire));
  const toggle = (values: boolean[], setValues: (next: boolean[]) => void, index: number) =>
    setValues(values.map((value, i) => i === index ? !value : value));

  const solve = async () => {
    if (!solver.round?.id || !bomb?.id || !solver.currentModule?.id) return solver.setError("Missing round, bomb, or module.");
    solver.clearError(); solver.setIsLoading(true);
    try {
      const response = await solvePerplexingWires(solver.round.id, bomb.id, solver.currentModule.id, { wires, filledStars, ledsOn });
      const command = generateTwitchCommand({ moduleType: ModuleType.PERPLEXING_WIRES, result: response.output });
      setResult(response.output); setTwitchCommand(command); solver.setIsSolved(response.solved);
      if (response.solved) solver.markModuleSolved(bomb.id, solver.currentModule.id);
      updateModuleAfterSolve(bomb.id, solver.currentModule.id, { wires, filledStars, ledsOn, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { solver.setError(cause instanceof Error ? cause.message : "Solve failed."); }
    finally { solver.setIsLoading(false); }
  };
  const reset = () => {
    setWires(emptyWires()); setFilledStars([false, false, false, false]); setLedsOn([false, false, false]);
    setResult(null); setTwitchCommand(""); solver.reset();
  };

  const groups = result ? [
    ["Cut first", result.cutFirst], ["Then cut", result.cutNormal], ["Cut last", result.cutLast],
  ] as const : [];

  return <SolverLayout>
    <SolverSection title="Shared features" description="Set the four top stars and three LEDs before entering the six wires.">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><p className="mb-2 text-sm font-medium">Filled stars</p><div className="flex gap-2">
          {filledStars.map((on, index) => <button key={index} type="button" aria-pressed={on} aria-label={`Star ${index + 1} ${on ? "filled" : "empty"}`} disabled={solver.isSolved || solver.isLoading} onClick={() => toggle(filledStars, setFilledStars, index)} className={cn("h-10 flex-1 rounded-md border text-lg", on ? "border-amber-500 bg-amber-500/15 text-amber-600" : "text-muted-foreground")}>{on ? "★" : "☆"}</button>)}
        </div></div>
        <div><p className="mb-2 text-sm font-medium">LEDs</p><div className="flex gap-2">
          {ledsOn.map((on, index) => <button key={index} type="button" aria-pressed={on} aria-label={`LED ${index + 1} ${on ? "on" : "off"}`} disabled={solver.isSolved || solver.isLoading} onClick={() => toggle(ledsOn, setLedsOn, index)} className={cn("h-10 flex-1 rounded-md border text-sm font-semibold", on ? "border-lime-500 bg-lime-400 text-lime-950" : "text-muted-foreground")}>{index + 1}</button>)}
        </div></div>
      </div>
    </SolverSection>

    <SolverSection title="Wires" description="Rows are bottom connectors 1–6. Top connectors are numbered left to right.">
      <div className="grid gap-2">
        {wires.map((wire, index) => <div key={index} style={{ borderLeftColor: WIRE_COLORS[wire.color] }} className="grid gap-2 rounded-md border border-l-4 p-2 sm:grid-cols-[4rem_repeat(4,1fr)] sm:items-center">
          <strong className="text-sm">Wire {index + 1}</strong>
          <select aria-label={`Wire ${index + 1} top connector`} value={wire.topConnector} disabled={solver.isSolved || solver.isLoading} onChange={(event) => updateWire(index, { topConnector: Number(event.target.value) })} className="h-9 rounded-md border bg-background px-2 text-sm">
            {[1, 2, 3, 4].map((value) => <option key={value} value={value}>Top {value}</option>)}
          </select>
          <select aria-label={`Wire ${index + 1} color`} value={wire.color} disabled={solver.isSolved || solver.isLoading} onChange={(event) => updateWire(index, { color: event.target.value as PerplexingWire["color"] })} className="h-9 rounded-md border bg-background px-2 text-sm">
            {PERPLEXING_WIRE_COLORS.map((value) => <option key={value} value={value}>{label(value)} wire</option>)}
          </select>
          <select aria-label={`Wire ${index + 1} arrow color`} value={wire.arrowColor} disabled={solver.isSolved || solver.isLoading} onChange={(event) => updateWire(index, { arrowColor: event.target.value as PerplexingWire["arrowColor"] })} className="h-9 rounded-md border bg-background px-2 text-sm">
            {PERPLEXING_ARROW_COLORS.map((value) => <option key={value} value={value}>{label(value)} arrow</option>)}
          </select>
          <select aria-label={`Wire ${index + 1} arrow direction`} value={wire.arrowDirection} disabled={solver.isSolved || solver.isLoading} onChange={(event) => updateWire(index, { arrowDirection: event.target.value as PerplexingWire["arrowDirection"] })} className="h-9 rounded-md border bg-background px-2 text-sm">
            {PERPLEXING_ARROW_DIRECTIONS.map((value) => <option key={value} value={value}>{label(value)}</option>)}
          </select>
        </div>)}
      </div>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={solver.isLoading} isSolved={solver.isSolved} solveText="Find cut order" />
    <ErrorAlert error={solver.error} />
    {result && <SolverSection title="Cut order" className="border-emerald-500/40"><div className="grid gap-2 sm:grid-cols-3">
      {groups.map(([title, cuts]) => <div key={title} className="rounded-md bg-muted p-3"><p className="text-xs font-semibold uppercase text-muted-foreground">{title}</p><p className="mt-1 text-lg font-bold">{cuts.length ? cuts.map((wire) => `#${wire}`).join(", ") : "None"}</p></div>)}
    </div></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Cut every “first” wire before normal wires, and every “last” wire after normal wires. Wires within one group may be cut in any order.</SolverInstructions>
  </SolverLayout>;
}
