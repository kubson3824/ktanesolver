import { useMemo, useState } from "react";
import { solveSouvenir, type SouvenirOutput } from "../../services/souvenirService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Button } from "../ui/button";
import { XRAY_SYMBOLS, XRaySymbol } from "./XRaySolver";
import { HUNTING_CLUES } from "../../services/huntingService";
import { HuntingPictogram } from "./HuntingSolver";
import { BraillePattern } from "./BrailleSolver";
import { SYMBOLIC_COORDINATE_SYMBOLS, type SymbolicCoordinateSymbol } from "../../services/symbolicCoordinatesService";
import { SymbolicCoordinateGlyph } from "./SymbolicCoordinateGlyph";

type QuestionOption = { id: string; label: string };
type HistoryEntry = { question: string; answer: string };
type SouvenirState = {
  sourceModuleId: string;
  question: string;
  exactQuestion: string;
  answers: string[];
  finalQuestion: boolean;
  result: SouvenirOutput | null;
  history: HistoryEntry[];
};

const question = (id: string, label: string): QuestionOption => ({ id, label });
const FLAGS_COUNTRIES_QUESTION = "Which of these country flags was shown, but not the main country flag, in Flags?";
const QUESTIONS: Partial<Record<ModuleType, QuestionOption[]>> = {
  [ModuleType.MAFIA]: [question("players", "Who was a player, but not the Godfather?")],
  [ModuleType.BUTTON]: [question("stripColor", "What color did the light glow?")],
  [ModuleType.BIG_CIRCLE]: [question("spinDirection", "Which direction was the circle spinning?")],
  [ModuleType.MEMORY]: [
    question("displays", "What was displayed in each stage?"),
    question("positions", "What positions were pressed?"),
    question("labels", "What labels were pressed?"),
  ],
  [ModuleType.SIMON_SAYS]: [question("finalSequence", "Which colors flashed in the final sequence?")],
  [ModuleType.WIRE_SEQUENCES]: [question("colorCounts", "How many wires of each color were there?")],
  [ModuleType.WHOS_ON_FIRST]: [question("displays", "What were the display words?")],
  [ModuleType.THIRD_BASE]: [
    question("firstDisplay", "What was the display word in the first stage?"),
    question("secondDisplay", "What was the display word in the second stage?"),
  ],
  [ModuleType.BITMAPS]: [
    question("whitePixels", "How many white pixels were in each quadrant?"),
    question("blackPixels", "How many black pixels were in each quadrant?"),
  ],
  [ModuleType.BRAILLE]: [
    question("first pattern", "What was the first Braille pattern?"),
    question("second pattern", "What was the second Braille pattern?"),
    question("third pattern", "What was the third Braille pattern?"),
    question("fourth pattern", "What was the fourth Braille pattern?"),
  ],
  [ModuleType.CHEAP_CHECKOUT]: [question("paidAmounts", "What were the paid amounts?")],
  [ModuleType.CHORD_QUALITIES]: [question("notes", "What notes were in the given chord?")],
  [ModuleType.CREATION]: [question("firstWeather", "What was the weather condition on the first day?")],
  [ModuleType.COORDINATES]: [question("gridSize", "What was the grid size?")],
  [ModuleType.COLOR_FLASH]: [question("finalColor", "What was the final color in the sequence?")],
  [ModuleType.COLOR_MORSE]: [
    question("first color", "What was the color of the first LED?"),
    question("second color", "What was the color of the second LED?"),
    question("third color", "What was the color of the third LED?"),
    question("first character", "What character was flashed by the first LED?"),
    question("second character", "What character was flashed by the second LED?"),
    question("third character", "What character was flashed by the third LED?"),
  ],
  [ModuleType.ICE_CREAM]: [
    question("customers", "Who were the customers?"),
    question("offeredFlavors", "Which flavors were offered to each customer?"),
  ],
  [ModuleType.FORGET_ME_NOT]: [question("displayedDigits", "What were the displayed digits in each stage?")],
  [ModuleType.FAST_MATH]: [question("lastPair", "What was the last pair of letters?")],
  [ModuleType.FIZZ_BUZZ]: [question("displayedNumbers", "What were the displayed numbers?")],
  [ModuleType.FLAGS]: [
    question("displayedNumber", "What was the displayed number?"),
    question("mainCountry", "What was the main country flag?"),
    question("countries", FLAGS_COUNTRIES_QUESTION),
  ],
  [ModuleType.TIMEZONE]: [
    question("departureCity", "What was the departure city?"),
    question("destinationCity", "What was the destination city?"),
  ],
  [ModuleType.SYMBOLIC_COORDINATES]: [
    question("firstLeftSymbol", "What was the left symbol in the first stage?"),
    question("firstMiddleSymbol", "What was the middle symbol in the first stage?"),
    question("firstRightSymbol", "What was the right symbol in the first stage?"),
    question("secondLeftSymbol", "What was the left symbol in the second stage?"),
    question("secondMiddleSymbol", "What was the middle symbol in the second stage?"),
    question("secondRightSymbol", "What was the right symbol in the second stage?"),
    question("thirdLeftSymbol", "What was the left symbol in the third stage?"),
    question("thirdMiddleSymbol", "What was the middle symbol in the third stage?"),
    question("thirdRightSymbol", "What was the right symbol in the third stage?"),
  ],
  [ModuleType.GAMEPAD]: [question("display", "What were the numbers on the display?")],
  [ModuleType.GAME_OF_LIFE_CRUEL]: [question("colorCombinations", "Which color combinations occurred?")],
  [ModuleType.LED_ENCRYPTION]: [question("stageLetters", "Which letters were present at each stage?")],
  [ModuleType.LISTENING]: [question("sound", "What sound played?")],
  [ModuleType.MAZES]: [question("startingPosition", "What was the starting position?")],
  [ModuleType.MONSPLODE_FIGHT]: [
    question("creature", "Which creature was displayed?"),
    question("moves", "Which moves were selectable?"),
  ],
  [ModuleType.MONSPLODE_TRADING_CARDS]: [
    question("cardNames", "Which cards were in the hand before the final action?"),
    question("printVersions", "Which print versions were in the hand before the final action?"),
  ],
  [ModuleType.MORSEMATICS]: [question("letters", "What were the received letters?")],
  [ModuleType.MORSE_A_MAZE]: [
    question("startingCoordinate", "What was the starting location?"),
    question("endingCoordinate", "What was the ending location?"),
    question("morseCodeWord", "What word was shown as Morse code?"),
  ],
  [ModuleType.MOUSE_IN_THE_MAZE]: [question("torusColor", "What color was the torus?")],
  [ModuleType.MURDER]: [
    question("potentialSuspectNotMurderer", "Which was a potential suspect but not the murderer?"),
    question("notPotentialSuspect", "Which was not a potential suspect?"),
    question("potentialWeaponNotMurderWeapon", "Which was a potential weapon but not the murder weapon?"),
    question("notPotentialWeapon", "Which was not a potential weapon?"),
    question("bodyLocation", "Where was the body found?"),
  ],
  [ModuleType.MYSTIC_SQUARE]: [question("centerDigit", "What digit was initially in the center?")],
  [ModuleType.NEUTRALIZATION]: [
    question("acidColor", "What was the acid's color?"),
    question("acidVolume", "What was the acid's volume?"),
  ],
  [ModuleType.ONLY_CONNECT]: [question("hieroglyphs", "Where were the Egyptian hieroglyphs?")],
  [ModuleType.PERSPECTIVE_PEGS]: [question("initialSequence", "What was the initial color sequence?")],
  [ModuleType.PROBING]: [
    question("red-white", "Missing frequency in the red-white wire"),
    question("yellow-black", "Missing frequency in the yellow-black wire"),
    question("green", "Missing frequency in the green wire"),
    question("gray", "Missing frequency in the gray wire"),
    question("yellow-red", "Missing frequency in the yellow-red wire"),
    question("red-blue", "Missing frequency in the red-blue wire"),
  ],
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
  [ModuleType.SYMBOL_CYCLE]: [
    question("leftSymbolCount", "How many symbols cycled on the left screen?"),
    question("rightSymbolCount", "How many symbols cycled on the right screen?"),
  ],
  [ModuleType.COLORED_SWITCHES]: [question("initialPosition", "What was the initial position of the switches?")],
  [ModuleType.SOUVENIR]: [question("firstModule", "What was the first module asked about?")],
  [ModuleType.THE_BULB]: [question("initiallyLit", "Was the bulb initially lit?")],
  [ModuleType.THREE_D_MAZE]: [
    question("markings", "What were the markings?"),
    question("cardinalDirection", "What was the cardinal direction?"),
  ],
  [ModuleType.TIC_TAC_TOE]: [question("initialField", "What was the initial state of the field?")],
  [ModuleType.TWO_BITS]: [question("responses", "What were the correct query responses?")],
  [ModuleType.X_RAY]: [question("symbols", "Which symbols were scanned?")],
  [ModuleType.GRIDLOCK]: [
    question("startingColor", "What was the starting color?"),
    question("startingLocation", "What was the starting location?"),
  ],
  [ModuleType.YAHTZEE]: [question("firstRoll", "What was the first roll?")],
  [ModuleType.TEXT_FIELD]: [question("displayedLetter", "What was the displayed letter?")],
  [ModuleType.HUNTING]: [
    question("firstDisplayedSymbols", "Which pictograms were displayed in the first stage?"),
    question("secondDisplayedSymbols", "Which pictograms were displayed in the second stage?"),
    question("thirdDisplayedSymbols", "Which pictograms were displayed in the third stage?"),
    question("fourthDisplayedSymbols", "Which pictograms were displayed in the fourth stage?"),
  ],
};
const questionsFor = (source?: BombEntity["modules"][number]) =>
  source ? QUESTIONS[source.type as ModuleType] ?? [] : [];
