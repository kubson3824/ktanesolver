import { useCallback, useMemo, useState } from "react";

import { cn } from "../../lib/cn";
import {
  IDENTITY_PARADE_ATTIRES, IDENTITY_PARADE_BUILDS, IDENTITY_PARADE_HAIR_COLORS, IDENTITY_PARADE_SUSPECTS,
  solveIdentityParade, type IdentityParadeAttire, type IdentityParadeBuild, type IdentityParadeHairColor,
  type IdentityParadeInput, type IdentityParadeOutput, type IdentityParadeSuspect,
} from "../../services/identityParadeService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const label = (value: string) => value === "T_SHIRT" ? "T-shirt" : value === "TANK_TOP" ? "Tank top"
  : value.charAt(0) + value.slice(1).toLowerCase();

function OptionPicker<T extends string>({ title, options, selected, limit, onChange, disabled }: {
  title: string; options: readonly T[]; selected: T[]; limit: number; onChange: (values: T[]) => void; disabled: boolean;
}) {
  return <fieldset><legend className="mb-2 text-sm font-medium">{title} ({selected.length}/{limit})</legend>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map((option) => {
        const active = selected.includes(option);
        return <button key={option} type="button" aria-pressed={active} disabled={disabled || !active && selected.length === limit}
          onClick={() => onChange(active ? selected.filter((value) => value !== option) : [...selected, option])}
          className={cn("rounded-md border px-3 py-2 text-sm", active && "border-primary bg-primary/10 font-medium")}>
          {label(option)}
        </button>;
      })}
    </div>
  </fieldset>;
}

type IdentityParadeState = IdentityParadeInput & { result: IdentityParadeOutput | null; twitchCommand: string };

export default function IdentityParadeSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [hairColors, setHairColors] = useState<IdentityParadeHairColor[]>([]);
  const [builds, setBuilds] = useState<IdentityParadeBuild[]>([]);
  const [attires, setAttires] = useState<IdentityParadeAttire[]>([]);
  const [suspects, setSuspects] = useState<IdentityParadeSuspect[]>([]);
  const [result, setResult] = useState<IdentityParadeOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    currentModule, round, isLoading, isSolved, error, setIsLoading, setIsSolved,
    setError, clearError, reset: resetSolverState, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo<IdentityParadeState>(() => ({ hairColors, builds, attires, suspects, result, twitchCommand }),
    [hairColors, builds, attires, suspects, result, twitchCommand]);

  const restoreState = useCallback((restored: IdentityParadeState) => {
    if (Array.isArray(restored.hairColors)) setHairColors(restored.hairColors);
    if (Array.isArray(restored.builds)) setBuilds(restored.builds);
    if (Array.isArray(restored.attires)) setAttires(restored.attires);
    if (Array.isArray(restored.suspects)) setSuspects(restored.suspects);
    if (restored.result) setResult(restored.result);
    if (typeof restored.twitchCommand === "string") setTwitchCommand(restored.twitchCommand);
  }, []);

  useSolverModulePersistence<IdentityParadeState, IdentityParadeOutput>({
    state, onRestoreState: restoreState, onRestoreSolution: setResult,
    extractSolution: (raw) => raw && typeof raw === "object" && "suspect" in raw ? raw as IdentityParadeOutput : null,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule, setIsSolved,
  });

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (hairColors.length !== 3 || builds.length !== 3 || attires.length !== 3 || suspects.length !== 9) {
      return setError("Select 3 hair colors, 3 builds, 3 attires, and 9 suspects");
    }
    clearError(); setIsLoading(true);
    try {
      const input = { hairColors, builds, attires, suspects };
      const response = await solveIdentityParade(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.IDENTITY_PARADE, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(true); markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Identity Parade"); }
    finally { setIsLoading(false); }
  };

  const reset = () => {
    setHairColors([]); setBuilds([]); setAttires([]); setSuspects([]); setResult(null); setTwitchCommand(""); resetSolverState();
  };
  const disabled = isLoading || isSolved;

  return <SolverLayout>
    <SolverSection title="Listed traits" description="Select every value available on each of the three trait displays.">
      <div className="space-y-5">
        <OptionPicker title="Hair colors" options={IDENTITY_PARADE_HAIR_COLORS} selected={hairColors} limit={3} onChange={(values) => { setHairColors(values); clearError(); }} disabled={disabled} />
        <OptionPicker title="Builds" options={IDENTITY_PARADE_BUILDS} selected={builds} limit={3} onChange={(values) => { setBuilds(values); clearError(); }} disabled={disabled} />
        <OptionPicker title="Attires" options={IDENTITY_PARADE_ATTIRES} selected={attires} limit={3} onChange={(values) => { setAttires(values); clearError(); }} disabled={disabled} />
      </div>
    </SolverSection>
    <SolverSection title="Displayed suspects" description="Select all nine names available on the suspect display.">
      <OptionPicker title="Suspects" options={IDENTITY_PARADE_SUSPECTS} selected={suspects} limit={9} onChange={(values) => { setSuspects(values); clearError(); }} disabled={disabled} />
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved}
      isSolveDisabled={hairColors.length !== 3 || builds.length !== 3 || attires.length !== 3 || suspects.length !== 9}
      solveText="Identify the guilty suspect" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Convict this suspect" className="border-emerald-500/40">
      <div className="rounded-md border-2 border-emerald-500 bg-emerald-500/15 p-5 text-center">
        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{label(result.suspect)}</p>
        <p className="mt-2 text-sm">{label(result.hairColor)} hair · {label(result.build)} · {label(result.attire)}</p>
      </div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>The guilty suspect is the only displayed person whose hair, build, and attire all occur in the listed traits.</SolverInstructions>
  </SolverLayout>;
}
