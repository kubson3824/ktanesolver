import { useCallback, useMemo, useState } from "react";
import { solveSouvenir, type SouvenirOutput } from "../../services/souvenirService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { cn } from "../../lib/cn";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { SOUND_OPTIONS } from "./ListeningSolver";
import { MOVES, OPPONENTS, opponentIconUrl } from "./MonsplodeFightSolver";
import { EDGES, Shape } from "./ShapeShiftSolver";
import type { ShapeEdge } from "../../services/shapeShiftService";
import { ONLY_CONNECT_HIEROGLYPHS, OnlyConnectHieroglyph } from "./OnlyConnectSolver";

type HistoryEntry = { question: string; answer: string; answerIndex: number };
type SouvenirState = {
  sourceModuleId: string;
  question: string;
  answers: string[];
  finalQuestion: boolean;
  result: SouvenirOutput | null;
  twitchCommand: string;
  history: HistoryEntry[];
};

const emptyAnswers = () => ["", ""];
const humanize = (type: string) => type.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const asRecord = (value: unknown) => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const CREATION_WEATHERS = [
  { value: "Clear", icon: "☀️" }, { value: "Heat Wave", icon: "🌡️" },
  { value: "Meteor Shower", icon: "☄️" }, { value: "Rain", icon: "🌧️" }, { value: "Windy", icon: "💨" },
];

function SwitchPattern({ value }: { value: string | boolean[] }) {
  const switches = typeof value === "string" ? value.split("") : value.map((up) => up ? "Q" : "R");
  return <div className="flex justify-center gap-1" aria-label={switches.map((position) => position === "Q" ? "up" : position === "R" ? "down" : "unset").join(", ")}>
    {switches.map((position, index) => <span key={index} className="flex h-8 w-7 items-center justify-center rounded border bg-background font-bold">{position === "Q" ? "↑" : position === "R" ? "↓" : "?"}</span>)}
  </div>;
}

function AnswerField({ sourceType, question, value, onChange, disabled, index }: {
  sourceType?: string; question: string; value: string; onChange: (value: string) => void; disabled: boolean; index: number;
}) {
  const lowerQuestion = question.toLowerCase();
  const options = sourceType === ModuleType.LISTENING ? SOUND_OPTIONS
    : sourceType === ModuleType.MONSPLODE_FIGHT && lowerQuestion.includes("creature") ? OPPONENTS
    : sourceType === ModuleType.MONSPLODE_FIGHT && lowerQuestion.includes("move") ? MOVES
    : sourceType === ModuleType.ONLY_CONNECT ? ONLY_CONNECT_HIEROGLYPHS
    : sourceType === ModuleType.CREATION ? CREATION_WEATHERS.map(({ value }) => value) : null;
  if (options) return <div className="flex flex-1 items-center gap-2">
    <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} aria-label={`Answer ${index + 1}`} className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm">
      <option value="">Choose answer {index + 1}…</option>
      {options.map((option) => <option key={option}>{option}</option>)}
    </select>
    {sourceType === ModuleType.MONSPLODE_FIGHT && lowerQuestion.includes("creature") && value && <img src={opponentIconUrl(value)} alt={value} className="h-10 w-10 rounded border object-contain p-1" />}
    {sourceType === ModuleType.ONLY_CONNECT && value && <OnlyConnectHieroglyph name={value} className="h-10 w-10 shrink-0 rounded border p-1" />}
    {sourceType === ModuleType.CREATION && value && <span className="text-2xl" role="img" aria-label={value}>{CREATION_WEATHERS.find((weather) => weather.value === value)?.icon}</span>}
  </div>;
  if (sourceType === ModuleType.SHAPE_SHIFT) {
    const [left = "", right = ""] = value.split("|");
    return <div className="flex flex-1 items-center gap-2">
      {([left, right] as const).map((edge, side) => <select key={side} value={edge} onChange={(event) => onChange(side === 0 ? `${event.target.value}|${right}` : `${left}|${event.target.value}`)} disabled={disabled} aria-label={`Answer ${index + 1} ${side === 0 ? "left" : "right"} edge`} className="h-9 flex-1 rounded-md border border-input bg-background px-2 text-sm">
        <option value="">{side === 0 ? "Left" : "Right"} edge…</option>
        {EDGES.map((choice) => <option key={choice} value={choice}>{humanize(choice)}</option>)}
      </select>)}
      {EDGES.includes(left as ShapeEdge) && EDGES.includes(right as ShapeEdge) && <Shape left={left as ShapeEdge} right={right as ShapeEdge} className="h-12 w-16" />}
    </div>;
  }
  if (sourceType === ModuleType.SWITCHES) {
    const code = /^[QR?]{5}$/.test(value) ? value : "?????";
    return <div className="flex flex-1 items-center gap-2">
      <div className="flex gap-1">{code.split("").map((position, switchIndex) => <Button key={switchIndex} type="button" variant="outline" size="sm" className="w-9 px-0" disabled={disabled} aria-label={`Answer ${index + 1}, switch ${switchIndex + 1}: ${position === "Q" ? "up" : position === "R" ? "down" : "unset"}`} onClick={() => {
        const next = code.split(""); next[switchIndex] = position === "?" ? "Q" : position === "Q" ? "R" : "?"; onChange(next.join(""));
      }}>{position === "Q" ? "↑" : position === "R" ? "↓" : "?"}</Button>)}</div>
      <span className="text-xs text-muted-foreground">click to cycle</span>
    </div>;
  }
  return <Input value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} aria-label={`Answer ${index + 1}`} placeholder={`Answer ${index + 1}`} />;
}

