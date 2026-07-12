import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import {
  solveFollowTheLeader,
  type FollowTheLeaderColor,
  type FollowTheLeaderOutput,
} from "../../services/followTheLeaderService";
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
import { useRoundStore } from "../../store/useRoundStore";
import { cn } from "../../lib/cn";

interface Props { bomb: BombEntity | null | undefined }

const EMPTY_WIRES = () => Array<FollowTheLeaderColor | null>(12).fill(null);

const WIRE_OPTIONS: ReadonlyArray<ColorSwatchOption<FollowTheLeaderColor>> = [
  { value: "RED", label: "Red", swatch: "bg-red-500" },
  { value: "GREEN", label: "Green", swatch: "bg-green-500" },
  { value: "WHITE", label: "White", swatch: "bg-white border border-border" },
  { value: "YELLOW", label: "Yellow", swatch: "bg-yellow-400" },
  { value: "BLUE", label: "Blue", swatch: "bg-blue-500" },
  { value: "BLACK", label: "Black", swatch: "bg-neutral-900 border border-neutral-500" },
];

const WIRE_LABELS: Record<FollowTheLeaderColor, string> = Object.fromEntries(
  WIRE_OPTIONS.map((opt) => [opt.value, opt.label]),
) as Record<FollowTheLeaderColor, string>;

export default function FollowTheLeaderSolver({ bomb }: Props) {
  const [wires, setWires] = useState(EMPTY_WIRES);
  const [result, setResult] = useState<FollowTheLeaderOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const solver = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ wires, result, twitchCommand }), [wires, result, twitchCommand]);

  const restoreState = useCallback((saved: Partial<typeof state>) => {
    if (Array.isArray(saved.wires) && saved.wires.length === 12) setWires(saved.wires);
    if (saved.result !== undefined) setResult(saved.result);
    if (saved.twitchCommand !== undefined) setTwitchCommand(saved.twitchCommand);
  }, []);
  const restoreSolution = useCallback((solution: FollowTheLeaderOutput) => {
    setResult(solution);
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.FOLLOW_THE_LEADER, result: solution }));
  }, []);

  useSolverModulePersistence<typeof state, FollowTheLeaderOutput>({
    state,
    onRestoreState: restoreState,
    onRestoreSolution: restoreSolution,
    extractSolution: (raw) => raw && typeof raw === "object" && Array.isArray((raw as FollowTheLeaderOutput).cutPlugs) ? raw as FollowTheLeaderOutput : null,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule: solver.currentModule,
    setIsSolved: solver.setIsSolved,
  });

  const solve = async () => {
    if (!solver.round?.id || !bomb?.id || !solver.currentModule?.id) return solver.setError("Missing round, bomb, or module.");
    const count = wires.filter(Boolean).length;
    if (count < 8) return solver.setError("Select at least 8 wires.");
    solver.setIsLoading(true);
    solver.clearError();
    try {
      const { output } = await solveFollowTheLeader(solver.round.id, bomb.id, solver.currentModule.id, wires);
      const command = generateTwitchCommand({ moduleType: ModuleType.FOLLOW_THE_LEADER, result: output });
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
      <SolverSection title="Wires" description="For each starting plug, select its wire color. Leave skipped plugs empty.">
        <div className="grid gap-2">
          {wires.map((color, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors",
                color ? "border-border bg-muted/40" : "border-dashed border-border",
              )}
            >
              <span className="w-14 shrink-0 font-semibold">
                Plug {index + 1}
                <span className="block text-[11px] font-normal leading-tight text-muted-foreground">{color ? WIRE_LABELS[color] : "No wire"}</span>
              </span>
              <ColorSwatchPicker
                value={color}
                options={WIRE_OPTIONS}
                onChange={(value) => setWires((previous) => previous.map((wire, i) => (i === index ? value : wire)))}
                disabled={solver.isLoading || solver.isSolved}
                size="sm"
                ariaLabel={`Wire from plug ${index + 1}`}
                className="flex-wrap"
              />
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{wires.filter(Boolean).length}/12 wires selected (minimum 8).</p>
      </SolverSection>

      <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={wires.filter(Boolean).length < 8} isLoading={solver.isLoading} isSolved={solver.isSolved} solveText="Solve" />
      <ErrorAlert error={solver.error} />

      {result && (
        <SolverSection title="Cut order" className="border-emerald-500/40">
          <p className="text-sm text-muted-foreground">
            {result.cutAllDescending ? "CLR rule: cut every wire in descending order." : `Start at plug ${result.startPlug}; follow the table ${result.direction.toLowerCase()}.`}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2" aria-label={`Cut plugs ${result.cutPlugs.join(", ")}`}>
            {result.cutPlugs.map((plug, index) => (
              <span key={plug} className="flex items-center gap-2">
                {index > 0 && <span aria-hidden className="text-muted-foreground">→</span>}
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 font-semibold text-emerald-700 dark:text-emerald-300">{plug}</span>
              </span>
            ))}
          </div>
        </SolverSection>
      )}
      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
      <SolverInstructions>Enter the color of each visible wire at the plug it starts from. The solver derives skipped plugs and applies the bomb's ports, batteries, serial number, and CLR indicator.</SolverInstructions>
    </SolverLayout>
  );
}
