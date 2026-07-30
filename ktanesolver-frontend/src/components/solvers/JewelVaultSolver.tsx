import { useCallback, useMemo, useState } from "react";
import {
  solveJewelVault,
  type GreekLetter,
  type Jewel,
  type JewelVaultOutput,
  type JewelVaultWheel,
} from "../../services/jewelVaultService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const JEWELS: { value: Jewel; label: string }[] = [
  { value: "AMETHYST", label: "Amethyst (purple)" },
  { value: "EMERALD", label: "Emerald (green)" },
  { value: "GLASS", label: "Glass (clear)" },
  { value: "ONYX", label: "Onyx (black)" },
  { value: "POUDRETTEITE", label: "Poudretteite (pink)" },
  { value: "RUBY", label: "Ruby (red)" },
  { value: "SAPPHIRE", label: "Sapphire (blue)" },
  { value: "SCAPOLITE", label: "Scapolite (yellow)" },
];
const LETTERS: { value: GreekLetter; label: string }[][] = [
  [["ALPHA", "α"], ["BETA", "β"], ["GAMMA", "γ"], ["DELTA", "δ"], ["EPSILON", "ε"], ["ZETA", "ζ"]],
  [["ETA", "η"], ["THETA", "θ"], ["IOTA", "ι"], ["KAPPA", "κ"], ["LAMBDA", "λ"], ["MU", "μ"]],
  [["NU", "ν"], ["XI", "ξ"], ["OMICRON", "ο"], ["PI", "π"], ["RHO", "ρ"], ["SIGMA", "σ"]],
  [["TAU", "τ"], ["UPSILON", "υ"], ["PHI", "φ"], ["CHI", "χ"], ["PSI", "ψ"], ["OMEGA", "ω"]],
].map((group) => group.map(([value, label]) => ({ value: value as GreekLetter, label })));
const POSITIONS = ["North", "East", "South", "West"];
const INITIAL_JEWELS = JEWELS.slice(0, 4).map(({ value }) => value);
const initialWheels = (): JewelVaultWheel[] => LETTERS.map((letters) => ({
  jewelsClockwiseFromNorth: [...INITIAL_JEWELS],
  firstLetter: letters[0].value,
  secondLetter: letters[1].value,
}));
const selectClass = "mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm";
const jewelName = (jewel: Jewel) => JEWELS.find(({ value }) => value === jewel)?.label.replace(/\s+\(.*/, "") ?? jewel;

export default function JewelVaultSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [wheels, setWheels] = useState(initialWheels);
  const [physicalWheelsByLetter, setPhysicalWheelsByLetter] = useState([1, 2, 3, 4]);
  const [result, setResult] = useState<JewelVaultOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(
    () => ({ wheels, physicalWheelsByLetter, result, twitchCommand }),
    [wheels, physicalWheelsByLetter, result, twitchCommand],
  );

  const restoreSolution = useCallback((solution: JewelVaultOutput) => {
    setResult(solution);
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.JEWEL_VAULT, result: solution }));
  }, []);
  useSolverModulePersistence<typeof moduleState, JewelVaultOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (state.wheels?.length === 4) setWheels(state.wheels);
      if (state.physicalWheelsByLetter?.length === 4) setPhysicalWheelsByLetter(state.physicalWheelsByLetter);
      if (state.result) setResult(state.result);
      if (state.twitchCommand) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: restoreSolution,
    currentModule,
    setIsSolved,
  });

  const clearResult = () => {
    setResult(null);
    setTwitchCommand("");
    clearError();
  };
  const updateWheel = (wheelIndex: number, patch: Partial<JewelVaultWheel>) => {
    setWheels((current) => current.map((wheel, index) => index === wheelIndex ? { ...wheel, ...patch } : wheel));
    clearResult();
  };
  const updateJewel = (wheelIndex: number, position: number, jewel: Jewel) => {
    const values = wheels[wheelIndex].jewelsClockwiseFromNorth.map((value, index) => index === position ? jewel : value);
    updateWheel(wheelIndex, { jewelsClockwiseFromNorth: values });
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (wheels.some((wheel) => new Set(wheel.jewelsClockwiseFromNorth).size !== 4)) {
      return setError("Each wheel must contain four different jewels");
    }
    if (new Set(physicalWheelsByLetter).size !== 4) return setError("Assign each physical wheel exactly once");
    clearError(); setIsLoading(true);
    try {
      const response = await solveJewelVault(round.id, bomb.id, currentModule.id, { wheels, physicalWheelsByLetter });
      const command = generateTwitchCommand({ moduleType: ModuleType.JEWEL_VAULT, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id, { wheels, physicalWheelsByLetter, result: response.output, twitchCommand: command },
        response.output, response.solved,
      );
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve The Jewel Vault"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, wheels, physicalWheelsByLetter, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setWheels(initialWheels()); setPhysicalWheelsByLetter([1, 2, 3, 4]);
    setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Wheel layouts" description="For each physical wheel, read positions clockwise from the compass north marker.">
      <div className="space-y-4">
        {wheels.map((wheel, wheelIndex) => <fieldset key={wheelIndex} className="rounded-md border p-3">
          <legend className="px-1 font-semibold">Wheel {wheelIndex + 1}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["firstLetter", "secondLetter"] as const).map((field, runeIndex) => <label key={field} className="text-sm font-medium">
              Greek letter {runeIndex + 1}
              <select
                className={selectClass}
                value={wheel[field]}
                onChange={(event) => updateWheel(wheelIndex, { [field]: event.target.value as GreekLetter })}
                disabled={isLoading || isSolved}
              >
                {LETTERS[wheelIndex].map((letter) => <option key={letter.value} value={letter.value}>{letter.label}</option>)}
              </select>
            </label>)}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {wheel.jewelsClockwiseFromNorth.map((jewel, position) => <label key={position} className="text-sm font-medium">
              {POSITIONS[position]}
              <select
                className={selectClass}
                value={jewel}
                onChange={(event) => updateJewel(wheelIndex, position, event.target.value as Jewel)}
                disabled={isLoading || isSolved}
              >
                {JEWELS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>)}
          </div>
        </fieldset>)}
      </div>
    </SolverSection>

    <SolverSection title="Wheel mechanics" description="Assign the physical wheel number for each hidden lettered wheel.">
      <div className="grid gap-3 sm:grid-cols-4">
        {physicalWheelsByLetter.map((physicalWheel, letter) => <label key={letter} className="text-sm font-medium">
          Wheel {String.fromCharCode(65 + letter)}
          <select
            className={selectClass}
            value={physicalWheel}
            onChange={(event) => {
              setPhysicalWheelsByLetter((current) => current.map((value, index) => index === letter ? Number(event.target.value) : value));
              clearResult();
            }}
            disabled={isLoading || isSolved}
          >
            {[1, 2, 3, 4].map((wheel) => <option key={wheel} value={wheel}>Physical wheel {wheel}</option>)}
          </select>
        </label>)}
      </div>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Solve vault" />
    <ErrorAlert error={error} />
    {result && <SolverSection title={`Target orientation: ${result.targetOrientation}`}>
      <div className="grid gap-2 sm:grid-cols-4">
        {result.correctJewels.map((jewel, index) => <div key={index} className="rounded-md border p-3 text-center">
          <div className="text-xs text-muted-foreground">Wheel {index + 1}</div>
          <div className="font-semibold">{jewelName(jewel)}</div>
        </div>)}
      </div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>
      A turns only itself; B also turns A counter-clockwise; C also turns B; D also turns C. The generated sequence resets first and stays below the 13-turn shuffle limit.
    </SolverInstructions>
  </SolverLayout>;
}
