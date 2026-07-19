import { useCallback, useMemo, useState } from "react";
import { solveEnglishTest, type EnglishTestOutput } from "../../services/englishTestService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, StageIndicator, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

type EnglishTestState = {
  sentence?: string;
  questionNumber?: number;
  result?: EnglishTestOutput | null;
  twitchCommand?: string;
  answerPosition?: number | "";
  input?: { sentence?: string; questionNumber?: number };
};

export default function EnglishTestSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [sentence, setSentence] = useState("");
  const [questionNumber, setQuestionNumber] = useState(1);
  const [result, setResult] = useState<EnglishTestOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const [answerPosition, setAnswerPosition] = useState<number | "">("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo<EnglishTestState>(() => ({ sentence, questionNumber, result, twitchCommand, answerPosition }), [sentence, questionNumber, result, twitchCommand, answerPosition]);

  useSolverModulePersistence<typeof state, EnglishTestOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      const restoredSentence = saved.sentence ?? saved.input?.sentence;
      const restoredQuestion = saved.questionNumber ?? saved.input?.questionNumber;
      if (restoredSentence !== undefined) setSentence(restoredSentence);
      if (restoredQuestion) setQuestionNumber(restoredQuestion);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
      if (saved.answerPosition !== undefined) setAnswerPosition(saved.answerPosition);
    }, []),
    onRestoreSolution: useCallback((solution: EnglishTestOutput) => {
      setResult(solution);
    }, []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    const entered = sentence.trim();
    if (!entered) return setError("Enter the sentence shown on the module.");
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information.");
    clearError(); setIsLoading(true);
    try {
      const response = await solveEnglishTest(round.id, bomb.id, currentModule.id, { sentence: entered, questionNumber });
      const nextQuestion = response.solved ? questionNumber : Math.min(3, questionNumber + 1);
      const nextSentence = response.solved ? entered : "";
      setResult(response.output); setAnswerPosition(""); setTwitchCommand(""); setIsSolved(response.solved);
      setQuestionNumber(nextQuestion); setSentence(nextSentence);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { sentence: nextSentence, questionNumber: nextQuestion, result: response.output, twitchCommand: "", answerPosition: "" }, response.output, response.solved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve English Test");
    } finally { setIsLoading(false); }
  }, [sentence, questionNumber, round?.id, bomb?.id, currentModule?.id, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => { setSentence(""); setQuestionNumber(1); setResult(null); setAnswerPosition(""); setTwitchCommand(""); resetSolverState(); }, [resetSolverState]);
  const disabled = isLoading || isSolved;

  return <SolverLayout>
    <SolverSection title="Question progress" description="Match the question number shown at the top of the module; strikes reset it to 1.">
      <StageIndicator total={3} current={isSolved ? 4 : questionNumber} completedThrough={isSolved ? 3 : questionNumber - 1} />
    </SolverSection>
    {!isSolved && <SolverSection title="Displayed sentence" description="Enter the complete sentence with whichever italic choice is currently selected.">
      <label className="mb-3 block space-y-1.5 text-sm font-medium">Question number
        <select value={questionNumber} onChange={(event) => setQuestionNumber(Number(event.target.value))} disabled={disabled} className="block h-10 w-full rounded-md border border-input bg-background px-3 text-sm" aria-label="Question number">
          {[1, 2, 3].map((number) => <option key={number} value={number}>Question {number}/3</option>)}
        </select>
      </label>
      <textarea value={sentence} onChange={(event) => { setSentence(event.target.value); if (error) clearError(); }} rows={4} disabled={disabled} aria-label="Displayed sentence" placeholder="Type the sentence exactly, including punctuation" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
    </SolverSection>}
    <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={!sentence.trim()} isLoading={isLoading} isSolved={isSolved} solveText={`Solve question ${questionNumber}`} />
    <ErrorAlert error={error} />
    {result && <SolverSection title={`Question ${result.questionNumber} answer`} className="border-emerald-500/40">
      <p className="rounded-md bg-emerald-500/10 px-4 py-3 text-center text-xl font-bold">{result.correctAnswer}</p>
      <label className="mt-3 block text-sm font-medium">Position of this answer on the module
        <select
          value={answerPosition}
          onChange={(event) => {
            const position = Number(event.target.value) || "";
            const command = generateTwitchCommand({
              moduleType: ModuleType.ENGLISH_TEST,
              result: { answerPosition: position },
            });
            setAnswerPosition(position);
            setTwitchCommand(command);
            if (bomb?.id && currentModule?.id) {
              updateModuleAfterSolve(
                bomb.id,
                currentModule.id,
                { sentence, questionNumber, result, answerPosition: position, twitchCommand: command },
                result,
                isSolved,
              );
            }
          }}
          disabled={isLoading}
          className="mt-2 block h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          aria-label="Correct answer position"
        >
          <option value="">Choose 1–4</option>
          {[1, 2, 3, 4].map((position) => <option key={position} value={position}>Answer {position}</option>)}
        </select>
      </label>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Select the shown answer with the arrow buttons, then submit it. Solve all three questions; after a strike, change the question number back to 1.</SolverInstructions>
  </SolverLayout>;
}
