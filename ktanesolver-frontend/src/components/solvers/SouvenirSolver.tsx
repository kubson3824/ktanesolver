import { useMemo, useState } from "react";
import { solveSouvenir, type SouvenirOutput } from "../../services/souvenirService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  useSolver, useSolverModulePersistence,
} from "../common";
import { Button } from "../ui/button";

type QuestionOption = { id: string; label: string };
type HistoryEntry = { question: string; answer: string };
type SouvenirState = {
  sourceModuleId: string;
  question: string;
  finalQuestion: boolean;
  result: SouvenirOutput | null;
  history: HistoryEntry[];
};

const question = (id: string, label: string): QuestionOption => ({ id, label });
const QUESTIONS: Partial<Record<ModuleType, QuestionOption[]>> = {
  [ModuleType.BUTTON]: [question("stripColor", "What color did the light glow?")],
  [ModuleType.MEMORY]: [
    question("displays", "What was displayed in each stage?"),
    question("positions", "What positions were pressed?"),
    question("labels", "What labels were pressed?"),
  ],
  [ModuleType.SIMON_SAYS]: [question("finalSequence", "Which colors flashed in the final sequence?")],
  [ModuleType.WIRE_SEQUENCES]: [question("colorCounts", "How many wires of each color were there?")],
  [ModuleType.WHOS_ON_FIRST]: [question("displays", "What were the display words?")],
  [ModuleType.THIRD_BASE]: [question("displays", "What were the display words?")],
  [ModuleType.BITMAPS]: [
    question("whitePixels", "How many white pixels were in each quadrant?"),
    question("blackPixels", "How many black pixels were in each quadrant?"),
  ],
  [ModuleType.CHEAP_CHECKOUT]: [question("paidAmounts", "What were the paid amounts?")],
  [ModuleType.CHORD_QUALITIES]: [question("notes", "What notes were in the given chord?")],
  [ModuleType.CREATION]: [question("firstWeather", "What was the weather condition on the first day?")],
  [ModuleType.COORDINATES]: [question("gridSize", "What was the grid size?")],
  [ModuleType.COLOR_FLASH]: [question("finalColor", "What was the final color in the sequence?")],
  [ModuleType.ICE_CREAM]: [
    question("customers", "Who were the customers?"),
    question("offeredFlavors", "Which flavors were offered to each customer?"),
  ],
  [ModuleType.FORGET_ME_NOT]: [question("displayedDigits", "What were the displayed digits in each stage?")],
  [ModuleType.FAST_MATH]: [question("lastPair", "What was the last pair of letters?")],
  [ModuleType.FIZZ_BUZZ]: [question("displayedNumbers", "What were the displayed numbers?")],
  [ModuleType.GAMEPAD]: [question("display", "What were the numbers on the display?")],
  [ModuleType.LED_ENCRYPTION]: [question("stageLetters", "Which letters were present at each stage?")],
  [ModuleType.LISTENING]: [question("sound", "What sound played?")],
  [ModuleType.MAZES]: [question("startingPosition", "What was the starting position?")],
  [ModuleType.MONSPLODE_FIGHT]: [
    question("creature", "Which creature was displayed?"),
    question("moves", "Which moves were selectable?"),
  ],
  [ModuleType.MORSEMATICS]: [question("letters", "What were the received letters?")],
  [ModuleType.MURDER]: [
    question("suspects", "Which suspects were present?"),
    question("weapons", "Which weapons were present?"),
    question("bodyLocation", "Where was the body found?"),
  ],
  [ModuleType.MYSTIC_SQUARE]: [question("centerDigit", "What digit was initially in the center?")],
  [ModuleType.NEUTRALIZATION]: [
    question("acidColor", "What was the acid's color?"),
    question("acidVolume", "What was the acid's volume?"),
  ],
  [ModuleType.ONLY_CONNECT]: [question("hieroglyphs", "Where were the Egyptian hieroglyphs?")],
  [ModuleType.PERSPECTIVE_PEGS]: [question("initialSequence", "What was the initial color sequence?")],
  [ModuleType.PROBING]: [question("frequencies", "What were the missing frequencies in each wire?")],
  [ModuleType.RHYTHMS]: [question("color", "What was the color?")],
  [ModuleType.SEA_SHELLS]: [question("phrases", "What were the phrases?")],
  [ModuleType.SHAPE_SHIFT]: [question("initialShape", "What was the initial shape?")],
  [ModuleType.SILLY_SLOTS]: [question("slots", "What were the slots in each stage?")],
  [ModuleType.SIMON_SCREAMS]: [
    question("finalSequence", "What colors flashed in the final sequence?"),
    question("rules", "Which rules applied in each stage?"),
  ],
  [ModuleType.SIMON_STATES]: [question("flashes", "Which colors flashed in each stage?")],
  [ModuleType.SKEWED_SLOTS]: [question("originalNumber", "What were the original numbers?")],
  [ModuleType.SWITCHES]: [question("initialPosition", "What was the initial switch position?")],
  [ModuleType.SOUVENIR]: [question("firstModule", "What was the first module asked about?")],
  [ModuleType.THE_BULB]: [question("initiallyLit", "Was the bulb initially lit?")],
  [ModuleType.THREE_D_MAZE]: [
    question("markings", "What were the markings?"),
    question("cardinalDirection", "What was the cardinal direction?"),
  ],
  [ModuleType.TIC_TAC_TOE]: [question("initialField", "What was the initial state of the field?")],
  [ModuleType.TWO_BITS]: [question("responses", "What were the correct query responses?")],
  [ModuleType.X_RAY]: [question("symbols", "Which symbols were scanned?")],
  [ModuleType.YAHTZEE]: [question("firstRoll", "What was the first roll?")],
  [ModuleType.TEXT_FIELD]: [question("displayedLetter", "What was the displayed letter?")],
};
const FALLBACK_QUESTION = [question("recordedFacts", "What information was recorded?")];
const questionsFor = (source?: BombEntity["modules"][number]) =>
  source ? QUESTIONS[source.type as ModuleType] ?? FALLBACK_QUESTION : [];
