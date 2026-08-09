import { useCallback, useMemo, useState } from "react";
import {
  MORSE_WAR_CODES, MORSE_WAR_PATTERNS, solveMorseWar,
  type MorseWarCode, type MorseWarOutput, type MorseWarPattern,
} from "../../services/morseWarService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const glyphs = (pattern: string) => pattern.replaceAll("1", "●").replaceAll("0", "○");

export default function MorseWarSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [topRow, setTopRow] = useState<MorseWarPattern>("1100");
  const [middleRow, setMiddleRow] = useState<MorseWarPattern>("1100");
  const [bottomRow, setBottomRow] = useState<MorseWarPattern>("1100");
  const [morseCode, setMorseCode] = useState<MorseWarCode>("ABR");
  const [result, setResult] = useState<MorseWarOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ topRow, middleRow, bottomRow, morseCode, result, twitchCommand }),
    [topRow, middleRow, bottomRow, morseCode, result, twitchCommand]);

  useSolverModulePersistence<typeof state, MorseWarOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      if (saved.topRow) setTopRow(saved.topRow);
      if (saved.middleRow) setMiddleRow(saved.middleRow);
      if (saved.bottomRow) setBottomRow(saved.bottomRow);
      if (saved.morseCode) setMorseCode(saved.morseCode);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: MorseWarOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.MORSE_WAR, result: solution }));
    }, []),
    currentModule,
    setIsSolved,
  });

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const input = { topRow, middleRow, bottomRow, morseCode };
      const response = await solveMorseWar(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.MORSE_WAR, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Morse War"); }
    finally { setIsLoading(false); }
  };

  const reset = () => {
    setTopRow("1100"); setMiddleRow("1100"); setBottomRow("1100"); setMorseCode("ABR");
    setResult(null); setTwitchCommand(""); resetSolverState();
  };
  const change = (setter: (value: MorseWarPattern) => void) => (value: MorseWarPattern) => {
    setter(value); setResult(null); setTwitchCommand(""); clearError();
  };

  return <SolverLayout>
    <SolverSection title="LED rows" description="Choose each four-LED pattern from left to right; filled circles are lit.">
      <div className="grid gap-3 sm:grid-cols-3">
        {([
          ["Top row", topRow, change(setTopRow)],
          ["Middle row", middleRow, change(setMiddleRow)],
          ["Bottom row", bottomRow, change(setBottomRow)],
        ] as const).map(([label, value, setter]) => <label key={label} className="text-sm font-medium">{label}
          <select aria-label={label} value={value} onChange={(event) => setter(event.target.value as MorseWarPattern)} disabled={isLoading || isSolved} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3 font-mono">
            {MORSE_WAR_PATTERNS.map((pattern) => <option key={pattern} value={pattern}>{glyphs(pattern)}</option>)}
          </select>
        </label>)}
      </div>
    </SolverSection>
    <SolverSection title="Morse transmission">
      <label className="block text-sm font-medium">Decoded three-letter code
        <select aria-label="Decoded three-letter code" value={morseCode} onChange={(event) => { setMorseCode(event.target.value as MorseWarCode); setResult(null); setTwitchCommand(""); clearError(); }} disabled={isLoading || isSolved} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3">
          {MORSE_WAR_CODES.map((code) => <option key={code}>{code}</option>)}
        </select>
      </label>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Identify targets" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Fire sequence" className="border-emerald-500/40">
      <p className="text-center text-sm">Lookup number: <strong>{result.tableNumber}</strong></p>
      <p className="mt-2 text-center text-2xl font-semibold tracking-[0.35em]">{result.presses.join("")}</p>
      <p className="mt-2 text-center text-sm text-muted-foreground">S = supply ship · U = submarine</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Press the four targets in order. A wrong four-button sequence regenerates all LEDs and the Morse code, so reset this solver before entering the replacement observation.</SolverInstructions>
  </SolverLayout>;
}
