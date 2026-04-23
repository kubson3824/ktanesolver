import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import {
  solvePlumbing,
  type PlumbingOutput,
} from "../../services/plumbingService";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  SolverResult,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import { cn } from "../../lib/cn";

const PIPE_COLORS = ["Red", "Yellow", "Green", "Blue"] as const;

const PIPE_ACTIVE: Record<(typeof PIPE_COLORS)[number], string> = {
  Red: "bg-red-500 text-white border-red-600",
  Yellow: "bg-yellow-400 text-yellow-950 border-yellow-500",
  Green: "bg-green-500 text-white border-green-600",
  Blue: "bg-blue-500 text-white border-blue-600",
};

interface PlumbingSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function PlumbingSolver({ bomb }: PlumbingSolverProps) {
  const [result, setResult] = useState<PlumbingOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

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
    () => ({ result, twitchCommand }),
    [result, twitchCommand]
  );

  const onRestoreState = useCallback(
    (state: { result?: PlumbingOutput | null; twitchCommand?: string }) => {
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    []
  );

  const onRestoreSolution = useCallback((solution: PlumbingOutput) => {
    if (solution?.activeInputs?.length && solution?.activeOutputs?.length) {
      setResult(solution);
      setTwitchCommand(
        generateTwitchCommand({
          moduleType: ModuleType.PLUMBING,
          result: {
            activeInputs: solution.activeInputs,
            activeOutputs: solution.activeOutputs,
          },
        })
      );
    }
  }, []);

  useSolverModulePersistence<
    { result: PlumbingOutput | null; twitchCommand: string },
    PlumbingOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      const o = raw as { activeInputs?: unknown; activeOutputs?: unknown };
      if (
        Array.isArray(o.activeInputs) &&
        Array.isArray(o.activeOutputs)
      ) {
        return raw as PlumbingOutput;
      }
      return null;
    },
    inferSolved: (_sol, mod) => Boolean((mod as { solved?: boolean })?.solved),
    currentModule,
    setIsSolved,
  });

  const handleSolve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing round, bomb, or module.");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solvePlumbing(round.id, bomb.id, currentModule.id, {
        input: {},
      });

      const output = response.output;
      setResult(output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);

      const command = generateTwitchCommand({
        moduleType: ModuleType.PLUMBING,
        result: {
          activeInputs: output.activeInputs,
          activeOutputs: output.activeOutputs,
        },
      });
      setTwitchCommand(command);

      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { result: output, twitchCommand: command },
        {
          activeInputs: output.activeInputs,
          activeOutputs: output.activeOutputs,
        },
        true
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Solve failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  const activeInputLabels = result
    ? result.activeInputs
        .map((active, i) => (active ? PIPE_COLORS[i] : null))
        .filter((s): s is (typeof PIPE_COLORS)[number] => Boolean(s))
    : [];
  const activeOutputLabels = result
    ? result.activeOutputs
        .map((active, i) => (active ? PIPE_COLORS[i] : null))
        .filter((s): s is (typeof PIPE_COLORS)[number] => Boolean(s))
    : [];

  const PipeChip = ({
    color,
    active,
  }: {
    color: (typeof PIPE_COLORS)[number];
    active: boolean;
  }) => (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm font-medium",
        active
          ? PIPE_ACTIVE[color]
          : "border-border bg-muted/40 text-muted-foreground line-through",
      )}
    >
      {color}
    </span>
  );

  return (
    <SolverLayout>
      <SolverSection
        title="Plumbing"
        description="The solver uses serial, batteries, ports, and indicators to pick which input and output pipes are active. Connect each active input to an active output through the 6×6 grid."
      >
        <SolverControls
          onSolve={handleSolve}
          onReset={reset}
          isLoading={isLoading}
          isSolved={isSolved}
        />
      </SolverSection>

      <ErrorAlert error={error} />

      {result && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SolverSection
              title="Active inputs (left)"
              description="Connect pipes on the left side."
            >
              <div className="flex flex-wrap gap-2">
                {PIPE_COLORS.map((color, i) => (
                  <PipeChip key={color} color={color} active={Boolean(result.activeInputs[i])} />
                ))}
              </div>
            </SolverSection>

            <SolverSection
              title="Active outputs (right)"
              description="Route to pipes on the right side."
            >
              <div className="flex flex-wrap gap-2">
                {PIPE_COLORS.map((color, i) => (
                  <PipeChip key={color} color={color} active={Boolean(result.activeOutputs[i])} />
                ))}
              </div>
            </SolverSection>
          </div>

          <SolverResult
            variant="success"
            title="On the module"
            description={`Inputs: ${activeInputLabels.join(", ") || "—"}\nOutputs: ${activeOutputLabels.join(", ") || "—"}`}
          />
        </>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        Rotate pipes in the grid so every active input connects to an active output. Leave inactive
        pipes unconnected, then press CHECK on the module to verify.
      </SolverInstructions>
    </SolverLayout>
  );
}
