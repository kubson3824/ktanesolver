import { useCallback, useMemo, useState } from "react";
import {
  KNOW_YOUR_WAY_DIRECTIONS, KNOW_YOUR_WAY_LABELS, solveKnowYourWay,
  type KnowYourWayDirection, type KnowYourWayLabel, type KnowYourWayOutput,
} from "../../services/knowYourWayService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const OBJECTS = ["Green LED", "Arrow", "Upper button", "U button"];

export default function KnowYourWaySolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [ledPosition, setLedPosition] = useState<KnowYourWayDirection>("UP");
  const [arrowDirection, setArrowDirection] = useState<KnowYourWayDirection>("UP");
  const [upperButtonLabel, setUpperButtonLabel] = useState<KnowYourWayLabel>("U");
  const [result, setResult] = useState<KnowYourWayOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ ledPosition, arrowDirection, upperButtonLabel, result, twitchCommand }),
    [ledPosition, arrowDirection, upperButtonLabel, result, twitchCommand]);

  useSolverModulePersistence<typeof state, KnowYourWayOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      if (saved.ledPosition) setLedPosition(saved.ledPosition);
      if (saved.arrowDirection) setArrowDirection(saved.arrowDirection);
      if (saved.upperButtonLabel) setUpperButtonLabel(saved.upperButtonLabel);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: KnowYourWayOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.KNOW_YOUR_WAY, result: solution }));
    }, []),
    currentModule,
    setIsSolved,
  });

  const clearResult = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const input = { ledPosition, arrowDirection, upperButtonLabel };
      const response = await solveKnowYourWay(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.KNOW_YOUR_WAY, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Know Your Way"); }
    finally { setIsLoading(false); }
  };
  const reset = () => {
    setLedPosition("UP"); setArrowDirection("UP"); setUpperButtonLabel("U");
    setResult(null); setTwitchCommand(""); resetSolverState();
  };

  const directionSelect = (label: string, value: KnowYourWayDirection, setter: (value: KnowYourWayDirection) => void) =>
    <label className="text-sm font-medium">{label}
      <select aria-label={label} value={value} onChange={(event) => { setter(event.target.value as KnowYourWayDirection); clearResult(); }} disabled={isLoading || isSolved} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3">
        {KNOW_YOUR_WAY_DIRECTIONS.map((direction) => <option key={direction}>{direction}</option>)}
      </select>
    </label>;

  return <SolverLayout>
    <SolverSection title="Module observation" description="Positions are relative to the module: up, left, down, and right.">
      <div className="grid gap-3 sm:grid-cols-3">
        {directionSelect("Green LED position", ledPosition, setLedPosition)}
        {directionSelect("Arrow direction", arrowDirection, setArrowDirection)}
        <label className="text-sm font-medium">Upper button label
          <select aria-label="Upper button label" value={upperButtonLabel} onChange={(event) => { setUpperButtonLabel(event.target.value as KnowYourWayLabel); clearResult(); }} disabled={isLoading || isSolved} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3">
            {KNOW_YOUR_WAY_LABELS.map((label) => <option key={label}>{label}</option>)}
          </select>
        </label>
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find button sequence" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Press sequence" className="border-emerald-500/40">
      <p className="text-center text-3xl font-semibold tracking-[0.35em]">{result.presses.join("")}</p>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        {OBJECTS.map((object, index) => <div key={object} className="rounded-md border p-2"><strong>{object}</strong><br />Indicates {result.indications[index].toLowerCase()} · faces {result.orientations[index].toLowerCase()}</div>)}
      </div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Press the buttons with these labels in order. A wrong press clears only the entered sequence; the module observation remains unchanged.</SolverInstructions>
  </SolverLayout>;
}
