import { useState } from "react";
import { solveTheWire, type TheWireColor, type TheWireOutput } from "../../services/theWireService";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverResult,
  SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const COLORS: TheWireColor[] = ["BLUE", "GREEN", "GREY", "ORANGE", "PURPLE", "RED"];
const initialColors: TheWireColor[] = ["BLUE", "GREEN", "PURPLE", "RED"];

type PersistedState = {
  colors?: TheWireColor[];
  displayedNumber?: number;
  initiationCount?: number;
  result?: TheWireOutput | null;
};

export default function TheWireSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [colors, setColors] = useState<TheWireColor[]>(initialColors);
  const [displayedNumber, setDisplayedNumber] = useState(0);
  const [initiationCount, setInitiationCount] = useState(1);
  const [result, setResult] = useState<TheWireOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();

  useSolverModulePersistence<PersistedState, TheWireOutput>({
    state: { colors, displayedNumber, initiationCount, result },
    onRestoreState: (state) => {
      if (state.colors?.length === 4) setColors(state.colors);
      if (state.displayedNumber !== undefined) setDisplayedNumber(state.displayedNumber);
      if (state.initiationCount !== undefined) setInitiationCount(state.initiationCount);
      if (state.result !== undefined) setResult(state.result);
    },
    onRestoreSolution: setResult,
    currentModule,
    setIsSolved,
  });

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError();
    setIsLoading(true);
    try {
      const response = await solveTheWire(round.id, bomb.id, currentModule.id, {
        dial1Color: colors[0],
        dial2Color: colors[1],
        dial3Color: colors[2],
        wireColor: colors[3],
        displayedNumber,
        initiationCount,
      });
      setResult(response.output);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve The Wire");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setColors(initialColors);
    setDisplayedNumber(0);
    setInitiationCount(1);
    setResult(null);
    resetSolverState();
  };

  const twitchCommand = result ? generateTwitchCommand({ moduleType: ModuleType.THE_WIRE, result }) : "";
  const labels = ["Dial 1", "Dial 2", "Dial 3", "Wire"];

  return <SolverLayout>
    <SolverSection title="Exposed colors" description="Enter the three dial colors in reading order and the wire color.">
      <div className="grid gap-3 sm:grid-cols-2">
        {labels.map((label, index) => <label key={label} className="text-sm font-medium">
          {label}
          <select
            value={colors[index]}
            onChange={(event) => setColors((values) => values.map((value, i) => i === index ? event.target.value as TheWireColor : value))}
            disabled={isLoading || isSolved}
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"
          >
            {COLORS.map((color) => <option key={color} value={color}>{color[0] + color.slice(1).toLowerCase()}</option>)}
          </select>
        </label>)}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">
          Displayed number
          <input type="number" min={0} max={9} value={displayedNumber}
            onChange={(event) => setDisplayedNumber(Number(event.target.value))}
            disabled={isLoading || isSolved}
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3" />
        </label>
        <label className="text-sm font-medium">
          Initiation number
          <input type="number" min={1} value={initiationCount}
            onChange={(event) => setInitiationCount(Number(event.target.value))}
            disabled={isLoading || isSolved}
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3" />
        </label>
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverResult
      title={`Set ${result.dial1} · ${result.dial2} · ${result.dial3}`}
      description={`Cut when the last seconds digit is ${result.cutSecond}.`}
    />}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>
      Press Initiate first. If the display retracts and you initiate again, increase the initiation number before solving.
    </SolverInstructions>
  </SolverLayout>;
}