function RecordedTarget({ source, question }: { source: BombEntity["modules"][number] | undefined; question: string }) {
  if (!source) return null;
  const state = asRecord(source.state);
  const input = Object.keys(asRecord(state.input)).length ? asRecord(state.input) : state;
  if (source.type === ModuleType.LISTENING) {
    const sound = state.soundDescription ?? state.selectedSound;
    return typeof sound === "string" ? <div className="mt-3 rounded-md border border-primary/30 bg-primary/5 p-3 text-center"><div className="text-xs text-muted-foreground">Recorded target sound</div><div className="font-semibold">{sound}</div></div> : null;
  }
  if (source.type === ModuleType.MONSPLODE_FIGHT) {
    const creature = input.opponent;
    const moves = input.moves;
    if (question.toLowerCase().includes("creature") && typeof creature === "string") return <div className="mt-3 flex items-center justify-center gap-3 rounded-md border border-primary/30 bg-primary/5 p-3"><img src={opponentIconUrl(creature)} alt={creature} className="h-16 w-16 rounded border object-contain p-1" /><strong>{creature}</strong></div>;
    if (Array.isArray(moves)) return <div className="mt-3 rounded-md border border-primary/30 bg-primary/5 p-3 text-center"><div className="text-xs text-muted-foreground">Recorded selectable moves</div><strong>{moves.join(" · ")}</strong></div>;
  }
  if (source.type === ModuleType.SHAPE_SHIFT) {
    const left = input.left as ShapeEdge; const right = input.right as ShapeEdge;
    return EDGES.includes(left) && EDGES.includes(right) ? <div className="mt-3 rounded-md border border-primary/30 bg-primary/5 p-2 text-center"><div className="text-xs text-muted-foreground">Recorded target shape</div><Shape left={left} right={right} className="mx-auto h-20 w-32 text-primary" /></div> : null;
  }
  if (source.type === ModuleType.SWITCHES && Array.isArray(state.currentSwitches)) return <div className="mt-3 rounded-md border border-primary/30 bg-primary/5 p-3"><div className="mb-2 text-center text-xs text-muted-foreground">Recorded initial switches</div><SwitchPattern value={state.currentSwitches.map(Boolean)} /></div>;
  if (source.type === ModuleType.ONLY_CONNECT && Array.isArray(state.hieroglyphs)) {
    const positions = ["top left", "top middle", "top right", "bottom left", "bottom middle", "bottom right"];
    const position = positions.findIndex((value) => question.toLowerCase().replaceAll("-", " ").includes(value));
    const glyph = position >= 0 ? state.hieroglyphs[position] : null;
    if (typeof glyph === "string") return <div className="mt-3 flex items-center justify-center gap-3 rounded-md border border-primary/30 bg-primary/5 p-3"><OnlyConnectHieroglyph name={glyph} className="h-16 w-16" /><strong>{glyph}</strong></div>;
  }
  if (source.type === ModuleType.CREATION && typeof state.firstWeather === "string") return <div className="mt-3 flex items-center justify-center gap-3 rounded-md border border-primary/30 bg-primary/5 p-3"><span className="text-4xl" role="img" aria-label={state.firstWeather}>{CREATION_WEATHERS.find((weather) => weather.value === state.firstWeather)?.icon}</span><strong>{state.firstWeather}</strong></div>;
  return null;
}

