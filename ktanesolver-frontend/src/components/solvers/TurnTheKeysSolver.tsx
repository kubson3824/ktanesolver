import { useCallback, useMemo, useState } from "react";
import { Check, KeyRound } from "lucide-react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { solveTurnTheKeys, type TurnTheKeysSolveResponse } from "../../services/turnTheKeysService";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverResult,
} from "../common";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { cn } from "../../lib/cn";
import { useRoundStore } from "../../store/useRoundStore";

interface TurnTheKeysSolverProps {
  bomb: BombEntity | null | undefined;
}

type Output = TurnTheKeysSolveResponse["output"];
type Requirement = Output["rightKeyRequirements"][number];

export default function TurnTheKeysSolver({ bomb }: TurnTheKeysSolverProps) {
  const [priorityInput, setPriorityInput] = useState<string>("");
  const [result, setResult] = useState<Output | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");
  const selectModuleById = useRoundStore((state) => state.selectModuleById);

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

  const moduleState = useMemo(
    () => ({ priorityInput, result, twitchCommand }),
    [priorityInput, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      priorityInput?: string;
      result?: Output | null;
      twitchCommand?: string;
      priority?: number;
      leftKeyInstruction?: string;
      rightKeyInstruction?: string;
      canTurnRightKey?: boolean;
      canTurnLeftKey?: boolean;
      rightKeyTurned?: boolean;
      leftKeyTurned?: boolean;
      rightKeyRequirements?: Requirement[];
      leftKeyRequirements?: Requirement[];
    }) => {
      if (state.priorityInput !== undefined) setPriorityInput(state.priorityInput);
      else if (state.priority !== undefined) setPriorityInput(String(state.priority));
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
      if (state.result !== undefined) {
        setResult(state.result);
      } else if (
        (state.leftKeyInstruction !== undefined || state.rightKeyInstruction !== undefined) &&
        state.priority !== undefined
      ) {
        setResult({
          leftKeyInstruction: state.leftKeyInstruction ?? "",
          rightKeyInstruction: state.rightKeyInstruction ?? "",
          priority: state.priority,
          canTurnRightKey: state.canTurnRightKey ?? false,
          canTurnLeftKey: state.canTurnLeftKey ?? false,
          rightKeyTurned: state.rightKeyTurned ?? false,
          leftKeyTurned: state.leftKeyTurned ?? false,
          rightKeyRequirements: state.rightKeyRequirements ?? [],
          leftKeyRequirements: state.leftKeyRequirements ?? [],
        });
      }
    },
    [],
  );

  const onRestoreSolution = useCallback((solution: Output) => {
    if (!solution) return;
    setResult(solution);
    setTwitchCommand(
      generateTwitchCommand({
        moduleType: ModuleType.TURN_THE_KEYS,
        result: solution,
      }),
    );
  }, []);

  useSolverModulePersistence<
    { priorityInput: string; result: Output | null; twitchCommand: string },
    Output
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const o = raw as {
          output?: Output;
          leftKeyInstruction?: string;
          rightKeyInstruction?: string;
          priority?: number;
          canTurnRightKey?: boolean;
          canTurnLeftKey?: boolean;
          rightKeyTurned?: boolean;
          leftKeyTurned?: boolean;
          rightKeyRequirements?: Requirement[];
          leftKeyRequirements?: Requirement[];
        };
        if (o.output && typeof o.output === "object") return o.output as Output;
        if (
          typeof o.leftKeyInstruction === "string" &&
          typeof o.rightKeyInstruction === "string" &&
          typeof o.priority === "number"
        ) {
          return {
            leftKeyInstruction: o.leftKeyInstruction,
            rightKeyInstruction: o.rightKeyInstruction,
            priority: o.priority,
            canTurnRightKey: o.canTurnRightKey ?? false,
            canTurnLeftKey: o.canTurnLeftKey ?? false,
            rightKeyTurned: o.rightKeyTurned ?? false,
            leftKeyTurned: o.leftKeyTurned ?? false,
            rightKeyRequirements: o.rightKeyRequirements ?? [],
            leftKeyRequirements: o.leftKeyRequirements ?? [],
          };
        }
      }
      return null;
    },
    inferSolved: (_sol, mod) => Boolean((mod as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const runSolve = useCallback(
    async (payload: { priority: number; rightKeyTurned?: boolean; leftKeyTurned?: boolean }) => {
      if (!round?.id || !bomb?.id || !currentModule?.id) {
        setError("Missing required information");
        return;
      }
      clearError();
      setIsLoading(true);
      try {
        const response = await solveTurnTheKeys(round.id, bomb.id, currentModule.id, payload);
        setResult(response.output);
        setTwitchCommand(
          generateTwitchCommand({
            moduleType: ModuleType.TURN_THE_KEYS,
            result: response.output,
          }),
        );
        setIsSolved(response.solved);
        if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to solve Turn The Keys");
      } finally {
        setIsLoading(false);
      }
    },
    [round?.id, bomb?.id, currentModule?.id, clearError, markModuleSolved, setError, setIsLoading, setIsSolved],
  );

  const handleSolve = async () => {
    const priority = parseInt(priorityInput.trim(), 10);
    if (priorityInput.trim() === "" || isNaN(priority) || priority < 0) {
      setError("Enter a valid priority (0 or greater) from the display.");
      return;
    }
    await runSolve({ priority });
  };

  const handleTurnedRightKey = useCallback(async () => {
    if (!result) return;
    await runSolve({
      priority: result.priority,
      rightKeyTurned: true,
    });
  }, [result, runSolve]);

  const handleTurnedLeftKey = useCallback(async () => {
    if (!result) return;
    await runSolve({
      priority: result.priority,
      leftKeyTurned: true,
    });
  }, [result, runSolve]);

  const reset = () => {
    setPriorityInput("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  const priorityNum = useMemo(() => {
    const p = parseInt(priorityInput.trim(), 10);
    return priorityInput.trim() !== "" && !isNaN(p) && p >= 0 ? p : null;
  }, [priorityInput]);
  const canSolve = priorityNum !== null;
  const bothTurned = Boolean(result?.rightKeyTurned && result?.leftKeyTurned);

  return (
    <SolverLayout>
      <SolverSection
        title="Module priority"
        description="Enter the priority number shown on the module's display."
      >
        <Input
          type="number"
          min={0}
          value={priorityInput}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 4);
            if (v === "" || parseInt(v, 10) >= 0) {
              setPriorityInput(v);
              if (error) clearError();
            }
          }}
          placeholder="0"
          disabled={isLoading || isSolved}
          aria-label="Priority"
          className="mx-auto block w-full max-w-xs text-center font-mono text-3xl tracking-widest"
        />
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={!canSolve}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Show instructions"
      />

      <ErrorAlert error={error} />

      {result && (
        <SolverSection
          title="Key instructions"
          description={`This module's priority is ${result.priority}.`}
        >
          <div className="space-y-2">
            <KeyCard
              side="right"
              turned={Boolean(result.rightKeyTurned)}
              canTurn={result.canTurnRightKey}
              instruction={result.rightKeyInstruction}
              requirements={result.rightKeyRequirements ?? []}
              onOpenModule={(moduleId) => bomb?.id && selectModuleById(bomb.id, moduleId)}
              onTurned={handleTurnedRightKey}
              disabled={isLoading}
            />
            <KeyCard
              side="left"
              turned={Boolean(result.leftKeyTurned)}
              canTurn={result.canTurnLeftKey}
              instruction={result.leftKeyInstruction}
              requirements={result.leftKeyRequirements ?? []}
              onOpenModule={(moduleId) => bomb?.id && selectModuleById(bomb.id, moduleId)}
              onTurned={handleTurnedLeftKey}
              disabled={isLoading}
            />
          </div>
        </SolverSection>
      )}

      {bothTurned && (
        <SolverResult
          variant="success"
          title="Both keys turned"
          description="The module is defused."
        />
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        Priority determines order: turn the right keys from highest priority to lowest
        first, then the left keys in the same order. Follow the per-key instructions
        above each time the module tells you a key is safe to turn.
      </SolverInstructions>
    </SolverLayout>
  );
}

