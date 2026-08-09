import { useCallback, useMemo, useState } from "react";
import { solveSplittingTheLoot, type SplittingTheLootOutput } from "../../services/splittingTheLootService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const INITIAL_BAGS = ["A1", "B1", "C1", "01", "01", "01", "01"];

export default function SplittingTheLootSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [bags, setBags] = useState(INITIAL_BAGS);
  const [coloredBag, setColoredBag] = useState(1);
  const [coloredBagColor, setColoredBagColor] = useState<"RED" | "BLUE">("RED");
  const [result, setResult] = useState<SplittingTheLootOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ bags, coloredBag, coloredBagColor, result, twitchCommand }), [bags, coloredBag, coloredBagColor, result, twitchCommand]);

  useSolverModulePersistence<typeof state, SplittingTheLootOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      if (saved.bags) setBags(saved.bags);
      if (saved.coloredBag) setColoredBag(saved.coloredBag);
      if (saved.coloredBagColor) setColoredBagColor(saved.coloredBagColor);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: SplittingTheLootOutput) => {
      setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.SPLITTING_THE_LOOT, result: solution }));
    }, []), currentModule, setIsSolved,
  });

  const changed = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const input = { bags, coloredBag, coloredBagColor };
      const response = await solveSplittingTheLoot(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.SPLITTING_THE_LOOT, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to split the loot"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setBags(INITIAL_BAGS); setColoredBag(1); setColoredBagColor("RED"); setResult(null); setTwitchCommand(""); resetSolverState(); };

  return <SolverLayout>
    <SolverSection title="Seven bags" description="Enter labels in reading order. Diamond bags use A1–J6; money bags use 01–99.">
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">{bags.map((bag, index) => <label key={index} className="text-center text-sm font-medium">{index + 1}
        <input aria-label={`Bag ${index + 1}`} value={bag} onChange={(event) => { const next = [...bags]; next[index] = event.target.value.toUpperCase(); setBags(next); changed(); }} disabled={isLoading || isSolved} maxLength={2} className="mt-1 h-11 w-full rounded-md border border-input bg-background px-2 text-center font-mono" />
      </label>)}</div>
    </SolverSection>
    <SolverSection title="Initially colored bag">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Bag number<select aria-label="Initially colored bag" value={coloredBag} onChange={(event) => { setColoredBag(Number(event.target.value)); changed(); }} disabled={isLoading || isSolved} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3">{bags.map((_, index) => <option key={index}>{index + 1}</option>)}</select></label>
        <label className="text-sm font-medium">Color<select aria-label="Initial bag color" value={coloredBagColor} onChange={(event) => { setColoredBagColor(event.target.value as "RED" | "BLUE"); changed(); }} disabled={isLoading || isSolved} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3"><option>RED</option><option>BLUE</option></select></label>
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find equal split" />
    <ErrorAlert error={error} />
    {result && <SolverSection title={`Each team receives ${result.totalPerTeam}`} className="border-emerald-500/40">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">{result.colors.map((color, index) => <div key={index} className={`rounded-md border-2 p-2 text-center ${color === "RED" ? "border-red-500 bg-red-500/15" : color === "BLUE" ? "border-blue-500 bg-blue-500/15" : "border-muted"}`}><strong>{index + 1}</strong><br />{bags[index]}<br /><span className="text-xs">{result.values[index]} · {color}</span></div>)}</div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Set every bag to the shown color, including NORMAL, then distribute. A strike does not regenerate the bags; setting every mutable group makes this answer safe to retry.</SolverInstructions>
  </SolverLayout>;
}
