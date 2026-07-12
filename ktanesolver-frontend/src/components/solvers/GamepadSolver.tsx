import { useCallback, useMemo, useState } from "react";
import { solveGamepad, type GamepadInput, type GamepadOutput } from "../../services/gamepadService";
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
import { Input } from "../ui/input";

const LABELS: Record<string, string> = { UP: "▲", DOWN: "▼", LEFT: "◀", RIGHT: "▶" };

interface GamepadSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function GamepadSolver({ bomb }: GamepadSolverProps) {
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const [result, setResult] = useState<GamepadOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ x, y, result, twitchCommand }), [x, y, result, twitchCommand]);

  const onRestoreState = useCallback((state: Partial<typeof moduleState> & { input?: Partial<GamepadInput> }) => {
    const input = state.input ?? state;
    if (input.x !== undefined) setX(String(input.x));
    if (input.y !== undefined) setY(String(input.y));
    if (state.result !== undefined) setResult(state.result);
    if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
  }, []);

  const onRestoreSolution = useCallback((solution: GamepadOutput) => {
    if (!solution?.sequence) return;
    setResult(solution);
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.GAMEPAD, result: solution }));
  }, []);

  useSolverModulePersistence<typeof moduleState, GamepadOutput>({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as GamepadOutput & { output?: GamepadOutput };
      return value.output ?? value;
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const changeNumber = (setter: (value: string) => void, value: string) => {
    if (/^\d{0,2}$/.test(value)) setter(value);
    clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!/^\d{2}$/.test(x) || !/^\d{2}$/.test(y)) return setError("Enter both two-digit numbers");
    clearError();
    setIsLoading(true);
    try {
      const input = { x: Number(x), y: Number(y) };
      const response = await solveGamepad(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.GAMEPAD, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve The Gamepad");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, x, y, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setX("");
    setY("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return (
    <SolverLayout>
      <SolverSection title="Display" description="Enter the two numbers shown from left to right.">
        <div className="grid grid-cols-2 gap-3">
          {[{ label: "First number", value: x, set: setX }, { label: "Second number", value: y, set: setY }].map((field) => (
            <Input
              key={field.label}
              value={field.value}
              onChange={(event) => changeNumber(field.set, event.target.value)}
              placeholder="00"
              maxLength={2}
              inputMode="numeric"
              disabled={isLoading || isSolved}
              aria-label={field.label}
              className="text-center font-mono text-3xl tracking-widest"
            />
          ))}
        </div>
      </SolverSection>

      <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={x.length !== 2 || y.length !== 2} isLoading={isLoading} isSolved={isSolved} solveText="Get command" />
      <ErrorAlert error={error} />

      {result && (
        <SolverSection title="Press in order" className="border-emerald-500/40">
          <div className="flex flex-wrap justify-center gap-2">
            {result.sequence.map((key, index) => (
              <div key={index} className="flex h-12 w-12 items-center justify-center rounded-md border-2 border-emerald-500 bg-emerald-500/10 text-xl font-bold text-emerald-700 dark:text-emerald-400" aria-label={`${index + 1}: ${key}`}>
                {LABELS[key] ?? key}
              </div>
            ))}
          </div>
        </SolverSection>
      )}
      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
      <SolverInstructions>Enter the two LCD values exactly as shown, including leading zeroes.</SolverInstructions>
    </SolverLayout>
  );
}
