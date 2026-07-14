import { useCallback, useMemo, useState } from "react";
import { solveCreation, type CreationElement, type CreationOutput, type CreationWeather } from "../../services/creationService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, StageIndicator, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";
import { Button } from "../ui/button";

const BASES: CreationElement[] = ["WATER", "AIR", "EARTH", "FIRE"];
const POSITIONS = ["Upper-left", "Upper-right", "Bottom-left", "Bottom-right"];
const WEATHERS: { value: CreationWeather; label: string; icon: string }[] = [
  { value: "CLEAR", label: "Clear", icon: "☀️" },
  { value: "HEAT_WAVE", label: "Heat Wave", icon: "🌡️" },
  { value: "METEOR_SHOWER", label: "Meteor Shower", icon: "☄️" },
  { value: "RAIN", label: "Rain", icon: "🌧️" },
  { value: "WINDY", label: "Windy", icon: "💨" },
];

const label = (value: CreationElement) => value[0] + value.slice(1).toLowerCase().replaceAll("_", " ");

export default function CreationSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [weather, setWeather] = useState<CreationWeather>("CLEAR");
  const [baseElements, setBaseElements] = useState<CreationElement[]>(BASES);
  const [result, setResult] = useState<CreationOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const [restart, setRestart] = useState(false);
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ weather, baseElements, result, twitchCommand, restart }), [weather, baseElements, result, twitchCommand, restart]);

  useSolverModulePersistence<typeof state, CreationOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      if (saved.weather && WEATHERS.some(({ value }) => value === saved.weather)) setWeather(saved.weather);
      if (Array.isArray(saved.baseElements) && saved.baseElements.length === 4) setBaseElements(saved.baseElements);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
      if (typeof saved.restart === "boolean") setRestart(saved.restart);
    }, []),
    onRestoreSolution: useCallback((solution: CreationOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.CREATION, result: solution }));
    }, []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    const starting = result === null;
    if (starting && new Set(baseElements).size !== 4) return setError("Use Water, Air, Earth, and Fire once each");
    clearError(); setIsLoading(true);
    try {
      const response = await solveCreation(round.id, bomb.id, currentModule.id, {
        weather,
        baseElements: starting ? baseElements : null,
        reset: restart,
      });
      const command = generateTwitchCommand({ moduleType: ModuleType.CREATION, result: response.output });
      setResult(response.output); setTwitchCommand(command); setRestart(false); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { weather, baseElements, result: response.output, twitchCommand: command, restart: false }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Creation"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, weather, baseElements, result, restart, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setResult(null); setTwitchCommand(""); setRestart(true); resetSolverState();
  }, [resetSolverState]);
  const disabled = isLoading || isSolved;

  return <SolverLayout>
    {result && <SolverSection title="Creation progress" description={`Target lifeform: ${label(result.target)}`}>
      <StageIndicator total={result.totalSteps} current={isSolved ? result.totalSteps + 1 : result.day} completedThrough={isSolved ? result.totalSteps : result.day - 1} />
    </SolverSection>}

    {!result && <SolverSection title={restart ? "New run after strike" : "Starting elements"} description="Match the four positions shown on the module before making the first combination.">
      <div className="grid grid-cols-2 gap-3">
        {POSITIONS.map((position, index) => <label key={position} className="space-y-1.5 text-sm font-medium">{position}
          <select value={baseElements[index]} onChange={(event) => setBaseElements((current) => current.map((element, i) => i === index ? event.target.value as CreationElement : element))} disabled={disabled} className="block h-11 w-full rounded-md border border-input bg-background px-3">
            {BASES.map((element) => <option key={element} value={element}>{label(element)}</option>)}
          </select>
        </label>)}
      </div>
    </SolverSection>}

    {!isSolved && <SolverSection title={`Day ${result ? result.day + 1 : 1} weather`} description="Select the weather currently shown beside the day number.">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {WEATHERS.map(({ value, label: weatherLabel, icon }) => <Button key={value} type="button" variant={weather === value ? "default" : "outline"} className="h-auto min-h-16 flex-col gap-1" onClick={() => setWeather(value)} disabled={disabled} aria-pressed={weather === value}>
          <span className="text-xl" aria-hidden>{icon}</span><span>{weatherLabel}</span>
        </Button>)}
      </div>
    </SolverSection>}

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText={result ? `Get day ${result.day + 1} combination` : restart ? "Start new run" : "Get first combination"} />
    <ErrorAlert error={error} />

    {result && <SolverSection title={`Day ${result.day}: create ${label(result.creates)}`} className="border-emerald-500/40">
      <div className="flex items-center justify-center gap-3 text-center">
        {[result.first, result.second].map((element) => <span key={element} className="min-w-28 rounded-lg border border-primary/40 bg-primary/5 px-4 py-3 text-lg font-bold">{label(element)}</span>)}
      </div>
      <p className="mt-3 text-center text-sm text-muted-foreground">Combine these two displayed elements{isSolved ? ` to finish with ${label(result.target)}.` : ` to create ${label(result.creates)}.`}</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Combine the shown pair, then enter the new day's weather. If any combination strikes, use Reset and re-enter the reshuffled starting elements and Day 1 weather.</SolverInstructions>
  </SolverLayout>;
}
