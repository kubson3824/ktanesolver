import { useCallback, useMemo, useState } from "react";

import { cn } from "../../lib/cn";
import { SKYRIM_OPTIONS, solveSkyrim, type SkyrimCategory, type SkyrimInput, type SkyrimOutput } from "../../services/skyrimService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const LABELS: Record<SkyrimCategory, string> = {
  races: "Races", weapons: "Weapons", enemies: "Enemies", cities: "Home cities", dragonShouts: "Dragon shouts",
};

function Picker({ category, selected, onChange, disabled }: {
  category: SkyrimCategory; selected: string[]; onChange: (values: string[]) => void; disabled: boolean;
}) {
  return <fieldset><legend className="mb-2 text-sm font-medium">{LABELS[category]} ({selected.length}/3)</legend>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {SKYRIM_OPTIONS[category].map((value) => {
        const active = selected.includes(value);
        return <button key={value} type="button" aria-pressed={active}
          disabled={disabled || !active && selected.length === 3}
          onClick={() => onChange(active ? selected.filter((item) => item !== value) : [...selected, value])}
          className={cn("rounded-md border px-3 py-2 text-sm disabled:opacity-40", active && "border-amber-500 bg-amber-500/15")}>
          {value}
        </button>;
      })}
    </div>
  </fieldset>;
}

type SkyrimState = SkyrimInput & { result: SkyrimOutput | null; twitchCommand: string };
const emptyInput = (): SkyrimInput => ({ races: [], weapons: [], enemies: [], cities: [], dragonShouts: [] });

export default function SkyrimSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [input, setInput] = useState<SkyrimInput>(emptyInput);
  const [result, setResult] = useState<SkyrimOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    currentModule, round, isLoading, isSolved, error, setIsLoading, setIsSolved,
    setError, clearError, reset: resetSolverState, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo<SkyrimState>(() => ({ ...input, result, twitchCommand }), [input, result, twitchCommand]);

  const restoreState = useCallback((restored: SkyrimState) => {
    setInput(Object.fromEntries(Object.keys(SKYRIM_OPTIONS).map((key) => [key, Array.isArray(restored[key as SkyrimCategory]) ? restored[key as SkyrimCategory] : []])) as unknown as SkyrimInput);
    if(restored.result) setResult(restored.result);
    if(typeof restored.twitchCommand === "string") setTwitchCommand(restored.twitchCommand);
  }, []);

  useSolverModulePersistence<SkyrimState, SkyrimOutput>({
    state, onRestoreState: restoreState, onRestoreSolution: setResult,
    extractSolution: (raw) => raw && typeof raw === "object" && "dragonShout" in raw ? raw as SkyrimOutput : null,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule, setIsSolved,
  });

  const complete = Object.values(input).every((values) => values.length === 3);
  const solve = async () => {
    if(!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if(!complete) return setError("Select the three displayed options in every category");
    clearError(); setIsLoading(true);
    try {
      const response = await solveSkyrim(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.SKYRIM, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(true); markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, true);
    } catch(cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Skyrim"); }
    finally { setIsLoading(false); }
  };

  const reset = () => { setInput(emptyInput()); setResult(null); setTwitchCommand(""); resetSolverState(); };
  const disabled = isLoading || isSolved;

  return <SolverLayout>
    <SolverSection title="Displayed choices" description="Select the three options visible in each category.">
      <div className="space-y-5">{(Object.keys(SKYRIM_OPTIONS) as SkyrimCategory[]).map((category) =>
        <Picker key={category} category={category} selected={input[category]} disabled={disabled}
          onChange={(values) => { setInput((current) => ({ ...current, [category]: values })); clearError(); }} />)}</div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={!complete} solveText="Find selections" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Set these five images" className="border-amber-500/40">
      <ol className="grid gap-3 sm:grid-cols-5">{Object.entries(result).map(([category, value], index) =>
        <li key={category} className="rounded-md border-2 border-amber-500 bg-amber-500/15 p-3 text-center">
          <p className="text-xs font-medium uppercase text-muted-foreground">{index + 1}. {category.replace(/([A-Z])/g, " $1")}</p>
          <p className="mt-1 font-bold">{value}</p>
        </li>)}</ol>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Set race, weapon, enemy, city, and dragon shout to these results, then submit.</SolverInstructions>
  </SolverLayout>;
}
