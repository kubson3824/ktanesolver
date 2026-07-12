import { useCallback, useMemo, useState } from "react";
import {
  MURDER_LOCATIONS,
  MURDER_SUSPECTS,
  MURDER_WEAPONS,
  solveMurder,
  type MurderInput,
  type MurderLocation,
  type MurderOutput,
  type MurderSuspect,
  type MurderWeapon,
} from "../../services/murderService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
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

const label = (value: string) => value.toLowerCase().split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");

interface MurderSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function MurderSolver({ bomb }: MurderSolverProps) {
  const [bodyLocation, setBodyLocation] = useState<MurderLocation | "">("");
  const [suspects, setSuspects] = useState<MurderSuspect[]>([]);
  const [weapons, setWeapons] = useState<MurderWeapon[]>([]);
  const [result, setResult] = useState<MurderOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(
    () => ({ bodyLocation, suspects, weapons, result, twitchCommand }),
    [bodyLocation, suspects, weapons, result, twitchCommand],
  );

  const onRestoreState = useCallback((state: Partial<typeof moduleState> & { input?: Partial<MurderInput> }) => {
    const input = state.input ?? state;
    if (input.bodyLocation !== undefined) setBodyLocation(input.bodyLocation);
    if (input.suspects) setSuspects(input.suspects);
    if (input.weapons) setWeapons(input.weapons);
    if (state.result !== undefined) setResult(state.result);
    if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
  }, []);

  const onRestoreSolution = useCallback((solution: MurderOutput) => {
    if (!solution?.suspect || !solution.weapon || !solution.location) return;
    setResult(solution);
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.MURDER, result: solution }));
  }, []);

  useSolverModulePersistence<typeof moduleState, MurderOutput>({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as MurderOutput & { output?: MurderOutput; result?: MurderOutput };
      return value.output ?? value.result ?? value;
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const toggleSuspect = (suspect: MurderSuspect) => {
    setSuspects((selected) => selected.includes(suspect)
      ? selected.filter((value) => value !== suspect)
      : selected.length < 4 ? [...selected, suspect] : selected);
    clearError();
  };

  const toggleWeapon = (weapon: MurderWeapon) => {
    setWeapons((selected) => selected.includes(weapon)
      ? selected.filter((value) => value !== weapon)
      : selected.length < 4 ? [...selected, weapon] : selected);
    clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!bodyLocation || suspects.length !== 4 || weapons.length !== 4) return setError("Select the body location, four suspects, and four weapons");
    clearError();
    setIsLoading(true);
    try {
      const input: MurderInput = { bodyLocation, suspects, weapons };
      const response = await solveMurder(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.MURDER, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Murder");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, bodyLocation, suspects, weapons, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setBodyLocation("");
    setSuspects([]);
    setWeapons([]);
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return (
    <SolverLayout>
      <SolverSection title="Body location" description="Select the room shown in red.">
        <select
          value={bodyLocation}
          onChange={(event) => { setBodyLocation(event.target.value as MurderLocation); clearError(); }}
          disabled={isLoading || isSolved}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          aria-label="Room where the body was found"
        >
          <option value="">Select a room</option>
          {MURDER_LOCATIONS.map((location) => <option key={location} value={location}>{label(location)}</option>)}
        </select>
      </SolverSection>

      <SolverSection title={`Suspects (${suspects.length}/4)`} description="Select the four suspects available on the module.">
        <div className="grid gap-2 sm:grid-cols-2">
          {MURDER_SUSPECTS.map((suspect) => (
            <label key={suspect} className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3">
              <input type="checkbox" checked={suspects.includes(suspect)} onChange={() => toggleSuspect(suspect)} disabled={isLoading || isSolved || (suspects.length === 4 && !suspects.includes(suspect))} />
              {label(suspect)}
            </label>
          ))}
        </div>
      </SolverSection>

      <SolverSection title={`Weapons (${weapons.length}/4)`} description="Select the four weapons available on the module.">
        <div className="grid gap-2 sm:grid-cols-2">
          {MURDER_WEAPONS.map((weapon) => (
            <label key={weapon} className="flex cursor-pointer items-center gap-2 rounded-md border border-border p-3">
              <input type="checkbox" checked={weapons.includes(weapon)} onChange={() => toggleWeapon(weapon)} disabled={isLoading || isSolved || (weapons.length === 4 && !weapons.includes(weapon))} />
              {label(weapon)}
            </label>
          ))}
        </div>
      </SolverSection>

      <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={!bodyLocation || suspects.length !== 4 || weapons.length !== 4} isLoading={isLoading} isSolved={isSolved} solveText="Solve case" />
      <ErrorAlert error={error} />

      {result && (
        <SolverSection title="Accusation" className="border-emerald-500/40">
          <p className="text-center text-lg font-semibold text-emerald-700 dark:text-emerald-400">
            {label(result.suspect)} with the {label(result.weapon)} in the {label(result.location)}
          </p>
        </SolverSection>
      )}
      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
      <SolverInstructions>Select only names and weapons that appear on the module; eliminated options are what make the accusation unique.</SolverInstructions>
    </SolverLayout>
  );
}
