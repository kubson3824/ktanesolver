import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { cn } from "../../lib/cn";
import { useRoundStore } from "../../store/useRoundStore";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  MICROCONTROLLER_PIN_COUNTS,
  MICROCONTROLLER_TYPES,
  solveMicrocontroller,
  type MicrocontrollerOutput,
  type MicrocontrollerPinCount,
  type MicrocontrollerType,
} from "../../services/microcontrollerService";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import { Input } from "../ui/input";

interface MicrocontrollerSolverProps {
  bomb: BombEntity | null | undefined;
}

const TYPE_LABELS: Record<MicrocontrollerType, string> = {
  STRK: "STRK",
  LEDS: "LEDS",
  CNTD: "CNTD",
  EXPL: "EXPL",
};

const COLOR_CLASSES: Record<string, string> = {
  BLUE: "border-blue-500/40 bg-blue-500/15 text-blue-700 dark:text-blue-300",
  GREEN: "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  MAGENTA: "border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300",
  RED: "border-red-500/40 bg-red-500/15 text-red-700 dark:text-red-300",
  WHITE: "border-slate-300 bg-white text-slate-900 dark:border-slate-500 dark:bg-slate-100 dark:text-slate-950",
  YELLOW: "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300",
};

const formatLabel = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

export default function MicrocontrollerSolver({ bomb }: MicrocontrollerSolverProps) {
  const [controllerType, setControllerType] = useState<MicrocontrollerType>("STRK");
  const [pinCount, setPinCount] = useState<MicrocontrollerPinCount>(6);
  const [controllerSerialNumber, setControllerSerialNumber] = useState("");
  const [result, setResult] = useState<MicrocontrollerOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");

  const {
    isLoading,
    error,
    isSolved,
    setIsLoading,
    setError,
    setIsSolved,
    clearError,
    reset: resetSolverState,
    currentModule,
    round,
    markModuleSolved,
  } = useSolver();

  const updateModuleAfterSolve = useRoundStore((s) => s.updateModuleAfterSolve);

  const moduleState = useMemo(
    () => ({ controllerType, pinCount, controllerSerialNumber, result, twitchCommand }),
    [controllerType, pinCount, controllerSerialNumber, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      controllerType?: MicrocontrollerType;
      pinCount?: MicrocontrollerPinCount;
      controllerSerialNumber?: string;
      result?: MicrocontrollerOutput | null;
      twitchCommand?: string;
    }) => {
      if (state.controllerType) setControllerType(state.controllerType);
      if (state.pinCount) setPinCount(state.pinCount);
      if (state.controllerSerialNumber !== undefined) {
        setControllerSerialNumber(state.controllerSerialNumber);
      }
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback((solution: MicrocontrollerOutput) => {
    setResult(solution);
    setTwitchCommand(
      generateTwitchCommand({ moduleType: ModuleType.MICROCONTROLLER, result: solution }),
    );
  }, []);

  useSolverModulePersistence<
    {
      controllerType: MicrocontrollerType;
      pinCount: MicrocontrollerPinCount;
      controllerSerialNumber: string;
      result: MicrocontrollerOutput | null;
      twitchCommand: string;
    },
    MicrocontrollerOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null || typeof raw !== "object") return null;
      const value = raw as Partial<MicrocontrollerOutput>;
      if (Array.isArray(value.pins) && typeof value.colorRule === "string") {
        return raw as MicrocontrollerOutput;
      }
      return null;
    },
    inferSolved: (_sol, mod) => Boolean((mod as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleSolve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing round, bomb, or module.");
      return;
    }
    if (!controllerSerialNumber.trim()) {
      setError("Enter the controller serial number.");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveMicrocontroller(round.id, bomb.id, currentModule.id, {
        input: {
          controllerType,
          pinCount,
          controllerSerialNumber: controllerSerialNumber.trim(),
        },
      });
      const output = response.output;
      setResult(output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);

      const command = generateTwitchCommand({
        moduleType: ModuleType.MICROCONTROLLER,
        result: output,
      });
      setTwitchCommand(command);

      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { controllerType, pinCount, controllerSerialNumber, result: output, twitchCommand: command },
        output,
        true,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Solve failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setControllerType("STRK");
    setPinCount(6);
    setControllerSerialNumber("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  const disabled = isLoading || isSolved;

  return (
    <SolverLayout>
      <SolverSection
        title="Controller"
        description="Select the imprinted controller type, pin count, and enter the controller serial."
      >
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_1.2fr]">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Type
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MICROCONTROLLER_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setControllerType(type)}
                  disabled={disabled}
                  aria-pressed={controllerType === type}
                  className={cn(
                    "h-10 rounded-md border px-3 font-mono text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    controllerType === type
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                    disabled && "cursor-not-allowed opacity-60",
                  )}
                >
                  {TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pins
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MICROCONTROLLER_PIN_COUNTS.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setPinCount(count)}
                  disabled={disabled}
                  aria-pressed={pinCount === count}
                  className={cn(
                    "h-10 rounded-md border px-3 font-mono text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    pinCount === count
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-muted/30 text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                    disabled && "cursor-not-allowed opacity-60",
                  )}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="microcontroller-serial"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Serial
            </label>
            <Input
              id="microcontroller-serial"
              value={controllerSerialNumber}
              onChange={(event) => {
                setControllerSerialNumber(event.target.value.toUpperCase());
                if (error) clearError();
              }}
              disabled={disabled}
              autoComplete="off"
              autoCapitalize="characters"
              className="h-10 font-mono"
              placeholder="MC-230"
            />
          </div>
        </div>
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={!controllerSerialNumber.trim()}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Solve"
      />

      <ErrorAlert error={error} />

      {result && (
        <SolverSection title="Pin colors" className="border-emerald-500/40">
          <div className="mb-3 rounded-md border border-border bg-muted/25 px-3 py-2 text-sm text-muted-foreground">
            {result.colorRule}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {result.pins.map((pin) => (
              <div
                key={pin.pin}
                className="grid grid-cols-[3.5rem_1fr_auto] items-center gap-2 rounded-md border border-border bg-background px-3 py-2"
              >
                <span className="font-mono text-sm font-bold">Pin {pin.pin}</span>
                <span className="font-mono text-sm text-muted-foreground">{pin.component}</span>
                <span
                  className={cn(
                    "inline-flex min-w-20 justify-center rounded-md border px-2 py-1 text-xs font-semibold",
                    COLOR_CLASSES[pin.color],
                  )}
                >
                  {formatLabel(pin.color)}
                </span>
              </div>
            ))}
          </div>
        </SolverSection>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        Use the pin with the white mark as pin 1, then read pins in numeric order.
      </SolverInstructions>
    </SolverLayout>
  );
}
