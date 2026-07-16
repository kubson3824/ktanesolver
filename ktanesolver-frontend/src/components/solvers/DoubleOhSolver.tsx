import { useCallback, useMemo, useState } from "react";

import { solveDoubleOh, type DoubleOhButton, type DoubleOhOutput } from "../../services/doubleOhService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverSection,
  TwitchCommandDisplay,
  useSolver,
  useSolverModulePersistence,
} from "../common";
import { Input } from "../ui/input";

const BUTTONS: Array<{ value: DoubleOhButton; glyph: string; label: string }> = [
  { value: "SINGLE_VERTICAL", glyph: "↕", label: "single vertical" },
  { value: "SINGLE_HORIZONTAL", glyph: "↔", label: "single horizontal" },
  { value: "DOUBLE_HORIZONTAL", glyph: "⇔", label: "double horizontal" },
  { value: "DOUBLE_VERTICAL", glyph: "⇕", label: "double vertical" },
  { value: "SQUARE", glyph: "▣", label: "square" },
];
const GLYPHS = Object.fromEntries(BUTTONS.map(({ value, glyph }) => [value, glyph])) as Record<DoubleOhButton, string>;
const emptyObservations = () => Object.fromEntries(BUTTONS.map(({ value }) => [value, ""])) as Record<DoubleOhButton, string>;
const isNumber = (value: string) => /^\d{2}$/.test(value);

export default function DoubleOhSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [displayedNumber, setDisplayedNumber] = useState("");
  const [observations, setObservations] = useState<Record<DoubleOhButton, string>>(emptyObservations);
  const [result, setResult] = useState<DoubleOhOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const enteredObservations = BUTTONS.filter(({ value }) => isNumber(observations[value])).length;
  const complete = isNumber(displayedNumber) && enteredObservations === 4
    && BUTTONS.every(({ value }) => !observations[value] || isNumber(observations[value]));
  const moduleState = useMemo(
    () => ({ displayedNumber, observations, result, twitchCommand }),
    [displayedNumber, observations, result, twitchCommand],
  );

  useSolverModulePersistence<typeof moduleState, DoubleOhOutput>({
    state: moduleState,
    onRestoreState: useCallback((state) => {
      if (typeof state.displayedNumber === "string") setDisplayedNumber(state.displayedNumber);
      if (state.observations) setObservations(state.observations);
      if (state.result) setResult(state.result);
      if (typeof state.twitchCommand === "string") setTwitchCommand(state.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: DoubleOhOutput) => {
      if (!solution?.presses) return;
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.DOUBLE_OH, result: solution }));
    }, []),
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as DoubleOhOutput & { output?: DoubleOhOutput };
      return value.output ?? (value.presses ? value : null);
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const changeNumber = (value: string, setValue: (next: string) => void) => {
    if (/^\d{0,2}$/.test(value)) {
      setValue(value);
      setResult(null);
      setTwitchCommand("");
      clearError();
    }
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!complete) return setError("Enter the original display and exactly four button results as two digits");
    clearError();
    setIsLoading(true);
    try {
      const input = {
        displayedNumber: Number(displayedNumber),
        observations: Object.fromEntries(
          BUTTONS.filter(({ value }) => isNumber(observations[value]))
            .map(({ value }) => [value, Number(observations[value])]),
        ) as Partial<Record<DoubleOhButton, number>>,
      };
      const response = await solveDoubleOh(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.DOUBLE_OH, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { displayedNumber, observations, result: response.output, twitchCommand: command },
        response.output,
        true,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Double-Oh");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb?.id, currentModule?.id, complete, displayedNumber, observations, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setDisplayedNumber("");
    setObservations(emptyObservations());
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Original display" description="Enter the two-digit number shown before touching any button.">
      <Input
        value={displayedNumber}
        onChange={(event) => changeNumber(event.target.value, setDisplayedNumber)}
        inputMode="numeric"
        maxLength={2}
        placeholder="60"
        aria-label="Original displayed number"
        disabled={isLoading || isSolved}
        className="mx-auto w-24 text-center font-mono text-xl"
      />
    </SolverSection>

    <SolverSection title="Cycle four buttons" description="From the original number, test any four buttons and leave the remaining button blank; it will be treated as submit. Press each tested button twice more to return before testing the next one.">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        {BUTTONS.map(({ value, glyph, label }) => <label key={value} className="space-y-1 text-center text-sm font-medium">
          <span className="block text-3xl" aria-hidden>{glyph}</span>
          <span className="sr-only">{label} button result</span>
          <Input
            value={observations[value]}
            onChange={(event) => changeNumber(event.target.value, (next) => setObservations((old) => ({ ...old, [value]: next })))}
            inputMode="numeric"
            maxLength={2}
            placeholder="00"
            aria-label={`${label} button result after one press`}
            disabled={isLoading || isSolved}
            className="text-center font-mono text-lg"
          />
        </label>)}
      </div>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={!complete} />
    <ErrorAlert error={error} />

    {result && <SolverSection title="Press in order" description="The last button submits 00." className="border-emerald-500/40">
      <div className="flex flex-wrap justify-center gap-2">
        {result.presses.map((button, index) => <span key={`${button}-${index}`} className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{GLYPHS[button]}</span>)}
      </div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Use the untouched starting number, which is always at least 10. A cycling button returns to that number after its third press; record only the first result.</SolverInstructions>
  </SolverLayout>;
}