const humanize = (type: string) => type.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function SouvenirSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [sourceModuleId, setSourceModuleId] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [finalQuestion, setFinalQuestion] = useState(false);
  const [result, setResult] = useState<SouvenirOutput | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const sources = useMemo(
    () => bomb?.modules.filter((source) => source.solved && source.id !== currentModule?.id) ?? [],
    [bomb?.modules, currentModule?.id],
  );
  const selectedSource = sources.find((source) => source.id === sourceModuleId);
  const questionOptions = questionsFor(selectedSource);
  const moduleState = useMemo<SouvenirState>(() => ({
    sourceModuleId, question: selectedQuestion, finalQuestion, result, history,
  }), [sourceModuleId, selectedQuestion, finalQuestion, result, history]);

  useSolverModulePersistence<SouvenirState, SouvenirOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (state.sourceModuleId !== undefined) setSourceModuleId(state.sourceModuleId);
      if (state.question !== undefined) setSelectedQuestion(state.question);
      if (state.finalQuestion !== undefined) setFinalQuestion(state.finalQuestion);
      if (state.result !== undefined) setResult(state.result);
      if (state.history !== undefined) setHistory(state.history);
    },
    onRestoreSolution: (solution) => { if (solution?.answer) setResult(solution); },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const selectSource = (id: string) => {
    const options = questionsFor(sources.find((source) => source.id === id));
    setSourceModuleId(id);
    setSelectedQuestion(options.length === 1 ? options[0].id : "");
    setResult(null);
    clearError();
  };

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!sourceModuleId) return setError("Select the solved module named in the question");
    if (!selectedQuestion) return setError("Select the question shown on Souvenir");
    clearError(); setIsLoading(true);
    try {
      const input = { sourceModuleId, question: selectedQuestion, finalQuestion };
      const response = await solveSouvenir(round.id, bomb.id, currentModule.id, input);
      if (!response.output) return setError(response.reason);
      const label = questionOptions.find((option) => option.id === selectedQuestion)?.label ?? selectedQuestion;
      const nextHistory = [...history, { question: label, answer: response.output.answer }];
      setResult(response.output); setHistory(nextHistory); setIsSolved(Boolean(response.solved));
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id,
        { ...input, result: response.output, history: nextHistory },
        response.output, Boolean(response.solved),
      );
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Souvenir"); }
    finally { setIsLoading(false); }
  };

  const nextQuestion = () => {
    setSourceModuleId(""); setSelectedQuestion(""); setFinalQuestion(false); setResult(null); clearError();
  };
  const reset = () => {
    setSourceModuleId(""); setSelectedQuestion(""); setFinalQuestion(false);
    setResult(null); setHistory([]); resetSolverState();
  };

  return <SolverLayout>
    <SolverSection title="Question source" description="Choose the solved module named by Souvenir. Its only question family is selected automatically.">
      <label className="block text-sm font-medium">
        Source module
        <select
          value={sourceModuleId}
          onChange={(event) => selectSource(event.target.value)}
          disabled={isLoading || isSolved}
          className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Select a solved module…</option>
          {sources.map((source) => <option key={source.id} value={source.id}>{humanize(source.type)} · {source.id.slice(0, 8)}</option>)}
        </select>
      </label>
      {questionOptions.length > 1 && <label className="mt-3 block text-sm font-medium">
        Question
        <select
          value={selectedQuestion}
          onChange={(event) => { setSelectedQuestion(event.target.value); setResult(null); clearError(); }}
          disabled={isLoading || isSolved}
          className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Select the displayed question…</option>
          {questionOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </label>}
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={finalQuestion} onChange={(event) => setFinalQuestion(event.target.checked)} disabled={isLoading || isSolved} />
        This is Souvenir’s final question
      </label>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={!sourceModuleId || !selectedQuestion || Boolean(result)} solveText="Show recorded answer" />
    <ErrorAlert error={error} />

    {result && <SolverSection title="Recorded answer" className="border-emerald-500/40">
      <div className="rounded-md border-2 border-emerald-500 bg-emerald-500/15 p-4 text-center font-semibold text-emerald-700 dark:text-emerald-300">
        {result.answer}
      </div>
      {!isSolved && <Button type="button" className="mt-4 w-full" onClick={nextQuestion}>Next question</Button>}
    </SolverSection>}
    <SolverInstructions>Select the exact solved module instance. For questions with several valid recorded values, compare the returned set with the choices shown on Souvenir.</SolverInstructions>
  </SolverLayout>;
}
