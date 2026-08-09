import { useCallback, useMemo, useState } from "react";
import {
  BRITISH_SLANG_DEFINITIONS, BRITISH_SLANG_WORDS, solveBritishSlang,
  type BritishSlangInput, type BritishSlangOutput,
} from "../../services/britishSlangService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

type SavedState = Partial<BritishSlangInput> & { stage?: number; input?: Partial<BritishSlangInput>; result?: BritishSlangOutput | null; twitchCommand?: string };
const POSITION_NAMES = ["Top", "Right", "Bottom", "Left"];

export default function BritishSlangSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [stage, setStage] = useState(1);
  const [definition, setDefinition] = useState<string>(BRITISH_SLANG_DEFINITIONS[0]);
  const [buttons, setButtons] = useState(["", "", "", ""]);
  const [newAttempt, setNewAttempt] = useState(false);
  const [result, setResult] = useState<BritishSlangOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ stage, definition, buttons, newAttempt, result, twitchCommand }),
    [stage, definition, buttons, newAttempt, result, twitchCommand]);

  useSolverModulePersistence<SavedState, BritishSlangOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      const input = saved.input ?? saved;
      if (saved.stage) setStage(saved.stage);
      if (input.definition) setDefinition(input.definition);
      if (input.buttons?.length === 4) setButtons(input.buttons);
      if (input.newAttempt !== undefined) setNewAttempt(input.newAttempt);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: BritishSlangOutput) => {
      setStage(6); setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.BRITISH_SLANG, result: solution }));
    }, []),
    currentModule,
    setIsSolved,
  });

  const clearResult = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    const input: BritishSlangInput = { definition, buttons, newAttempt };
    clearError(); setIsLoading(true);
    try {
      const response = await solveBritishSlang(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.BRITISH_SLANG, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved); setNewAttempt(false);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      else { setStage(response.output.nextStage); setButtons(["", "", "", ""]); }
      updateModuleAfterSolve(bomb.id, currentModule.id, {
        stage: response.output.nextStage, definition, buttons: response.solved ? buttons : ["", "", "", ""], newAttempt: false,
        result: response.output, twitchCommand: command,
      }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve British Slang"); }
    finally { setIsLoading(false); }
  };
  const reset = () => {
    setStage(1); setDefinition(BRITISH_SLANG_DEFINITIONS[0]); setButtons(["", "", "", ""]); setNewAttempt(true);
    setResult(null); setTwitchCommand(""); resetSolverState();
  };

  return <SolverLayout>
    <SolverSection title={`Stage ${stage}`} description="Enter the definition and the four labels in top, right, bottom, left order.">
      <label className="block text-sm font-medium">Definition
        <select aria-label="Displayed definition" value={definition} onChange={(event) => { setDefinition(event.target.value); clearResult(); }} disabled={isLoading || isSolved} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3">
          {BRITISH_SLANG_DEFINITIONS.map((value) => <option key={value}>{value}</option>)}
        </select>
      </label>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {buttons.map((button, index) => <label key={POSITION_NAMES[index]} className="text-sm font-medium">{POSITION_NAMES[index]} button
          <select aria-label={`${POSITION_NAMES[index]} button word`} value={button} onChange={(event) => { const next = [...buttons]; next[index] = event.target.value; setButtons(next); clearResult(); }} disabled={isLoading || isSolved} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3">
            <option value="">{stage === 1 ? "BLANK" : "Select word"}</option>
            {BRITISH_SLANG_WORDS.map((word) => <option key={word}>{word}</option>)}
          </select>
        </label>)}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Stage 1 has exactly one blank. Later stages require four word labels.</p>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText={stage === 6 ? "Solve module" : "Solve stage"} />
    <ErrorAlert error={error} />
    {result && <SolverSection title={`Stage ${result.stage} answer`} className="border-emerald-500/40">
      <p className="text-center text-2xl font-bold">Press {POSITION_NAMES[result.pressPosition - 1]} ({result.pressLabel})</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Any wrong press regenerates the entire six-stage sequence. Use Reset here after a strike; the next solve explicitly replaces stale backend progress.</SolverInstructions>
  </SolverLayout>;
}
