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
import { Input } from "../ui/input";

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
  const [rotationText, setRotationText] = useState("");
  const [readyToSubmit, setReadyToSubmit] = useState(false);

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
    () => ({ result, rotationText, readyToSubmit }),
    [result, rotationText, readyToSubmit]
  );

  const onRestoreState = useCallback(
    (state: { result?: PlumbingOutput | null; rotationText?: string; readyToSubmit?: boolean }) => {
      if (state.result !== undefined) setResult(state.result);
      if (state.rotationText !== undefined) setRotationText(state.rotationText);
      if (state.readyToSubmit !== undefined) setReadyToSubmit(state.readyToSubmit);
    },
    []
  );

  const onRestoreSolution = useCallback((solution: PlumbingOutput) => {
    if (solution?.activeInputs?.length && solution?.activeOutputs?.length) {
      setResult(solution);
    }
  }, []);

  useSolverModulePersistence<
    { result: PlumbingOutput | null; rotationText: string; readyToSubmit: boolean },
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
      setRotationText("");
      setReadyToSubmit(false);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);

      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { result: output, rotationText: "", readyToSubmit: false },
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
    setRotationText("");
    setReadyToSubmit(false);
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
  const rotationCoordinates = rotationText.trim()
    ? rotationText.trim().toUpperCase().split(/[\s,;]+/).filter(Boolean)
    : [];
  const rotationsValid = rotationCoordinates.every((coordinate) => /^[A-F][1-6]$/.test(coordinate));
  const twitchCommand = generateTwitchCommand({
    moduleType: ModuleType.PLUMBING,
    result: {
      rotations: rotationCoordinates,
      submit: readyToSubmit && rotationsValid,
    },
  });

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
          <SolverSection
            title="Twitch rotations"
            description="Enter each pipe to click, in order. Repeat a coordinate for additional quarter-turns."
          >
            <Input
              value={rotationText}
              onChange={(event) => {
                const value = event.target.value.toUpperCase();
                setRotationText(value);
                setReadyToSubmit(false);
                if (bomb?.id && currentModule?.id) {
                  updateModuleAfterSolve(
                    bomb.id,
                    currentModule.id,
                    { result, rotationText: value, readyToSubmit: false },
                    result,
                    isSolved,
                  );
                }
              }}
              placeholder="A3 B4 B4 C2"
              aria-label="Plumbing pipe rotations"
              className="font-mono uppercase"
            />
            {!rotationsValid && <p className="mt-2 text-xs text-destructive">Use coordinates A1 through F6.</p>}
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={readyToSubmit}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setReadyToSubmit(checked);
                  if (bomb?.id && currentModule?.id) {
                    updateModuleAfterSolve(
                      bomb.id,
                      currentModule.id,
                      { result, rotationText, readyToSubmit: checked },
                      result,
                      isSolved,
                    );
                  }
                }}
                disabled={!rotationsValid}
              />
              Rotation list is complete and the grid is ready to submit
            </label>
          </SolverSection>
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