function KeyCard({
  side,
  turned,
  canTurn,
  instruction,
  requirements,
  onOpenModule,
  onTurned,
  disabled,
}: {
  side: "left" | "right";
  turned: boolean;
  canTurn: boolean;
  instruction: string;
  requirements: Requirement[];
  onOpenModule: (moduleId: string) => void;
  onTurned: () => void;
  disabled: boolean;
}) {
  const label = side === "left" ? "Left key" : "Right key";

  if (turned) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2">
        <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
        <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
          {label} turned
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2.5",
        canTurn
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-border bg-muted/20",
      )}
    >
      <div className="flex items-center gap-2">
        <KeyRound
          className={cn(
            "h-4 w-4 shrink-0",
            canTurn ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
          )}
          aria-hidden
        />
        <span
          className={cn(
            "text-sm font-semibold",
            canTurn ? "text-emerald-700 dark:text-emerald-300" : "text-foreground",
          )}
        >
          {label}
          {canTurn && " — safe to turn now"}
        </span>
      </div>
      {instruction && (
        <p className="mt-1.5 text-sm text-muted-foreground">{instruction}</p>
      )}
      {requirements.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Do these first
          </p>
          <ol className="mt-1 space-y-1">
            {requirements.map((requirement, index) => (
              <li key={`${requirement.moduleId}-${requirement.instruction}`}>
                <button
                  type="button"
                  className="flex w-full items-start gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => onOpenModule(requirement.moduleId)}
                >
                  <span className="font-mono text-xs text-muted-foreground">{index + 1}.</span>
                  <span className="underline decoration-muted-foreground/50 underline-offset-2">
                    {requirement.instruction}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="mt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onTurned}
          disabled={disabled}
        >
          I turned the {side} key
        </Button>
      </div>
    </div>
  );
}
