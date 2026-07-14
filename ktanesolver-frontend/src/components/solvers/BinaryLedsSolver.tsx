import { useCallback, useMemo, useState } from "react";
import { cn } from "../../lib/cn";
import { solveBinaryLeds, type BinaryLedsInput, type BinaryLedsOutput } from "../../services/binaryLedsService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { Button } from "../ui/button";
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

const BITS = [16, 8, 4, 2, 1];
const TARGETS = [
  { key: "red", label: "Red", color: "bg-red-500", border: "border-red-500/40" },
  { key: "green", label: "Green", color: "bg-green-500", border: "border-green-500/40" },
  { key: "blue", label: "Blue", color: "bg-blue-500", border: "border-blue-500/40" },
] as const;
const binary = (value: number) => value.toString(2).padStart(5, "0");

interface BinaryLedsSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function BinaryLedsSolver({ bomb }: BinaryLedsSolverProps) {
  const [leds, setLeds] = useState([false, false, false, false, false]);
  const [observations, setObservations] = useState<number[]>([]);
  const [result, setResult] = useState<BinaryLedsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const currentValue = leds.reduce((value, on) => value * 2 + Number(on), 0);
  const moduleState = useMemo(
    () => ({ leds, observations, result, twitchCommand }),
    [leds, observations, result, twitchCommand],
  );

  const onRestoreState = useCallback((state: Partial<typeof moduleState> & { input?: Partial<BinaryLedsInput> }) => {
    const input = state.input ?? state;
    if (state.leds?.length === 5) setLeds(state.leds);
    if (input.observations) setObservations(input.observations);
    if (state.result !== undefined) setResult(state.result);
    if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
  }, []);

  const onRestoreSolution = useCallback((solution: BinaryLedsOutput) => {
    if (!solution?.sequenceNumber) return;
    setResult(solution);
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.BINARY_LEDS, result: solution }));
  }, []);

  useSolverModulePersistence<typeof moduleState, BinaryLedsOutput>({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as BinaryLedsOutput & { output?: BinaryLedsOutput };
      return value.output ?? value;
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const toggleLed = (index: number) => {
    setLeds((current) => current.map((on, position) => position === index ? !on : on));
    clearError();
  };

  const record = () => {
    if (currentValue > 0 && observations.length < 3) {
      setObservations((current) => [...current, currentValue]);
      clearError();
    }
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (observations.length !== 3) return setError("Record three consecutive LED values");
    clearError();
    setIsLoading(true);
    try {
      const input = { observations };
      const response = await solveBinaryLeds(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.BINARY_LEDS, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { ...input, leds, result: response.output, twitchCommand: command },
        response.output,
        true,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Binary LEDs");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, observations, leds, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setLeds([false, false, false, false, false]);
    setObservations([]);
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return (
    <SolverLayout>
      <SolverSection title="LED readings" description="Record three consecutive displays. The left LED is the most significant bit.">
        <div className="space-y-4">
          <div className="flex justify-center gap-3" role="group" aria-label="Five-bit LED display">
            {leds.map((on, index) => (
              <button
                key={BITS[index]}
                type="button"
                aria-label={`${BITS[index]} bit ${on ? "on" : "off"}`}
                aria-pressed={on}
                disabled={isLoading || isSolved || observations.length === 3}
                onClick={() => toggleLed(index)}
                className={cn(
                  "h-12 w-12 rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  on ? "border-emerald-200 bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,.8)]" : "border-slate-500 bg-slate-800",
                )}
              />
            ))}
          </div>

          <div className="text-center font-mono text-lg" aria-live="polite">
            {binary(currentValue)} <span className="text-muted-foreground">({currentValue})</span>
          </div>

          <div className="flex justify-center gap-2">
            <Button onClick={record} disabled={currentValue === 0 || observations.length === 3 || isLoading || isSolved}>
              Record reading
            </Button>
            <Button
              variant="outline"
              onClick={() => setObservations((current) => current.slice(0, -1))}
              disabled={!observations.length || isLoading || isSolved}
            >
              Undo
            </Button>
          </div>

          <ol className="flex min-h-10 justify-center gap-2" aria-label="Recorded readings">
            {observations.map((value, index) => (
              <li key={index} className="rounded-md border bg-muted/30 px-3 py-2 font-mono">
                {binary(value)} <span className="text-muted-foreground">({value})</span>
              </li>
            ))}
          </ol>
        </div>
      </SolverSection>

      <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={observations.length !== 3} isLoading={isLoading} isSolved={isSolved} solveText="Identify sequence" />
      <ErrorAlert error={error} />

      {result && (
        <SolverSection title={`Sequence ${result.sequenceNumber}`} description="Cut any one matching wire while its value is displayed." className="border-emerald-500/40">
          <div className="grid gap-3 sm:grid-cols-3">
            {TARGETS.map((target) => (
              <div key={target.key} className={cn("rounded-lg border p-3 text-center", target.border)}>
                <div className="mb-2 flex items-center justify-center gap-2 font-medium">
                  <span className={cn("h-4 w-4 rounded-full border border-black/30", target.color)} aria-hidden />
                  {target.label} wire
                </div>
                <div className="font-mono text-xl">{binary(result[target.key])}</div>
                <div className="text-sm text-muted-foreground">value {result[target.key]}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-sm font-medium">
            Recommended: cut the {result.recommendedColor.toLowerCase()} wire at {binary(result.recommendedValue)} ({result.recommendedValue}).
          </p>
        </SolverSection>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
      <SolverInstructions>Update the five LEDs after each change, then record the value. Do not skip a display.</SolverInstructions>
    </SolverLayout>
  );
}
