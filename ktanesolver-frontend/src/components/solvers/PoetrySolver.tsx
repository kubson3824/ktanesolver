import { useCallback, useMemo, useState } from "react";

import {
  POETRY_GIRLS,
  POETRY_WORDS,
  solvePoetry,
  type PoetryGirl,
  type PoetryOutput,
} from "../../services/poetryService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverSection,
  StageIndicator,
  TwitchCommandDisplay,
  useSolver,
  useSolverModulePersistence,
} from "../common";
import { Button } from "../ui";

const emptyWords = () => Array<string>(6).fill("");
const SELECT_CLASS = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

interface PoetryStage {
  words: string[];
  correctWords: string[];
}

interface PersistedState {
  girl?: PoetryGirl;
  stages?: PoetryStage[];
}

export default function PoetrySolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [girl, setGirl] = useState<PoetryGirl>("Melanie");
  const [words, setWords] = useState(emptyWords);
  const [stages, setStages] = useState<PoetryStage[]>([]);
  const [resetStage, setResetStage] = useState(false);
  const [result, setResult] = useState<PoetryOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const savedState = useMemo(() => ({ girl, stages }), [girl, stages]);

  useSolverModulePersistence<PersistedState, PoetryOutput>({
    state: savedState,
    onRestoreState: useCallback((saved) => {
      if (saved.girl && POETRY_GIRLS.includes(saved.girl)) setGirl(saved.girl);
      if (Array.isArray(saved.stages)) setStages(saved.stages);
    }, []),
    onRestoreSolution: useCallback((solution: PoetryOutput) => {
      if (solution?.stage >= 1 && solution.stage <= 3 && Array.isArray(solution.correctWords)) setResult(solution);
    }, []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | null)?.solved),
    currentModule,
    setIsSolved,
  });

  const currentStage = stages.length + 1;
  const valid = words.every(Boolean) && new Set(words).size === 6;
  const twitchCommand = result
    ? generateTwitchCommand({ moduleType: ModuleType.POETRY, result })
    : "";

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!words.every(Boolean)) return setError("Select all six displayed words");
    if (new Set(words).size !== 6) return setError("The six displayed words must be different");
    clearError(); setIsLoading(true);
    try {
      const response = await solvePoetry(round.id, bomb.id, currentModule.id, { girl, words, resetStage });
      const nextStages = [...stages, { words: [...words], correctWords: response.output.correctWords }];
      setStages(nextStages); setResult(response.output); setResetStage(false); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { girl, stages: nextStages },
        response.output,
        response.solved,
      );
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Poetry"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, words, girl, resetStage, stages, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const advance = () => {
    setWords(emptyWords()); setResult(null); clearError();
  };
  const strike = () => {
    setStages((current) => current.slice(0, -1));
    setWords(emptyWords()); setResult(null); setResetStage(true); clearError();
  };

  return <SolverLayout>
    <SolverSection title="Poem progress" description={isSolved ? "All three words selected." : `Stage ${currentStage} of 3`}>
      <StageIndicator total={3} current={isSolved ? 4 : currentStage} completedThrough={stages.length} />
    </SolverSection>

    {!result && !isSolved && <>
      <SolverSection title="Poetry Club member" description="The pictured member stays the same for all three stages.">
        <select
          aria-label="Poetry Club member"
          value={girl}
          onChange={(event) => { setGirl(event.target.value as PoetryGirl); clearError(); }}
          disabled={isLoading || stages.length > 0 || resetStage}
          className={SELECT_CLASS}
        >
          {POETRY_GIRLS.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
      </SolverSection>

      <SolverSection title={`Stage ${currentStage} words`} description="Enter the six words in their displayed order.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {words.map((word, index) => <label key={index} className="text-sm font-medium">Word {index + 1}
            <select
              aria-label={`Word ${index + 1}`}
              value={word}
              onChange={(event) => {
                setWords((current) => current.map((value, position) => position === index ? event.target.value : value));
                clearError();
              }}
              disabled={isLoading}
              className={`mt-1 ${SELECT_CLASS}`}
            >
              <option value="">Select word</option>
              {POETRY_WORDS.map((option) => <option
                key={option}
                value={option}
                disabled={words.some((selected, position) => position !== index && selected === option)}
              >{option}</option>)}
            </select>
          </label>)}
        </div>
      </SolverSection>

      <SolverControls
        onSolve={solve}
        onReset={() => setWords(emptyWords())}
        showReset={false}
        isLoading={isLoading}
        isSolved={isSolved}
        isSolveDisabled={!valid}
        solveText={`Find stage ${currentStage} word`}
      />
    </>}

    <ErrorAlert error={error} />

    {result && <SolverSection title={`Stage ${result.stage}: press any closest word`} className="border-emerald-500/40">
      <div className="flex flex-wrap justify-center gap-2">
        {result.correctWords.map((word, index) => <span key={word} className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-lg font-bold">
          {result.correctIndexes[index]}. {word}
        </span>)}
      </div>
      {!isSolved && <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button type="button" onClick={advance}>The module advanced</Button>
        <Button type="button" variant="outline" onClick={strike}>That selection struck</Button>
      </div>}
    </SolverSection>}

    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Press any listed word. A wrong press regenerates only the current six words; report the strike above before entering the replacement display.</SolverInstructions>
  </SolverLayout>;
}
