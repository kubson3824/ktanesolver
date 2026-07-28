import { useState } from "react";
import { solvePie, type PieOutput } from "../../services/pieService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
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

interface PersistedState {
  digits?: string;
  input?: { digits?: string };
  result?: PieOutput | null;
  twitchCommand?: string;
}

export default function PieSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [digits, setDigits] = useState("");
  const [result, setResult] = useState<PieOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);

  useSolverModulePersistence<PersistedState, PieOutput>({
    state: { digits, result, twitchCommand },
    onRestoreState: (state) => {
      if (state.input?.digits !== undefined) setDigits(state.input.digits);
      else if (state.digits !== undefined) setDigits(state.digits);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: (solution) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.PIE, result: solution }));
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!/^\d{5}$/.test(digits)) return setError("Enter exactly five displayed digits");
    clearError();
    setIsLoading(true);
    try {
      const response = await solvePie(round.id, bomb.id, currentModule.id, digits);
      const command = generateTwitchCommand({ moduleType: ModuleType.PIE, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { digits, result: response.output, twitchCommand: command },
        response.output,
        response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Pie");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setDigits("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  return <SolverLayout>
    <SolverSection
      title="Displayed digits"
      description="Enter the five digits from left to right."
    >
      <label className="block text-sm font-medium">
        Five-digit display
        <Input
          value={digits}
          onChange={(event) => {
            setDigits(event.target.value.replace(/\D/g, "").slice(0, 5));
            if (error) clearError();
          }}
          inputMode="numeric"
          pattern="[0-9]{5}"
          maxLength={5}
          autoComplete="off"
          disabled={isLoading || isSolved}
          placeholder="31415"
          className="mt-2 font-mono tracking-[0.35em]"
        />
      </label>
    </SolverSection>

    <SolverControls
      onSolve={solve}
      onReset={reset}
      isSolveDisabled={!/^\d{5}$/.test(digits)}
      isLoading={isLoading}
      isSolved={isSolved}
      solveText="Find press order"
    />
    <ErrorAlert error={error} />

    {result && <SolverSection title="Press order">
      <p className="text-sm text-muted-foreground">
        Position in π: {result.position}. X = {result.x}; Y = {result.y}.
      </p>
      <ol className="mt-3 grid grid-cols-5 gap-2" aria-label="Pie button press order">
        {result.pressOrder.map((position, index) => <li
          key={position}
          className="rounded-md border bg-muted/40 p-3 text-center"
          aria-label={`Press ${index + 1}: button ${position}, digit ${digits[position - 1]}`}
        >
          <span className="block text-xs text-muted-foreground">{index + 1}</span>
          <span className="font-mono text-xl font-bold">{digits[position - 1]}</span>
          <span className="block text-xs">button {position}</span>
        </li>)}
      </ol>
    </SolverSection>}

    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Press each button once in the shown order. Button positions are numbered left to right.</SolverInstructions>
  </SolverLayout>;
}
