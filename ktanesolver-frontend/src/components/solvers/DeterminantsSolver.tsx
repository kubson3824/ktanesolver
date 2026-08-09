import { useCallback, useMemo, useState } from "react";
import { solveDeterminants, type DeterminantsInput, type DeterminantsOutput } from "../../services/determinantsService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

type SavedState = Partial<DeterminantsInput> & { input?: Partial<DeterminantsInput>; result?: DeterminantsOutput | null; twitchCommand?: string };
const INITIAL: DeterminantsInput = { a: 0, b: 0, c: 0, d: 0 };

export default function DeterminantsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [matrix, setMatrix] = useState<DeterminantsInput>(INITIAL);
  const [result, setResult] = useState<DeterminantsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ ...matrix, result, twitchCommand }), [matrix, result, twitchCommand]);

  useSolverModulePersistence<SavedState, DeterminantsOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      const input = saved.input ?? saved;
      if ([input.a, input.b, input.c, input.d].every((value) => typeof value === "number")) {
        setMatrix(input as DeterminantsInput);
      }
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: DeterminantsOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.DETERMINANTS, result: solution }));
    }, []),
    currentModule,
    setIsSolved,
  });

  const change = (key: keyof DeterminantsInput, value: number) => {
    setMatrix((current) => ({ ...current, [key]: value })); setResult(null); setTwitchCommand(""); clearError();
  };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveDeterminants(round.id, bomb.id, currentModule.id, matrix);
      const command = generateTwitchCommand({ moduleType: ModuleType.DETERMINANTS, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(false);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...matrix, result: response.output, twitchCommand: command }, response.output, false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Determinants"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setMatrix(INITIAL); setResult(null); setTwitchCommand(""); resetSolverState(); };

  return <SolverLayout>
    <SolverSection title="Active matrix" description="Enter the four displayed values in reading order.">
      <div className="mx-auto grid max-w-48 grid-cols-2 gap-3">
        {(Object.keys(matrix) as Array<keyof DeterminantsInput>).map((key) => <input key={key} aria-label={`Matrix ${key}`} type="number" min={-9} max={9} value={matrix[key]} onChange={(event) => change(key, Number(event.target.value))} disabled={isLoading} className="h-12 rounded-md border border-input bg-background px-3 text-center text-xl font-mono" />)}
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={false} solveText="Calculate determinant" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Submit" className="border-emerald-500/40">
      <p className="text-center text-4xl font-bold">{result.determinant}</p>
      <p className="mt-2 text-center text-sm text-muted-foreground">{matrix.a} × {matrix.d} − {matrix.b} × {matrix.c}</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Enter the determinant on the needy keypad and press submit. Replace all four values when the needy activates again.</SolverInstructions>
  </SolverLayout>;
}
