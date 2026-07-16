import { useCallback, useMemo, useState } from "react";

import { solveYahtzee, type YahtzeeOutput } from "../../services/yahtzeeService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { Button } from "../ui";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const COLORS = [
  { code: "PURPLE", name: "Purple", className: "border-purple-700 bg-purple-600 text-white" },
  { code: "YELLOW", name: "Yellow", className: "border-yellow-500 bg-yellow-300 text-slate-950" },
  { code: "BLUE", name: "Blue", className: "border-blue-700 bg-blue-600 text-white" },
  { code: "WHITE", name: "White", className: "border-slate-300 bg-white text-slate-950" },
  { code: "BLACK", name: "Black", className: "border-slate-950 bg-slate-900 text-white" },
];
const emptyDice = () => Array<string>(5).fill("");

type PersistedState = {
  dice?: number[];
  rollNumber?: number;
};

export default function YahtzeeSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [dice, setDice] = useState(emptyDice);
  const [rollNumber, setRollNumber] = useState(0);
  const [result, setResult] = useState<YahtzeeOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const savedState = useMemo(() => ({ dice: dice.map(Number), rollNumber }), [dice, rollNumber]);

  useSolverModulePersistence<PersistedState, YahtzeeOutput>({
    state: savedState,
    onRestoreState: useCallback((state) => {
      if (state.dice?.length === 5) setDice(state.dice.map(String));
      if (typeof state.rollNumber === "number") setRollNumber(state.rollNumber);
    }, []),
    onRestoreSolution: useCallback((solution: YahtzeeOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.YAHTZEE, result: solution }));
    }, []),
    extractSolution: (raw) => raw && typeof raw === "object" && "action" in raw ? raw as YahtzeeOutput : null,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | null)?.solved),
    currentModule,
    setIsSolved,
  });

  const validInput = dice.every((value) => /^[1-6]$/.test(value));
  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!validInput) return setError("Select a value for all five dice");
    clearError(); setIsLoading(true);
    try {
      const numericDice = dice.map(Number);
      const response = await solveYahtzee(round.id, bomb.id, currentModule.id, { dice: numericDice });
      const command = generateTwitchCommand({ moduleType: ModuleType.YAHTZEE, result: response.output });
      setRollNumber(response.output.rollNumber); setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, {
        dice: numericDice,
        rollNumber: response.output.rollNumber,
        keptColors: response.output.keepColors,
        nextRollCount: response.output.rerollColors.length,
      }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Yahtzee"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, dice, validInput, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const enterNextRoll = () => {
    if (!result) return;
    setDice((current) => current.map((value, index) => result.keepColors.includes(COLORS[index].code) ? value : ""));
    setResult(null); setTwitchCommand(""); clearError();
  };

  return <SolverLayout>
    {!result && !isSolved && <SolverSection title={`Roll ${rollNumber + 1}`} description="Enter each die by its color after the roll finishes.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {COLORS.map((color, index) => <label key={color.code} className={`rounded-lg border-2 p-3 text-center font-semibold shadow-sm ${color.className}`}>
          {color.name}
          <select
            value={dice[index]}
            onChange={(event) => setDice((current) => current.map((value, i) => i === index ? event.target.value : value))}
            disabled={isLoading}
            aria-label={`${color.name} die value`}
            className="mt-2 block h-11 w-full rounded-md border border-slate-400 bg-white px-2 text-center text-lg font-bold text-slate-950"
          >
            <option value="">–</option>
            {[1, 2, 3, 4, 5, 6].map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>)}
      </div>
    </SolverSection>}

    {!result && !isSolved && <SolverControls onSolve={solve} onReset={() => setDice(emptyDice())} showReset={false} isSolveDisabled={!validInput} isLoading={isLoading} isSolved={isSolved} solveText="Choose dice to keep" />}
    <ErrorAlert error={error} />

    {result && <SolverSection
      title={result.action === "SOLVED" ? "Yahtzee!" : result.action === "ROLL_ALL" ? "Reroll all five dice" : `Keep ${result.keepColors.map((color) => color.toLowerCase()).join(" and ")}`}
      description={result.action === "SOLVED" ? "All five dice match; the module is solved." : `Reroll ${result.rerollColors.map((color) => color.toLowerCase()).join(", ")}.`}
      className="border-emerald-500/40"
    >
      <div className="flex flex-wrap justify-center gap-2" aria-label="Dice to keep">
        {result.keepColors.map((code) => {
          const color = COLORS.find((candidate) => candidate.code === code)!;
          return <span key={code} className={`rounded-md border-2 px-4 py-2 font-semibold ${color.className}`}>{color.name}</span>;
        })}
      </div>
      {!isSolved && <Button type="button" onClick={enterNextRoll} className="mt-4 w-full">Enter the next roll</Button>}
    </SolverSection>}

    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Keep only the listed dice, roll every other die, then enter all five resulting values. Kept values are carried into the next form automatically.</SolverInstructions>
  </SolverLayout>;
}
