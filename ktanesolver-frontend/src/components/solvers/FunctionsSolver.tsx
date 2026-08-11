import { useCallback, useMemo, useState } from "react";
import { solveFunctions, type FunctionsObservation, type FunctionsOutput } from "../../services/functionsService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

export default function FunctionsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [leftNumber, setLeftNumber] = useState(1);
  const [letter, setLetter] = useState("A");
  const [rightNumber, setRightNumber] = useState(2);
  const [queryA, setQueryA] = useState(0);
  const [queryB, setQueryB] = useState(0);
  const [queryResult, setQueryResult] = useState("");
  const [observations, setObservations] = useState<FunctionsObservation[]>([]);
  const [result, setResult] = useState<FunctionsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ leftNumber, letter, rightNumber, queryA, queryB, queryResult, observations, result, twitchCommand }), [leftNumber, letter, rightNumber, queryA, queryB, queryResult, observations, result, twitchCommand]);

  useSolverModulePersistence<typeof state, FunctionsOutput>({
    state,
    onRestoreState: useCallback(saved => {
      if (saved.leftNumber !== undefined) setLeftNumber(saved.leftNumber);
      if (saved.letter) setLetter(saved.letter);
      if (saved.rightNumber !== undefined) setRightNumber(saved.rightNumber);
      if (saved.queryA !== undefined) setQueryA(saved.queryA);
      if (saved.queryB !== undefined) setQueryB(saved.queryB);
      if (saved.queryResult !== undefined) setQueryResult(saved.queryResult);
      if (saved.observations) setObservations(saved.observations);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: FunctionsOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.FUNCTIONS, result: solution }));
    }, []),
    currentModule,
    setIsSolved,
  });

  const changed = () => { setResult(null); setTwitchCommand(""); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    const parsedResult = queryResult.trim() === "" ? null : Number(queryResult);
    const nextObservations = parsedResult === null ? observations : [...observations, { a: queryA, b: queryB, result: parsedResult }];
    clearError();
    setIsLoading(true);
    try {
      const response = await solveFunctions(round.id, bomb.id, currentModule.id, leftNumber, letter, rightNumber, nextObservations);
      const command = generateTwitchCommand({ moduleType: ModuleType.FUNCTIONS, result: response.output });
      setObservations(nextObservations);
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(response.solved);
      const suggested = response.output.suggestedQuery?.length === 2 ? response.output.suggestedQuery : null;
      if (suggested) {
        setQueryA(suggested[0]);
        setQueryB(suggested[1]);
        setQueryResult("");
      }
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, {
        ...state,
        queryA: suggested?.[0] ?? queryA,
        queryB: suggested?.[1] ?? queryB,
        queryResult: suggested ? "" : queryResult,
        observations: nextObservations,
        result: response.output,
        twitchCommand: command,
      }, response.output, response.solved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Functions");
    } finally {
      setIsLoading(false);
    }
  };
  const reset = () => {
    setLeftNumber(1); setLetter("A"); setRightNumber(2); setQueryA(0); setQueryB(0); setQueryResult("");
    setObservations([]); setResult(null); setTwitchCommand(""); resetSolverState();
  };

  return <SolverLayout>
    <SolverSection title="Bottom display">
      <div className="grid gap-3 sm:grid-cols-3">
        <label>Left number<input aria-label="Left displayed number" type="number" min={1} max={999} value={leftNumber} onChange={event => { setLeftNumber(Number(event.target.value)); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3" /></label>
        <label>Letter<input aria-label="Displayed letter" maxLength={1} value={letter} onChange={event => { setLetter(event.target.value.toUpperCase()); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3 text-center uppercase" /></label>
        <label>Right number<input aria-label="Right displayed number" type="number" min={1} max={999} value={rightNumber} onChange={event => { setRightNumber(Number(event.target.value)); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3" /></label>
      </div>
    </SolverSection>
    <SolverSection title="Query observation" description={observations.length ? `${observations.length} completed quer${observations.length === 1 ? "y" : "ies"}` : "Click Suggest query first, then perform it on the module and enter its result."}>
      <div className="grid gap-3 sm:grid-cols-3">
        <label>a<input aria-label="Query a" type="number" min={1} max={9999} value={queryA || ""} onChange={event => { setQueryA(Number(event.target.value)); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3" /></label>
        <label>b<input aria-label="Query b" type="number" min={1} max={9999} value={queryB || ""} onChange={event => { setQueryB(Number(event.target.value)); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3" /></label>
        <label>Displayed result<input aria-label="Query result" inputMode="numeric" value={queryResult} onChange={event => { setQueryResult(event.target.value.replace(/\D/g, "")); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3 font-mono" /></label>
      </div>
      {observations.length > 0 && <p className="mt-3 text-sm text-muted-foreground">Recorded: {observations.map(item => `(${item.a}, ${item.b}) → ${item.result}`).join("; ")}</p>}
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText={observations.length || queryResult ? "Analyze query" : "Suggest query"} />
    <ErrorAlert error={error} />
    {result?.answer !== null && result?.answer !== undefined && <SolverSection title="Submit" className="border-emerald-500/40">
      <p className="text-3xl font-bold font-mono">{result.answer}</p>
      <p className="mt-2 text-sm">Query function #{result.queryFunctionNumber}: {result.queryFunction}</p>
      <p className="text-sm">Final function #{result.finalFunctionNumber}: {result.finalFunction}</p>
    </SolverSection>}
    {result?.suggestedQuery && <SolverSection title="Perform this query" className="border-amber-500/40">
      <p className="text-2xl font-bold font-mono">{result.suggestedQuery[0]}, {result.suggestedQuery[1]}</p>
      <p className="mt-2 text-sm">{result.candidateFunctionNumbers.length} query functions remain. Enter the displayed result above and analyze again.</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Queries must use two distinct nonzero values. The module keeps only the last four digits of each entered value. This solver follows Rule Seed 1. Souvenir records the bottom numbers and letter plus the last digit of the first query result.</SolverInstructions>
  </SolverLayout>;
}
