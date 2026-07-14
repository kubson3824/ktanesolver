import { useCallback, useMemo, useState } from "react";
import { solveLedEncryption, type LedColor, type LedEncryptionOutput } from "../../services/ledEncryptionService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { cn } from "../../lib/cn";
import { Input } from "../ui";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, StageIndicator, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const LEDS: readonly { color: LedColor; label: string; multiplier: number; className: string }[] = [
  { color: "RED", label: "Red", multiplier: 2, className: "border-red-500 bg-red-500/20 text-red-700 dark:text-red-300" },
  { color: "GREEN", label: "Green", multiplier: 3, className: "border-green-500 bg-green-500/20 text-green-700 dark:text-green-300" },
  { color: "BLUE", label: "Blue", multiplier: 4, className: "border-blue-500 bg-blue-500/20 text-blue-700 dark:text-blue-300" },
  { color: "YELLOW", label: "Yellow", multiplier: 5, className: "border-yellow-500 bg-yellow-500/20 text-yellow-700 dark:text-yellow-300" },
  { color: "PURPLE", label: "Purple", multiplier: 6, className: "border-purple-500 bg-purple-500/20 text-purple-700 dark:text-purple-300" },
  { color: "ORANGE", label: "Orange", multiplier: 7, className: "border-orange-500 bg-orange-500/20 text-orange-700 dark:text-orange-300" },
];
const POSITIONS = ["Top left", "Top right", "Bottom left", "Bottom right"];

interface SavedState {
  totalStages: number;
  stageLetters: string[][];
  stageColors: LedColor[];
}

export default function LedEncryptionSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [totalStages, setTotalStages] = useState(2);
  const [stageLetters, setStageLetters] = useState<string[][]>([]);
  const [stageColors, setStageColors] = useState<LedColor[]>([]);
  const [ledColor, setLedColor] = useState<LedColor>("RED");
  const [letters, setLetters] = useState(["", "", "", ""]);
  const [result, setResult] = useState<LedEncryptionOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const savedState = useMemo(() => ({ totalStages, stageLetters, stageColors }), [totalStages, stageLetters, stageColors]);
  const currentStage = stageLetters.length + 1;

  useSolverModulePersistence<SavedState, LedEncryptionOutput>({
    state: savedState,
    onRestoreState: useCallback((saved) => {
      if (saved.totalStages >= 2 && saved.totalStages <= 5) setTotalStages(saved.totalStages);
      if (Array.isArray(saved.stageLetters)) setStageLetters(saved.stageLetters);
      if (Array.isArray(saved.stageColors)) setStageColors(saved.stageColors);
    }, []),
    onRestoreSolution: useCallback((solution: LedEncryptionOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.LED_ENCRYPTION, result: solution }));
    }, []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const setLetter = (index: number, value: string) => {
    const next = [...letters];
    next[index] = value.toUpperCase().replace(/[^A-Z]/g, "").slice(-1);
    setLetters(next);
    clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (letters.some((letter) => !letter)) return setError("Enter all four letters");
    if (new Set(letters).size !== 4) return setError("The four letters must be different");
    clearError(); setIsLoading(true);
    try {
      const response = await solveLedEncryption(round.id, bomb.id, currentModule.id, { ledColor, letters, totalStages });
      const nextLetters = [...stageLetters, letters];
      const nextColors = [...stageColors, ledColor];
      const command = generateTwitchCommand({ moduleType: ModuleType.LED_ENCRYPTION, result: response.output });
      setStageLetters(nextLetters); setStageColors(nextColors); setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      else { setLetters(["", "", "", ""]); setLedColor("RED"); }
      updateModuleAfterSolve(bomb.id, currentModule.id, { totalStages, stageLetters: nextLetters, stageColors: nextColors }, response.output, response.solved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve LED Encryption");
    } finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, ledColor, letters, totalStages, stageLetters, stageColors, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const distinctLetters = letters.every(Boolean) && new Set(letters).size === 4;

  return <SolverLayout>
    <SolverSection title="Stage progress" description={isSolved ? `All ${totalStages} stages complete.` : `Stage ${currentStage} of ${totalStages}`}>
      <StageIndicator total={totalStages} current={isSolved ? totalStages + 1 : currentStage} completedThrough={stageLetters.length} />
      {stageLetters.length === 0 && <label className="mt-4 block text-sm font-medium">Total LEDs / stages
        <select value={totalStages} onChange={(event) => setTotalStages(Number(event.target.value))} className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          {[2, 3, 4, 5].map((count) => <option key={count} value={count}>{count}</option>)}
        </select>
      </label>}
    </SolverSection>

    {!isSolved && <>
      <SolverSection title={`Stage ${currentStage} LED`} description="Select the color of the LED for this stage.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {LEDS.map((led) => <button key={led.color} type="button" onClick={() => { setLedColor(led.color); clearError(); }} aria-pressed={ledColor === led.color} className={cn("rounded-md border-2 px-3 py-2 text-sm font-semibold transition", led.className, ledColor === led.color ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : "opacity-60 hover:opacity-100")}>
            {led.label} ×{led.multiplier}
          </button>)}
        </div>
      </SolverSection>

      <SolverSection title="Button letters" description="Enter the letters in their 2×2 positions.">
        <div className="mx-auto grid max-w-64 grid-cols-2 gap-3">
          {letters.map((letter, index) => <label key={index} className="space-y-1 text-center text-xs font-medium text-muted-foreground">{POSITIONS[index]}
            <Input value={letter} onChange={(event) => setLetter(index, event.target.value)} maxLength={1} autoComplete="off" autoCapitalize="characters" aria-label={`${POSITIONS[index]} letter`} disabled={isLoading} className="h-16 text-center font-mono text-2xl font-bold" />
          </label>)}
        </div>
      </SolverSection>
    </>}

    <SolverControls onSolve={solve} onReset={() => { setLetters(["", "", "", ""]); setResult(null); setTwitchCommand(""); clearError(); }} isSolveDisabled={!distinctLetters} isLoading={isLoading} isSolved={isSolved} solveText={`Solve stage ${currentStage}`} showReset={false} />
    <ErrorAlert error={error} />

    {result && <SolverSection title={`Stage ${result.stage}: press any one`} className="border-emerald-500/40">
      <ul className="flex flex-wrap justify-center gap-2">{result.correctButtons.map((button, index) => <li key={button} className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-center"><div className="text-xs text-muted-foreground">{button.replaceAll("_", " ").toLowerCase()}</div><strong className="font-mono text-2xl">{result.correctLetters[index]}</strong></li>)}</ul>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Press any listed correct button. A strike does not reset completed stages; enter the new letters after the module advances.</SolverInstructions>
  </SolverLayout>;
}
