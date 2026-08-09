import { useCallback, useMemo, useState } from "react";
import {
  TIME_KEEPER_COLORS,
  solveTimeKeeper,
  type TimeKeeperColor,
  type TimeKeeperInput,
  type TimeKeeperOutput,
} from "../../services/timeKeeperService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Input } from "../ui";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const initialMonth = new Date().getMonth() + 1;
const initialLeds: TimeKeeperColor[] = ["RED", "RED", "RED"];

interface SavedState extends Partial<TimeKeeperInput> {
  input?: Partial<TimeKeeperInput>;
  result?: TimeKeeperOutput | null;
  twitchCommand?: string;
}

export default function TimeKeeperSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [displayedNumber, setDisplayedNumber] = useState(1);
  const [displayedColor, setDisplayedColor] = useState<TimeKeeperColor>("RED");
  const [ledColors, setLedColors] = useState<TimeKeeperColor[]>(initialLeds);
  const [activationMonth, setActivationMonth] = useState(initialMonth);
  const [result, setResult] = useState<TimeKeeperOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ displayedNumber, displayedColor, ledColors, activationMonth, result, twitchCommand }),
    [displayedNumber, displayedColor, ledColors, activationMonth, result, twitchCommand]);

  useSolverModulePersistence<SavedState, TimeKeeperOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      const input = saved.input ?? saved;
      if (input.displayedNumber !== undefined) setDisplayedNumber(input.displayedNumber);
      if (input.displayedColor) setDisplayedColor(input.displayedColor);
      if (input.ledColors?.length === 3) setLedColors(input.ledColors);
      if (input.activationMonth !== undefined) setActivationMonth(input.activationMonth);
      if (saved.result !== undefined) setResult(saved.result);
      if (saved.twitchCommand !== undefined) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: TimeKeeperOutput) => {
      if (!solution || !Number.isInteger(solution.correctLed)) return;
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.THE_TIME_KEEPER, result: solution }));
    }, []),
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as TimeKeeperOutput & { output?: TimeKeeperOutput };
      return value.output ?? value;
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const clearResult = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const updateLed = (index: number, color: TimeKeeperColor) => {
    setLedColors((current) => current.map((value, position) => position === index ? color : value));
    clearResult();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (displayedNumber < 1 || displayedNumber > 50) return setError("Displayed number must be between 1 and 50");
    clearError(); setIsLoading(true);
    try {
      const input: TimeKeeperInput = { displayedNumber, displayedColor, ledColors, activationMonth };
      const response = await solveTimeKeeper(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.THE_TIME_KEEPER, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve The Time Keeper"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, displayedNumber, displayedColor, ledColors, activationMonth, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setDisplayedNumber(1); setDisplayedColor("RED"); setLedColors(initialLeds); setActivationMonth(initialMonth);
    setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Module display" description="Enter the two-digit display and its color.">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Displayed number
          <Input aria-label="Displayed number" type="number" min={1} max={50} value={displayedNumber} onChange={(event) => { setDisplayedNumber(Number(event.target.value)); clearResult(); }} disabled={isLoading || isSolved} className="mt-1" />
        </label>
        <label className="text-sm font-medium">Display color
          <select aria-label="Display color" value={displayedColor} onChange={(event) => { setDisplayedColor(event.target.value as TimeKeeperColor); clearResult(); }} disabled={isLoading || isSolved} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3">
            {TIME_KEEPER_COLORS.map((color) => <option key={color}>{color}</option>)}
          </select>
        </label>
      </div>
    </SolverSection>
    <SolverSection title="LED colors" description="Enter the three LEDs in reading order.">
      <div className="grid gap-3 sm:grid-cols-3">
        {ledColors.map((color, index) => <label key={index} className="text-sm font-medium">LED {index + 1}
          <select aria-label={`LED ${index + 1} color`} value={color} onChange={(event) => updateLed(index, event.target.value as TimeKeeperColor)} disabled={isLoading || isSolved} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3">
            {TIME_KEEPER_COLORS.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>)}
      </div>
    </SolverSection>
    <SolverSection title="Activation month" description="Use the local month when the bomb was activated.">
      <select aria-label="Bomb activation month" value={activationMonth} onChange={(event) => { setActivationMonth(Number(event.target.value)); clearResult(); }} disabled={isLoading || isSolved} className="block h-11 w-full rounded-md border border-input bg-background px-3">
        {MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
      </select>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find LED and time" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Correct press" className="border-emerald-500/40">
      <p className="text-center text-2xl font-semibold">LED {result.correctLed}</p>
      <p className="mt-2 text-center">Press with {result.finalNumber} seconds remaining (±2 seconds).</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Any whole value of the final number multiplied by a power of two is also accepted. Avoid pressing with 10 seconds or less remaining.</SolverInstructions>
  </SolverLayout>;
}
