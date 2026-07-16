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

const ANIMAL_SPRITE = `${import.meta.env.BASE_URL}zoo-animals.svg`;

function AnimalSilhouette({ animal, className }: { animal: string; className: string }) {
  const id = animal.toLowerCase().replace(/\s/g, "-");
  return <svg viewBox="0 0 36 36" className={className} fill="currentColor" aria-hidden>
    <use href={`${ANIMAL_SPRITE}#zoo-${id}`} />
  </svg>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function toggleAnimalSelection(selected: [string, string], animal: string): [string, string] {
  if (selected[0] === animal) return ["", selected[1]];
  if (selected[1] === animal) return [selected[0], ""];
  if (!selected[0]) return [animal, selected[1]];
  if (!selected[1]) return [selected[0], animal];
  return selected;
}

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

  const selectAnimal = (animal: string) => {
    const [first, second] = toggleAnimalSelection([firstAnimal, secondAnimal], animal);
    setFirstAnimal(first); setSecondAnimal(second); clearError();
  };

  const selectedAnimals = [firstAnimal, secondAnimal];

  return <SolverLayout>
    <SolverSection title="Animals on the door" description="Pick the two matching silhouettes. Their order does not matter.">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {ANIMALS.map((animal) => {
          const selected = selectedAnimals.includes(animal);
          const unavailable = !selected && selectedAnimals.every(Boolean);
          return <button key={animal} type="button" aria-pressed={selected} disabled={isLoading || isSolved || unavailable}
            onClick={() => selectAnimal(animal)}
            className={`flex min-w-0 flex-col items-center gap-1 rounded-lg border p-2 text-center transition-colors ${selected ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "border-input hover:bg-accent disabled:opacity-35"}`}>
            <AnimalSilhouette animal={animal} className="h-14 w-14" />
            <span className="w-full break-words text-[10px] font-medium leading-tight">{animal}</span>
          </button>;
        })}
      </div>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={!firstAnimal || !secondAnimal} />
    <ErrorAlert error={error} />

    {result && <SolverSection title="Press in order" description="Open the door, then press only the animals that appear before it closes." className="border-emerald-500/40">
      <ol className="grid gap-2 sm:grid-cols-5">
        {result.animals.map((animal, index) => <li key={animal} className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2 py-3 text-center font-bold">
          <AnimalSilhouette animal={animal} className="mx-auto h-16 w-16 text-emerald-800 dark:text-emerald-200" />
          <span className="mt-1 block text-xs text-muted-foreground">{index + 1}.</span>
          <span className="block text-sm leading-tight">{animal}</span>
        </li>)}
      </ol>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Port counts come from the bomb setup. Open the sliding door only when you are ready to enter the five-animal sequence within six seconds.</SolverInstructions>
  </SolverLayout>;
}
