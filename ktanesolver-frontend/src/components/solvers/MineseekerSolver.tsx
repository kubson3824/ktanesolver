import { useCallback, useMemo, useState } from "react";
import {
  MINESEEKER_COLORS, MINESEEKER_IMAGES, mineseekerImageUrl, solveMineseeker,
  type MineseekerColor, type MineseekerImage, type MineseekerInput, type MineseekerOutput,
} from "../../services/mineseekerService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

type SavedState = Partial<MineseekerInput> & { input?: Partial<MineseekerInput>; result?: MineseekerOutput | null; twitchCommand?: string; twoFactorText?: string };

export default function MineseekerSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [startImage, setStartImage] = useState<MineseekerImage>("85");
  const [backgroundColor, setBackgroundColor] = useState<MineseekerColor>("WHITE");
  const [twoFactorText, setTwoFactorText] = useState("");
  const [result, setResult] = useState<MineseekerOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ startImage, backgroundColor, twoFactorText, result, twitchCommand }),
    [startImage, backgroundColor, twoFactorText, result, twitchCommand]);

  useSolverModulePersistence<SavedState, MineseekerOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      const input = saved.input ?? saved;
      if (input.startImage) setStartImage(input.startImage);
      if (input.backgroundColor) setBackgroundColor(input.backgroundColor);
      if (saved.twoFactorText !== undefined) setTwoFactorText(saved.twoFactorText);
      else if (input.twoFactorCodes) setTwoFactorText(input.twoFactorCodes.join(", "));
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: MineseekerOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.MINESEEKER, result: solution }));
    }, []),
    currentModule,
    setIsSolved,
  });

  const clearResult = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    const twoFactorCodes = twoFactorText.trim() ? twoFactorText.trim().split(/[\s,]+/).map(Number) : [];
    if (twoFactorCodes.some((code) => !Number.isInteger(code) || code < 0 || code > 999999)) {
      return setError("Two-Factor codes must be values from 000000 to 999999");
    }
    const input: MineseekerInput = { startImage, backgroundColor, twoFactorCodes };
    clearError(); setIsLoading(true);
    try {
      const response = await solveMineseeker(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.MINESEEKER, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, twoFactorText, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Mineseeker"); }
    finally { setIsLoading(false); }
  };

  const reset = () => {
    setStartImage("85"); setBackgroundColor("WHITE"); setTwoFactorText("");
    setResult(null); setTwitchCommand(""); resetSolverState();
  };

  return <SolverLayout>
    <SolverSection title="Starting image" description="Choose the bomb silhouette currently shown on the colored background.">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {MINESEEKER_IMAGES.map((image) => <button key={image} type="button" aria-label={`Bomb image ${image}`} aria-pressed={startImage === image} onClick={() => { setStartImage(image); clearResult(); }} disabled={isLoading || isSolved} className={`rounded-md border p-2 ${startImage === image ? "border-primary bg-primary/10" : "border-border"}`}>
          <span className="flex h-14 items-center justify-center rounded bg-white"><img src={mineseekerImageUrl(image)} alt="" loading="lazy" className="h-12 w-12 object-contain" /></span>
          <span className="mt-1 block text-xs font-medium">{image}</span>
        </button>)}
      </div>
      <label className="mt-3 block text-sm font-medium">Background color
        <select aria-label="Background color" value={backgroundColor} onChange={(event) => { setBackgroundColor(event.target.value as MineseekerColor); clearResult(); }} disabled={isLoading || isSolved} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3">
          {MINESEEKER_COLORS.map((color) => <option key={color} value={color}>{color.replaceAll("_", " ")}</option>)}
        </select>
      </label>
    </SolverSection>
    <SolverSection title="Two-Factor widgets" description="Leave blank when absent; separate multiple six-digit codes with spaces or commas.">
      <input aria-label="Two-Factor codes" value={twoFactorText} onChange={(event) => { setTwoFactorText(event.target.value); clearResult(); }} disabled={isLoading || isSolved} inputMode="numeric" placeholder="e.g. 123456, 654321" className="block h-11 w-full rounded-md border border-input bg-background px-3" />
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find route" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Route" className="border-emerald-500/40">
      <div className="grid gap-3 text-center sm:grid-cols-3">
        <p>Number<br /><strong>{result.calculatedNumber}</strong></p>
        <p>Destination<br /><span className="inline-flex rounded bg-white p-1"><img src={mineseekerImageUrl(result.destinationImage)} alt={`Destination bomb image ${result.destinationImage}`} className="h-12 w-12 object-contain" /></span></p>
        <p>Moves<br /><strong>{result.moves.length ? result.moves.join(" ") : "Already there"}</strong></p>
      </div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>The generated route avoids every wall and submits on the target image. A wall strike does not regenerate the module; reset this solver only if the physical module itself is reset.</SolverInstructions>
  </SolverLayout>;
}
