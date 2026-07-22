import { useCallback, useMemo, useState } from "react";

import { cn } from "../../lib/cn";
import {
  HUMAN_RESOURCES_PEOPLE, solveHumanResources, type HumanResourcesDescriptor,
  type HumanResourcesInput, type HumanResourcesOutput, type HumanResourcesPerson,
} from "../../services/humanResourcesService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const title = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();
const people = HUMAN_RESOURCES_PEOPLE.map(([value, mbti]) => ({ value, label: `${title(value)} · ${mbti}` }));
const descriptors = HUMAN_RESOURCES_PEOPLE.map(([, mbti, value]) => ({ value, label: `${title(value)} · ${mbti}` }));

function OptionPicker<T extends string>({ title: legend, options, selected, blocked, limit, tone, onChange, disabled }: {
  title: string; options: readonly { value: T; label: string }[]; selected: T[]; blocked: T[];
  limit: number; tone: "green" | "red"; onChange: (values: T[]) => void; disabled: boolean;
}) {
  return <fieldset><legend className="mb-2 text-sm font-medium">{legend} ({selected.length}/{limit})</legend>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {options.map(({ value, label }) => {
        const active = selected.includes(value);
        return <button key={value} type="button" aria-pressed={active}
          disabled={disabled || blocked.includes(value) || !active && selected.length === limit}
          onClick={() => onChange(active ? selected.filter((item) => item !== value) : [...selected, value])}
          className={cn("rounded-md border px-2 py-2 text-sm disabled:opacity-40",
            active && (tone === "green" ? "border-emerald-500 bg-emerald-500/15" : "border-rose-500 bg-rose-500/15"))}>
          {label}
        </button>;
      })}
    </div>
  </fieldset>;
}

type HumanResourcesState = HumanResourcesInput & { result: HumanResourcesOutput | null; twitchCommand: string };

export default function HumanResourcesSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [employees, setEmployees] = useState<HumanResourcesPerson[]>([]);
  const [applicants, setApplicants] = useState<HumanResourcesPerson[]>([]);
  const [redDescriptors, setRedDescriptors] = useState<HumanResourcesDescriptor[]>([]);
  const [greenDescriptors, setGreenDescriptors] = useState<HumanResourcesDescriptor[]>([]);
  const [result, setResult] = useState<HumanResourcesOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    currentModule, round, isLoading, isSolved, error, setIsLoading, setIsSolved,
    setError, clearError, reset: resetSolverState, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo<HumanResourcesState>(() => ({
    employees, applicants, redDescriptors, greenDescriptors, result, twitchCommand,
  }), [employees, applicants, redDescriptors, greenDescriptors, result, twitchCommand]);

  const restoreState = useCallback((restored: HumanResourcesState) => {
    if(Array.isArray(restored.employees)) setEmployees(restored.employees);
    if(Array.isArray(restored.applicants)) setApplicants(restored.applicants);
    if(Array.isArray(restored.redDescriptors)) setRedDescriptors(restored.redDescriptors);
    if(Array.isArray(restored.greenDescriptors)) setGreenDescriptors(restored.greenDescriptors);
    if(restored.result) setResult(restored.result);
    if(typeof restored.twitchCommand === "string") setTwitchCommand(restored.twitchCommand);
  }, []);

  useSolverModulePersistence<HumanResourcesState, HumanResourcesOutput>({
    state, onRestoreState: restoreState, onRestoreSolution: setResult,
    extractSolution: (raw) => raw && typeof raw === "object" && "fire" in raw ? raw as HumanResourcesOutput : null,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule, setIsSolved,
  });

  const complete = employees.length === 5 && applicants.length === 5
    && redDescriptors.length === 3 && greenDescriptors.length === 2;
  const solve = async () => {
    if(!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if(!complete) return setError("Select all displayed people and descriptors");
    clearError(); setIsLoading(true);
    try {
      const input = { employees, applicants, redDescriptors, greenDescriptors };
      const response = await solveHumanResources(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.HUMAN_RESOURCES, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(true); markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, true);
    } catch(cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Human Resources"); }
    finally { setIsLoading(false); }
  };

  const reset = () => {
    setEmployees([]); setApplicants([]); setRedDescriptors([]); setGreenDescriptors([]);
    setResult(null); setTwitchCommand(""); resetSolverState();
  };
  const disabled = isLoading || isSolved;

  return <SolverLayout>
    <SolverSection title="People" description="Select the five green employees and five red applicants shown on the module.">
      <div className="space-y-5">
        <OptionPicker title="Employees" options={people} selected={employees} blocked={applicants} limit={5} tone="green" onChange={(values) => { setEmployees(values); clearError(); }} disabled={disabled} />
        <OptionPicker title="Applicants" options={people} selected={applicants} blocked={employees} limit={5} tone="red" onChange={(values) => { setApplicants(values); clearError(); }} disabled={disabled} />
      </div>
    </SolverSection>
    <SolverSection title="Descriptors" description="Select the three red complaint descriptors and two green desired descriptors.">
      <div className="space-y-5">
        <OptionPicker title="Red descriptors" options={descriptors} selected={redDescriptors} blocked={greenDescriptors} limit={3} tone="red" onChange={(values) => { setRedDescriptors(values); clearError(); }} disabled={disabled} />
        <OptionPicker title="Green descriptors" options={descriptors} selected={greenDescriptors} blocked={redDescriptors} limit={2} tone="green" onChange={(values) => { setGreenDescriptors(values); clearError(); }} disabled={disabled} />
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved}
      isSolveDisabled={!complete} solveText="Choose personnel" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Personnel changes" className="border-emerald-500/40">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border-2 border-rose-500 bg-rose-500/15 p-5 text-center">
          <p className="text-sm font-medium text-rose-700 dark:text-rose-300">Fire</p>
          <p className="mt-1 text-2xl font-bold">{title(result.fire)}</p>
        </div>
        <div className="rounded-md border-2 border-emerald-500 bg-emerald-500/15 p-5 text-center">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Hire</p>
          <p className="mt-1 text-2xl font-bold">{title(result.hire)}</p>
        </div>
      </div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Fire the result first, then hire the applicant. Required MBTI traits outrank preferred traits.</SolverInstructions>
  </SolverLayout>;
}
