import { useCallback, useMemo, useState } from "react";
import { solveFontSelect, type FontSelectOutput } from "../../services/fontSelectService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverResult, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const PHRASES = [
  "Eight Ate 8", "Jokes on you! I’m the male.", "Jokes on you! I’m male.",
  "Testing, testing, 1 to 3", "Yew R. Wonn", "Jokes on you! I’m the mail.",
  "Ewe Arr Won", "888", "U.R. 1", "You are one", "Ate, Ate, Ate", "8 ate eight",
  "Testing, testing, 123", "Testing, testing, 1-3", "Jokes on you! I’m female.",
  "Testing, testing, 1 two 3",
];
const FONTS = [
  "Special Elite", "Gochi Hand", "Day Poster Black", "Indie Flower", "Coming Soon",
  "Anonymous Pro", "Rock Salt", "Chewy", "Lobster", "Ostrich Sans", "Karma", "Merriweather",
];
const selectClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export default function FontSelectSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [phrase, setPhrase] = useState(PHRASES[0]);
  const [fonts, setFonts] = useState(FONTS.slice(0, 3));
  const [currentFont, setCurrentFont] = useState(FONTS[0]);
  const [result, setResult] = useState<FontSelectOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(
    () => ({ phrase, fonts, currentFont, result, twitchCommand }),
    [phrase, fonts, currentFont, result, twitchCommand],
  );

  const restoreSolution = useCallback((solution: FontSelectOutput) => {
    setResult(solution);
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.FONT_SELECT, result: solution }));
  }, []);
  useSolverModulePersistence<typeof moduleState, FontSelectOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (PHRASES.includes(state.phrase)) setPhrase(state.phrase);
      if (state.fonts?.length === 3) setFonts(state.fonts);
      if (state.currentFont) setCurrentFont(state.currentFont);
      if (state.result) setResult(state.result);
      if (state.twitchCommand) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: restoreSolution,
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (new Set(fonts).size !== 3) return setError("Select three different fonts");
    clearError(); setIsLoading(true);
    try {
      const response = await solveFontSelect(round.id, bomb.id, currentModule.id, phrase, fonts, currentFont);
      const command = generateTwitchCommand({ moduleType: ModuleType.FONT_SELECT, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id, { phrase, fonts, currentFont, result: response.output, twitchCommand: command },
        response.output, response.solved,
      );
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Font Select"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, phrase, fonts, currentFont, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setPhrase(PHRASES[0]); setFonts(FONTS.slice(0, 3)); setCurrentFont(FONTS[0]);
    setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  const updateFont = (index: number, font: string) => {
    const next = fonts.map((value, position) => position === index ? font : value);
    setFonts(next);
    if (!next.includes(currentFont)) setCurrentFont(font);
    setResult(null); setTwitchCommand(""); clearError();
  };

  return <SolverLayout>
    <SolverSection title="Displayed phrase">
      <label className="text-sm font-medium" htmlFor="font-select-phrase">Phrase</label>
      <select id="font-select-phrase" className={selectClass} value={phrase} onChange={(event) => setPhrase(event.target.value)} disabled={isLoading || isSolved}>
        {PHRASES.map((value) => <option key={value}>{value}</option>)}
      </select>
    </SolverSection>
    <SolverSection title="Available fonts" description="Enter them in right-arrow order.">
      <div className="grid gap-3 sm:grid-cols-3">
        {fonts.map((font, index) => <label key={index} className="text-sm font-medium">
          Font {index + 1}
          <select className={selectClass} value={font} onChange={(event) => updateFont(index, event.target.value)} disabled={isLoading || isSolved}>
            {FONTS.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>)}
      </div>
      <label className="mt-3 block text-sm font-medium">
        Currently visible
        <select className={selectClass} value={currentFont} onChange={(event) => setCurrentFont(event.target.value)} disabled={isLoading || isSolved}>
          {fonts.map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Select font" />
    <ErrorAlert error={error} />
    {result && <SolverResult variant="success" title="Submit this font" description={result.targetFont} />}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Use the arrows until the target font is visible, then submit.</SolverInstructions>
  </SolverLayout>;
}
