import { useMemo, useState } from "react";

import { solveBurglarAlarm, type BurglarAlarmOutput } from "../../services/burglarAlarmService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

export default function BurglarAlarmSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [moduleNumber, setModuleNumber] = useState("");
  const [result, setResult] = useState<BurglarAlarmOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(
    () => ({ moduleNumber, result, twitchCommand }),
    [moduleNumber, result, twitchCommand],
  );

  useSolverModulePersistence<typeof moduleState, BurglarAlarmOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (state.moduleNumber !== undefined) setModuleNumber(state.moduleNumber);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: (solution) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.BURGLAR_ALARM, result: solution }));
    },
    currentModule,
    setIsSolved,
  });

  const solve = async () => {
    if (!/^[0-9]{8}$/.test(moduleNumber)) return setError("Enter all eight displayed digits");
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError();
    setIsLoading(true);
    try {
      const response = await solveBurglarAlarm(round.id, bomb.id, currentModule.id, { moduleNumber });
      const command = generateTwitchCommand({ moduleType: ModuleType.BURGLAR_ALARM, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id, { moduleNumber, result: response.output, twitchCommand: command },
        response.output, response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Burglar Alarm");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setModuleNumber("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  return <SolverLayout>
    <SolverSection title="Module number" description="Enter the eight digits shown above the keypad.">
      <label className="block text-sm font-medium">
        Displayed digits
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]{8}"
          maxLength={8}
          value={moduleNumber}
          onChange={(event) => {
            setModuleNumber(event.target.value.replace(/\D/g, "").slice(0, 8));
            setResult(null);
            setTwitchCommand("");
            clearError();
          }}
          disabled={isLoading || isSolved}
          aria-describedby="burglar-alarm-digit-count"
          className="mt-2 h-12 w-full rounded-md border bg-background px-3 text-center font-mono text-2xl tracking-[0.35em]"
        />
      </label>
      <p id="burglar-alarm-digit-count" className="mt-2 text-right text-xs text-muted-foreground">
        {moduleNumber.length}/8 digits
      </p>
    </SolverSection>
    <SolverControls
      onSolve={solve}
      onReset={reset}
      isSolveDisabled={!/^[0-9]{8}$/.test(moduleNumber)}
      isLoading={isLoading}
      isSolved={isSolved}
      solveText="Calculate code"
    />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Disarm code" description="Press ✗, enter these digits, then press ✓ within 15 seconds." className="border-emerald-500/40">
      <div className="grid grid-cols-8 gap-1" aria-label={`Disarm code ${result.code}`}>
        {[...result.code].map((digit, index) =>
          <div key={index} className="rounded-md border bg-muted/40 py-3 text-center font-mono text-2xl font-bold">{digit}</div>)}
      </div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>The code uses the bomb’s current solved-module count, batteries, indicators, ports, and the displayed number.</SolverInstructions>
  </SolverLayout>;
}