export default function SouvenirSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [sourceModuleId, setSourceModuleId] = useState("");
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState<string[]>(emptyAnswers);
  const [finalQuestion, setFinalQuestion] = useState(false);
  const [result, setResult] = useState<SouvenirOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
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
  const moduleState = useMemo<SouvenirState>(() => ({
    sourceModuleId, question, answers, finalQuestion, result, twitchCommand, history,
  }), [sourceModuleId, question, answers, finalQuestion, result, twitchCommand, history]);

  useSolverModulePersistence<SouvenirState, SouvenirOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (state.sourceModuleId !== undefined) setSourceModuleId(state.sourceModuleId);
      if (state.question !== undefined) setQuestion(state.question);
      if (state.answers?.length >= 2) setAnswers(state.answers);
      if (state.finalQuestion !== undefined) setFinalQuestion(state.finalQuestion);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
      if (state.history !== undefined) setHistory(state.history);
    },
    onRestoreSolution: (solution) => {
      if (!solution?.answerIndex) return;
      setResult(solution);
      setTwitchCommand(`press ${solution.answerIndex}`);
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const updateAnswer = (index: number, answer: string) => {
    setAnswers((current) => current.map((value, i) => i === index ? answer : value));
    setResult(null); setTwitchCommand(""); clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!sourceModuleId) return setError("Select the solved module named in the question");
    if (!question.trim() || answers.some((answer) => !answer.trim())) return setError("Enter the question and every visible answer");
    clearError(); setIsLoading(true);
    try {
      const input = { sourceModuleId, question, answers, finalQuestion };
      const response = await solveSouvenir(round.id, bomb.id, currentModule.id, input);
      const command = `press ${response.output.answerIndex}`;
      const nextHistory = [...history, { question: question.trim(), ...response.output }];
      setResult(response.output); setTwitchCommand(command); setHistory(nextHistory); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id,
        { ...input, result: response.output, twitchCommand: command, history: nextHistory },
        response.output, response.solved,
      );
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Souvenir"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, sourceModuleId, question, answers, finalQuestion, history, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const nextQuestion = () => {
    setQuestion(""); setAnswers(emptyAnswers()); setFinalQuestion(false); setResult(null); setTwitchCommand(""); clearError();
  };

  const reset = useCallback(() => {
    setSourceModuleId(""); setQuestion(""); setAnswers(emptyAnswers()); setFinalQuestion(false);
    setResult(null); setTwitchCommand(""); setHistory([]); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Displayed question" description="Choose the solved module instance this question refers to, then copy the question text.">
      <label className="block text-sm font-medium">
        Source module
        <select
          value={sourceModuleId}
          onChange={(event) => { setSourceModuleId(event.target.value); setResult(null); clearError(); }}
          disabled={isLoading || isSolved}
          className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Select a solved module…</option>
          {sources.map((source) => <option key={source.id} value={source.id}>{humanize(source.type)} · {source.id.slice(0, 8)}</option>)}
        </select>
      </label>
      <label className="mt-3 block text-sm font-medium">
        Question
        <textarea
          value={question}
          onChange={(event) => { setQuestion(event.target.value); setResult(null); setTwitchCommand(""); clearError(); }}
          disabled={isLoading || isSolved}
          rows={3}
          className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="What was the displayed number in the second stage of Memory?"
        />
      </label>
      <RecordedTarget source={selectedSource} question={question} />
    </SolverSection>

    <SolverSection title="Visible answers" description="Enter answers in reading order. Visual and audio question families use recognizable selectors and previews.">
      <div className="space-y-2">
        {answers.map((answer, index) => <div key={index} className="flex gap-2">
          <AnswerField sourceType={selectedSource?.type} question={question} value={answer} onChange={(value) => updateAnswer(index, value)} disabled={isLoading || isSolved} index={index} />
          {answers.length > 2 && <Button type="button" variant="ghost" size="sm" onClick={() => setAnswers((current) => current.filter((_, i) => i !== index))} disabled={isLoading || isSolved} aria-label={`Remove answer ${index + 1}`}>Remove</Button>}
        </div>)}
      </div>
      {answers.length < 6 && <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setAnswers((current) => [...current, ""])} disabled={isLoading || isSolved}>Add answer</Button>}
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={finalQuestion} onChange={(event) => setFinalQuestion(event.target.checked)} disabled={isLoading || isSolved} />
        This is Souvenir’s final question
      </label>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={Boolean(result)} solveText="Find answer" />
    <ErrorAlert error={error} />

    {result && <SolverSection title={`Press answer ${result.answerIndex}`} className="border-emerald-500/40">
      <div className="grid grid-cols-2 gap-2">
        {answers.map((answer, index) => <div key={index} className={cn(
          "rounded-md border-2 p-3 text-center text-sm",
          result.answerIndex === index + 1 ? "border-emerald-500 bg-emerald-500/15 font-semibold text-emerald-700 dark:text-emerald-300" : "border-border text-muted-foreground",
        )}>{answer}</div>)}
      </div>
      {!isSolved && <Button type="button" className="mt-4 w-full" onClick={nextQuestion}>Next question</Button>}
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Souvenir only asks about modules solved earlier. Select the exact module instance, including the instance identified by an ordinal or discriminator in the question.</SolverInstructions>
  </SolverLayout>;
}
