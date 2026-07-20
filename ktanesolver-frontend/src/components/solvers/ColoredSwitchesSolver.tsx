import { useState } from "react";
import {
  solveColoredSwitches,
  type ColoredSwitchColor,
  type ColoredSwitchesOutput,
} from "../../services/coloredSwitchesService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { cn } from "../../lib/cn";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverResult,
  SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const COLORS: ColoredSwitchColor[] = ["RED", "GREEN", "BLUE", "PURPLE", "ORANGE", "TURQUOISE"];
const COLOR_CLASSES: Record<ColoredSwitchColor, string> = {
  RED: "bg-red-600", GREEN: "bg-green-600", BLUE: "bg-blue-600",
  PURPLE: "bg-purple-600", ORANGE: "bg-orange-500", TURQUOISE: "bg-cyan-400",
};
const DOWN = [false, false, false, false, false];

type PersistedState = {
  switchColors?: ColoredSwitchColor[];
  currentSwitches?: boolean[];
  ledPositions?: boolean[];
  ledsVisible?: boolean;
  result?: ColoredSwitchesOutput | null;
};

export default function ColoredSwitchesSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [switchColors, setSwitchColors] = useState<ColoredSwitchColor[]>([...COLORS.slice(0, 5)]);
  const [currentSwitches, setCurrentSwitches] = useState<boolean[]>([...DOWN]);
  const [ledPositions, setLedPositions] = useState<boolean[]>([...DOWN]);
  const [ledsVisible, setLedsVisible] = useState(false);
  const [result, setResult] = useState<ColoredSwitchesOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);

  useSolverModulePersistence<PersistedState, ColoredSwitchesOutput>({
    state: { switchColors, currentSwitches, ledPositions, ledsVisible, result },
    onRestoreState: (state) => {
      if (state.switchColors?.length === 5) setSwitchColors(state.switchColors);
      if (state.currentSwitches?.length === 5) setCurrentSwitches(state.currentSwitches);
      if (state.ledPositions?.length === 5) setLedPositions(state.ledPositions);
      if (state.ledsVisible !== undefined) setLedsVisible(state.ledsVisible);
      if (state.result !== undefined) setResult(state.result);
    },
    onRestoreSolution: setResult,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean })?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError();
    setIsLoading(true);
    try {
      const response = await solveColoredSwitches(round.id, bomb.id, currentModule.id, {
        switchColors, currentSwitches, ledPositions: ledsVisible ? ledPositions : null,
      });
      const nextSwitches = response.output.enterLedPositions
        ? response.output.solutionSteps.reduce((positions, step) => {
            positions[step - 1] = !positions[step - 1];
            return positions;
          }, [...currentSwitches])
        : currentSwitches;
      const nextLedsVisible = ledsVisible || response.output.enterLedPositions;
      setCurrentSwitches(nextSwitches);
      setLedsVisible(nextLedsVisible);
      setResult(response.output);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id,
        { switchColors, currentSwitches: nextSwitches, ledPositions, ledsVisible: nextLedsVisible, result: response.output },
        response.output, response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Colored Switches");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setSwitchColors([...COLORS.slice(0, 5)]);
    setCurrentSwitches([...DOWN]);
    setLedPositions([...DOWN]);
    setLedsVisible(false);
    setResult(null);
    resetSolverState();
  };

  const twitchCommand = result ? generateTwitchCommand({ moduleType: ModuleType.COLORED_SWITCHES, result }) : "";

  return <SolverLayout>
    <SolverSection
      title={ledsVisible ? "Switch and LED positions" : "Initial switches"}
      description="Set each color and switch position from left to right. Up means the switch points toward the top LED."
    >
      <div className="grid grid-cols-5 gap-2" role="group" aria-label="Colored switches">
        {currentSwitches.map((isUp, index) => <div key={index} className="flex min-w-0 flex-col items-center gap-2">
          <select
            value={switchColors[index]}
            onChange={(event) => setSwitchColors((colors) => colors.map((color, i) => i === index ? event.target.value as ColoredSwitchColor : color))}
            disabled={isLoading || isSolved || ledsVisible}
            aria-label={`Switch ${index + 1} color`}
            className="h-9 w-full rounded-md border border-input bg-background px-1 text-xs"
          >
            {COLORS.map((color) => <option key={color} value={color}>{color[0] + color.slice(1).toLowerCase()}</option>)}
          </select>
          {ledsVisible && <button
            type="button"
            onClick={() => setLedPositions((positions) => positions.map((up, i) => i === index ? true : up))}
            disabled={isLoading || isSolved}
            aria-label={`Switch ${index + 1} top LED${ledPositions[index] ? ", lit" : ""}`}
            aria-pressed={ledPositions[index]}
            className={cn("h-5 w-5 rounded-full border", ledPositions[index] ? "border-amber-300 bg-amber-400" : "border-border bg-muted")}
          />}
          <button
            type="button"
            onClick={() => setCurrentSwitches((positions) => positions.map((up, i) => i === index ? !up : up))}
            disabled={isLoading || isSolved}
            aria-label={`Switch ${index + 1}, ${isUp ? "up" : "down"}`}
            aria-pressed={isUp}
            className={cn("relative h-16 w-10 rounded-md border border-border", COLOR_CLASSES[switchColors[index]])}
          >
            <span className={cn("absolute left-1/2 h-6 w-2 -translate-x-1/2 rounded bg-white shadow transition-all", isUp ? "top-1" : "bottom-1")} />
          </button>
          {ledsVisible && <button
            type="button"
            onClick={() => setLedPositions((positions) => positions.map((up, i) => i === index ? false : up))}
            disabled={isLoading || isSolved}
            aria-label={`Switch ${index + 1} bottom LED${!ledPositions[index] ? ", lit" : ""}`}
            aria-pressed={!ledPositions[index]}
            className={cn("h-5 w-5 rounded-full border", !ledPositions[index] ? "border-amber-300 bg-amber-400" : "border-border bg-muted")}
          />}
          <span className="text-xs text-muted-foreground">{index + 1}</span>
        </div>)}
      </div>
    </SolverSection>

    <SolverControls
      onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved}
      solveText={ledsVisible ? "Solve" : "Get three safe toggles"}
    />
    <ErrorAlert error={error} />
    {result && <SolverResult
      variant={isSolved ? "success" : "info"}
      title={result.solutionSteps.length ? `Flip ${result.solutionSteps.join(" → ")}` : "No flips needed"}
      description={result.instruction}
    />}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>
      First request three safe toggles. Perform them in order; the form advances to the resulting switch state. Then select each lit LED and solve again.
    </SolverInstructions>
  </SolverLayout>;
}
