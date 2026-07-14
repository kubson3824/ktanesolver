import { useCallback, useMemo, useState } from "react";
import { solveZoo, type ZooInput, type ZooOutput } from "../../services/zooService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const ANIMALS = [
  "Armadillo", "Baboon", "Caracal", "Caterpillar", "Cheetah", "Coyote", "Crocodile", "Deer", "Gazelle",
  "Groundhog", "Ocelot", "Orca", "Penguin", "Plesiosaur", "Ram", "Sheep", "Squid", "Whale",
];

export default function ZooSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [firstAnimal, setFirstAnimal] = useState("");
  const [secondAnimal, setSecondAnimal] = useState("");
  const [result, setResult] = useState<ZooOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ firstAnimal, secondAnimal, result, twitchCommand }), [firstAnimal, secondAnimal, result, twitchCommand]);

  useSolverModulePersistence<typeof state, ZooOutput>({
    state,
    onRestoreState: useCallback((saved: Partial<typeof state> & { input?: Partial<ZooInput> }) => {
      if (saved.firstAnimal ?? saved.input?.firstAnimal) setFirstAnimal((saved.firstAnimal ?? saved.input?.firstAnimal)!);
      if (saved.secondAnimal ?? saved.input?.secondAnimal) setSecondAnimal((saved.secondAnimal ?? saved.input?.secondAnimal)!);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: ZooOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.ZOO, result: solution }));
    }, []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!firstAnimal || !secondAnimal) return setError("Select both displayed animals");
    clearError(); setIsLoading(true);
    try {
      const input = { firstAnimal, secondAnimal };
      const response = await solveZoo(round.id, bomb.id, currentModule.id, input);
      if (!response.output) return setError(response.reason ?? "Failed to solve Zoo");
      const command = generateTwitchCommand({ moduleType: ModuleType.ZOO, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Zoo"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, firstAnimal, secondAnimal, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setFirstAnimal(""); setSecondAnimal(""); setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Animals on the door" description="Select the two silhouettes shown. Their order does not matter.">
      <div className="grid gap-3 sm:grid-cols-2">
        {[firstAnimal, secondAnimal].map((animal, index) => <label key={index} className="space-y-1.5 text-sm font-medium">
          Displayed animal {index + 1}
          <select
            value={animal}
            onChange={(event) => (index === 0 ? setFirstAnimal : setSecondAnimal)(event.target.value)}
            disabled={isSolved}
            className="block h-11 w-full rounded-md border border-input bg-background px-3"
          >
            <option value="">Select an animal</option>
            {ANIMALS.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>)}
      </div>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={!firstAnimal || !secondAnimal} />
    <ErrorAlert error={error} />

    {result && <SolverSection title="Press in order" description="Open the door, then press only the animals that appear before it closes." className="border-emerald-500/40">
      <ol className="grid gap-2 sm:grid-cols-5">
        {result.animals.map((animal, index) => <li key={animal} className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-3 text-center font-bold">
          <span className="mr-2 text-sm text-muted-foreground">{index + 1}.</span>{animal}
        </li>)}
      </ol>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Port counts come from the bomb setup. Open the sliding door only when you are ready to enter the five-animal sequence within six seconds.</SolverInstructions>
  </SolverLayout>;
}
