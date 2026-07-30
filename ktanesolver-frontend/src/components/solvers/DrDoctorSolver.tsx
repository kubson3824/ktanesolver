import { useCallback, useMemo, useState } from "react";
import {
  DR_DOCTOR_DISEASES,
  DR_DOCTOR_SYMPTOMS,
  solveDrDoctor,
  type DrDoctorDisease,
  type DrDoctorInput,
  type DrDoctorOutput,
  type DrDoctorSymptom,
} from "../../services/drDoctorService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverSection,
  TwitchCommandDisplay,
  useSolver,
  useSolverModulePersistence,
} from "../common";
import type { SolverProps } from "./types";

export default function DrDoctorSolver({ bomb }: SolverProps) {
  const [diagnoses, setDiagnoses] = useState<DrDoctorDisease[]>([]);
  const [symptoms, setSymptoms] = useState<DrDoctorSymptom[]>([]);
  const [moreThanHalfTimeRemaining, setMoreThanHalfTimeRemaining] = useState<boolean | null>(null);
  const [displayedSymptom, setDisplayedSymptom] = useState<DrDoctorSymptom | "">("");
  const [result, setResult] = useState<DrDoctorOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(
    () => ({ diagnoses, symptoms, moreThanHalfTimeRemaining, displayedSymptom, result, twitchCommand }),
    [diagnoses, symptoms, moreThanHalfTimeRemaining, displayedSymptom, result, twitchCommand],
  );

  const onRestoreState = useCallback((state: Partial<typeof moduleState> & { input?: Partial<DrDoctorInput> }) => {
    const input = state.input ?? state;
    if (input.diagnoses) setDiagnoses(input.diagnoses);
    if (input.symptoms) setSymptoms(input.symptoms);
    if (input.moreThanHalfTimeRemaining !== undefined) setMoreThanHalfTimeRemaining(input.moreThanHalfTimeRemaining);
    if (input.displayedSymptom !== undefined) setDisplayedSymptom(input.displayedSymptom);
    if (state.result !== undefined) setResult(state.result);
    if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
  }, []);

  const onRestoreSolution = useCallback((solution: DrDoctorOutput) => {
    if (!solution?.diagnosis || !solution.treatment || !solution.dose) return;
    setResult(solution);
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.DR_DOCTOR, result: solution }));
  }, []);

  useSolverModulePersistence<typeof moduleState, DrDoctorOutput>({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as DrDoctorOutput & { output?: DrDoctorOutput; result?: DrDoctorOutput };
      return value.output ?? value.result ?? value;
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const toggleDisease = (disease: DrDoctorDisease) => {
    setDiagnoses((selected) => selected.includes(disease)
      ? selected.filter((value) => value !== disease)
      : selected.length < 3 ? [...selected, disease] : selected);
    clearError();
  };

  const toggleSymptom = (symptom: DrDoctorSymptom) => {
    setSymptoms((selected) => {
      if (selected.includes(symptom)) {
        if (displayedSymptom === symptom) setDisplayedSymptom("");
        return selected.filter((value) => value !== symptom);
      }
      return selected.length < 7 ? [...selected, symptom] : selected;
    });
    clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (diagnoses.length !== 3 || symptoms.length !== 7 || moreThanHalfTimeRemaining === null || !displayedSymptom) {
      return setError("Select three diseases, seven symptoms, the visible symptom, and the time condition");
    }
    clearError();
    setIsLoading(true);
    try {
      const input: DrDoctorInput = { diagnoses, symptoms, moreThanHalfTimeRemaining, displayedSymptom };
      const response = await solveDrDoctor(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.DR_DOCTOR, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Dr. Doctor");
    } finally {
      setIsLoading(false);
    }
  }, [
    round?.id, bomb?.id, currentModule?.id, diagnoses, symptoms, moreThanHalfTimeRemaining, displayedSymptom,
    clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve,
  ]);

  const reset = useCallback(() => {
    setDiagnoses([]);
    setSymptoms([]);
    setMoreThanHalfTimeRemaining(null);
    setDisplayedSymptom("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  const disabled = isLoading || isSolved;
  const ready = diagnoses.length === 3 && symptoms.length === 7
    && moreThanHalfTimeRemaining !== null && Boolean(displayedSymptom);

  return (
    <SolverLayout>
      <SolverSection title={`Diseases (${diagnoses.length}/3)`} description="Select the three diseases available on the diagnosis display.">
        <div className="grid gap-2 sm:grid-cols-2">
          {DR_DOCTOR_DISEASES.map(([value, label]) => (
            <label key={value} className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3">
              <input
                type="checkbox"
                checked={diagnoses.includes(value)}
                onChange={() => toggleDisease(value)}
                disabled={disabled || (diagnoses.length === 3 && !diagnoses.includes(value))}
              />
              {label}
            </label>
          ))}
        </div>
      </SolverSection>

      <SolverSection title={`Symptoms (${symptoms.length}/7)`} description="Cycle the symptom display and select all seven listed symptoms.">
        <div className="grid gap-2 sm:grid-cols-2">
          {DR_DOCTOR_SYMPTOMS.map(([value, label]) => (
            <label key={value} className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3">
              <input
                type="checkbox"
                checked={symptoms.includes(value)}
                onChange={() => toggleSymptom(value)}
                disabled={disabled || (symptoms.length === 7 && !symptoms.includes(value))}
              />
              {label}
            </label>
          ))}
        </div>
        <label className="mt-4 block text-sm font-medium">
          Symptom currently visible
          <select
            value={displayedSymptom}
            onChange={(event) => { setDisplayedSymptom(event.target.value as DrDoctorSymptom); clearError(); }}
            disabled={disabled || symptoms.length === 0}
            className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select the visible symptom</option>
            {DR_DOCTOR_SYMPTOMS.filter(([value]) => symptoms.includes(value)).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </SolverSection>

      <SolverSection title="Bomb time" description="Use the timer state at the moment you will submit the treatment.">
        <fieldset className="grid gap-2 sm:grid-cols-2">
          <legend className="sr-only">Is more than half of the bomb time remaining?</legend>
          {[
            [true, "More than half remains"],
            [false, "Half or less remains"],
          ].map(([value, label]) => (
            <label key={String(value)} className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3">
              <input
                type="radio"
                name="dr-doctor-time"
                checked={moreThanHalfTimeRemaining === value}
                onChange={() => { setMoreThanHalfTimeRemaining(value as boolean); clearError(); }}
                disabled={disabled}
              />
              {label}
            </label>
          ))}
        </fieldset>
      </SolverSection>

      <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={!ready} isLoading={isLoading} isSolved={isSolved} solveText="Write prescription" />
      <ErrorAlert error={error} />

      {result && (
        <SolverSection title="Prescription" className="border-emerald-500/40">
          <dl className="grid gap-2 sm:grid-cols-2">
            <div><dt className="text-sm text-muted-foreground">Diagnosis</dt><dd className="font-semibold">{result.diagnosis}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Treatment</dt><dd className="font-semibold">{result.treatment}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Dose</dt><dd className="font-semibold">{result.dose}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Follow-up date</dt><dd className="font-semibold">{result.followUpDay}/{result.followUpMonth}</dd></div>
          </dl>
        </SolverSection>
      )}
      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
      <SolverInstructions>Submit this prescription immediately: the diagnosis can change at half time and the dose can change whenever another non-needy module is solved.</SolverInstructions>
    </SolverLayout>
  );
}