const humanize = (type: string) => type.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function SouvenirSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [sourceModuleId, setSourceModuleId] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [exactQuestion, setExactQuestion] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const [finalQuestion, setFinalQuestion] = useState(false);
  const [result, setResult] = useState<SouvenirOutput | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const sources = useMemo(
    () => bomb?.modules.filter((source) => source.solved && source.id !== currentModule?.id
      && !(source.type === ModuleType.FLAGS && source.state.unicornRule === true)) ?? [],
    [bomb?.modules, currentModule?.id],
  );
  const selectedSource = sources.find((source) => source.id === sourceModuleId);
  const requiresDisplayedAnswers = selectedSource?.type === ModuleType.MAFIA
    || (selectedSource?.type === ModuleType.FLAGS && selectedQuestion === "countries");
  const twitchCommand = result ? generateTwitchCommand({ moduleType: ModuleType.SOUVENIR, result }) : "";
  const questionOptions = questionsFor(selectedSource);
  const xRaySymbols = selectedSource?.type === ModuleType.X_RAY && result
    ? result.answer.split(", ").filter((answer) => XRAY_SYMBOLS.includes(answer))
    : [];
  const huntingSymbols = selectedSource?.type === ModuleType.HUNTING && result
    ? result.answer.split(", ").map((answer) => HUNTING_CLUES.find((symbol) => symbol.replace("_", "") === answer.trim())).filter((symbol): symbol is NonNullable<typeof symbol> => symbol !== undefined)
    : [];
  const braillePattern = selectedSource?.type === ModuleType.BRAILLE && result
    ? (result.answer.codePointAt(0) ?? 0) - 0x2800
    : 0;
  const symbolicCoordinatesSymbol = selectedSource?.type === ModuleType.SYMBOLIC_COORDINATES && result
    && SYMBOLIC_COORDINATE_SYMBOLS.includes(result.answer as SymbolicCoordinateSymbol)
    ? result.answer as SymbolicCoordinateSymbol
    : null;
  const moduleState = useMemo<SouvenirState>(() => ({
    sourceModuleId, question: selectedQuestion, exactQuestion, answers, finalQuestion, result, history,
  }), [sourceModuleId, selectedQuestion, exactQuestion, answers, finalQuestion, result, history]);

  useSolverModulePersistence<SouvenirState, SouvenirOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (state.sourceModuleId !== undefined) setSourceModuleId(state.sourceModuleId);
      if (state.question !== undefined) setSelectedQuestion(state.question);
      if (state.exactQuestion !== undefined) setExactQuestion(state.exactQuestion);
      if (state.answers !== undefined) setAnswers(state.answers);
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
    const source = sources.find((candidate) => candidate.id === id);
    const options = questionsFor(source);
    const mafia = source?.type === ModuleType.MAFIA;
    setSourceModuleId(id);
    setSelectedQuestion(options.length === 1 ? options[0].id : "");
    setExactQuestion(mafia ? "Who was a player, but not the Godfather?" : "");
    setAnswers(mafia ? Array(6).fill("") : []);
    setResult(null);
    clearError();
  };

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!sourceModuleId) return setError("Select the solved module named in the question");
    const questionText = answers.length ? exactQuestion.trim() : selectedQuestion.trim();
    if (!questionText) return setError("Enter or select the question shown on Souvenir");
    if (answers.length && answers.some((answer) => !answer.trim())) return setError("Enter every answer shown on Souvenir");
    clearError(); setIsLoading(true);
    try {
      const input = {
        sourceModuleId, question: questionText, finalQuestion,
        ...(answers.length ? { answers: answers.map((answer) => answer.trim()) } : {}),
      };
      const response = await solveSouvenir(round.id, bomb.id, currentModule.id, input);
      if (!response.output) return setError(response.reason);
      const label = answers.length ? questionText : questionOptions.find((option) => option.id === selectedQuestion)?.label ?? selectedQuestion;
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
    setSourceModuleId(""); setSelectedQuestion(""); setExactQuestion(""); setAnswers([]); setFinalQuestion(false); setResult(null); clearError();
  };
  const reset = () => {
    setSourceModuleId(""); setSelectedQuestion(""); setExactQuestion(""); setAnswers([]); setFinalQuestion(false);
    setResult(null); setHistory([]); resetSolverState();
  };

  return <SolverLayout>
    <SolverSection title="Question source" description="Choose the solved module named by Souvenir, then select the displayed question when needed.">
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
      {questionOptions.length > 1 && answers.length === 0 && <label className="mt-3 block text-sm font-medium">
        Question
        <select
          value={selectedQuestion}
          onChange={(event) => {
            const nextQuestion = event.target.value;
            const needsFlagsChoices = selectedSource?.type === ModuleType.FLAGS && nextQuestion === "countries";
            setSelectedQuestion(nextQuestion);
            setExactQuestion(needsFlagsChoices ? FLAGS_COUNTRIES_QUESTION : "");
            setAnswers(needsFlagsChoices ? Array(6).fill("") : []);
            setResult(null); clearError();
          }}
          disabled={isLoading || isSolved}
          className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Select the displayed question…</option>
          {questionOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </label>}
      {selectedSource && questionOptions.length === 0 && answers.length === 0 && <label className="mt-3 block text-sm font-medium">
        Exact Souvenir question
        <input
          type="text"
          value={selectedQuestion}
          onChange={(event) => { setSelectedQuestion(event.target.value); setResult(null); clearError(); }}
          disabled={isLoading || isSolved}
          placeholder="What color was the torus in Mouse In The Maze?"
          className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        />
      </label>}
      {selectedSource && <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={answers.length > 0}
          onChange={(event) => {
            setExactQuestion(event.target.checked && questionOptions.length === 0 ? selectedQuestion : "");
            setAnswers(event.target.checked ? ["", "", "", ""] : []);
            setResult(null); clearError();
          }}
          disabled={isLoading || isSolved || requiresDisplayedAnswers}
        />
        Enter Souvenir’s displayed answers (most reliable)
      </label>}
      {answers.length > 0 && <div className="mt-3 space-y-3">
        <label className="block text-sm font-medium">
          Exact Souvenir question
          <input
            type="text"
            value={exactQuestion}
            onChange={(event) => { setExactQuestion(event.target.value); setResult(null); clearError(); }}
            disabled={isLoading || isSolved}
            className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {answers.map((answer, index) => <input
            key={index}
            type="text"
            aria-label={`Answer ${index + 1}`}
            value={answer}
            onChange={(event) => setAnswers((current) => current.map((value, answerIndex) => answerIndex === index ? event.target.value : value))}
            disabled={isLoading || isSolved}
            placeholder={`Answer ${index + 1}`}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          />)}
        </div>
        <div className="flex gap-2">
          {answers.length < 6 && <Button type="button" variant="outline" onClick={() => setAnswers((current) => [...current, ""])}>Add answer</Button>}
          {answers.length > 2 && <Button type="button" variant="outline" onClick={() => setAnswers((current) => current.slice(0, -1))}>Remove answer</Button>}
        </div>
      </div>}
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={finalQuestion} onChange={(event) => setFinalQuestion(event.target.checked)} disabled={isLoading || isSolved} />
        This is Souvenir’s final question
      </label>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={!sourceModuleId || !(answers.length ? exactQuestion.trim() && answers.every((answer) => answer.trim()) : selectedQuestion.trim()) || Boolean(result)} solveText="Show recorded answer" />
    <ErrorAlert error={error} />

    {result && <SolverSection title="Recorded answer" className="border-emerald-500/40">
      <div className="rounded-md border-2 border-emerald-500 bg-emerald-500/15 p-4 text-center font-semibold text-emerald-700 dark:text-emerald-300">
        {symbolicCoordinatesSymbol
          ? <><p className="mb-3">Match this symbol:</p><SymbolicCoordinateGlyph symbol={symbolicCoordinatesSymbol} className="mx-auto h-24 w-24" /></>
          : huntingSymbols.length > 0
          ? <><p className="mb-3">These two pictograms were displayed:</p><div className="flex justify-center gap-3">{huntingSymbols.map((symbol) => <HuntingPictogram key={symbol} symbol={symbol} />)}</div></>
          : xRaySymbols.length > 0
          ? <><p className="mb-3">Match any of these scanned symbols:</p><div className="flex justify-center gap-3">{xRaySymbols.map((symbol) => <XRaySymbol key={symbol} code={symbol} />)}</div></>
          : braillePattern > 0 && braillePattern <= 63
          ? <><p className="mb-3">Match this Braille pattern:</p><BraillePattern pattern={braillePattern} className="mx-auto w-fit scale-150" /><p className="mt-4">{result.answer}</p></>
          : result.answer}
      </div>
      {!isSolved && <Button type="button" className="mt-4 w-full" onClick={nextQuestion}>Next question</Button>}
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Select the exact solved module instance. Presets show recorded facts quickly; for an exact answer, enter Souvenir’s question and the displayed choices.</SolverInstructions>
  </SolverLayout>;
}
