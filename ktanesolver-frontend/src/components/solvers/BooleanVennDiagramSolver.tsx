import { useCallback, useMemo, useState } from "react";
import { solveBooleanVennDiagram, type BooleanOperator, type BooleanVennDiagramOutput, type BooleanVennGrouping } from "../../services/booleanVennDiagramService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const OPERATORS: { value: BooleanOperator; symbol: string }[] = [
  { value: "AND", symbol: "∧" }, { value: "OR", symbol: "∨" },
  { value: "XOR", symbol: "⊻" }, { value: "IMPLIES", symbol: "→" },
  { value: "NAND", symbol: "|" }, { value: "NOR", symbol: "↓" },
  { value: "XNOR", symbol: "↔" }, { value: "IMPLIED_BY", symbol: "←" },
];

const REGION_POSITIONS = [
  ["NONE", 286, 26], ["C", 215, 162], ["B", 85, 162], ["BC", 150, 184],
  ["A", 150, 36], ["AC", 197, 101], ["AB", 103, 101], ["ABC", 150, 128],
] as const;

function VennResult({ regions }: { regions: string[] }) {
  const active = new Set(regions);
  return <svg viewBox="0 0 320 220" className="mx-auto w-full max-w-md" role="img" aria-label={`Press regions: ${regions.join(", ")}`}>
    <title>Venn diagram with the regions to press highlighted in green</title>
    <g className="fill-none stroke-muted-foreground" strokeWidth="2">
      <circle cx="150" cy="78" r="63" /><circle cx="108" cy="145" r="63" /><circle cx="192" cy="145" r="63" />
    </g>
    {REGION_POSITIONS.map(([region, x, y]) => <g key={region}>
      <circle cx={x} cy={y} r="16" className={active.has(region) ? "fill-emerald-500/30 stroke-emerald-500" : "fill-background stroke-muted-foreground/50"} strokeWidth="2" />
      <text x={x} y={y + 4} textAnchor="middle" className="fill-foreground text-[10px] font-bold">{region}</text>
    </g>)}
  </svg>;
}

function OperatorPicker({ label, value, onChange, disabled }: { label: string; value: BooleanOperator; onChange: (value: BooleanOperator) => void; disabled: boolean }) {
  return <fieldset disabled={disabled}>
    <legend className="mb-2 text-sm font-medium">{label}</legend>
    <div className="grid grid-cols-4 gap-2">
      {OPERATORS.map((operator) => <button key={operator.value} type="button" onClick={() => onChange(operator.value)} aria-pressed={value === operator.value} className={`rounded-md border px-2 py-2 font-mono ${value === operator.value ? "border-primary bg-primary/10 ring-2 ring-primary/30" : "border-border"}`} title={operator.value.replace("_", " ")}>
        <span className="text-xl" aria-hidden="true">{operator.symbol}</span><span className="sr-only">{operator.value.replace("_", " ")}</span>
      </button>)}
    </div>
  </fieldset>;
}

export default function BooleanVennDiagramSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [firstOperator, setFirstOperator] = useState<BooleanOperator>("AND");
  const [secondOperator, setSecondOperator] = useState<BooleanOperator>("AND");
  const [grouping, setGrouping] = useState<BooleanVennGrouping>("AB_FIRST");
  const [result, setResult] = useState<BooleanVennDiagramOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const savedState = useMemo(() => ({ firstOperator, secondOperator, grouping, result, twitchCommand }), [firstOperator, secondOperator, grouping, result, twitchCommand]);

  useSolverModulePersistence<typeof savedState, BooleanVennDiagramOutput>({
    state: savedState,
    onRestoreState: useCallback((saved) => {
      if (OPERATORS.some(({ value }) => value === saved.firstOperator)) setFirstOperator(saved.firstOperator);
      if (OPERATORS.some(({ value }) => value === saved.secondOperator)) setSecondOperator(saved.secondOperator);
      if (saved.grouping === "AB_FIRST" || saved.grouping === "BC_FIRST") setGrouping(saved.grouping);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: BooleanVennDiagramOutput) => {
      setResult(solution); setTwitchCommand(solution.regions.join(" ").toLowerCase());
    }, []),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const input = { firstOperator, secondOperator, grouping };
      const response = await solveBooleanVennDiagram(round.id, bomb.id, currentModule.id, input);
      const command = response.output.regions.join(" ").toLowerCase();
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Boolean Venn Diagram"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, firstOperator, secondOperator, grouping, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setFirstOperator("AND"); setSecondOperator("AND"); setGrouping("AB_FIRST"); setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Displayed expression" description="Match the two symbols and the parentheses exactly.">
      <div className="mb-4 grid grid-cols-2 gap-2">
        <button type="button" disabled={isLoading || isSolved} onClick={() => setGrouping("AB_FIRST")} aria-pressed={grouping === "AB_FIRST"} className={`rounded-md border p-3 font-mono ${grouping === "AB_FIRST" ? "border-primary bg-primary/10 ring-2 ring-primary/30" : "border-border"}`}>(A op B) op C</button>
        <button type="button" disabled={isLoading || isSolved} onClick={() => setGrouping("BC_FIRST")} aria-pressed={grouping === "BC_FIRST"} className={`rounded-md border p-3 font-mono ${grouping === "BC_FIRST" ? "border-primary bg-primary/10 ring-2 ring-primary/30" : "border-border"}`}>A op (B op C)</button>
      </div>
      <div className="space-y-4">
        <OperatorPicker label="First symbol" value={firstOperator} onChange={(value) => { setFirstOperator(value); clearError(); }} disabled={isLoading || isSolved} />
        <OperatorPicker label="Second symbol" value={secondOperator} onChange={(value) => { setSecondOperator(value); clearError(); }} disabled={isLoading || isSolved} />
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find true regions" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Press the green regions" description={result.expression} className="border-emerald-500/40">
      <VennResult regions={result.regions} />
      <p className="text-center font-mono font-semibold">{result.regions.join(" · ")}</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>A is the top circle, B the bottom-left circle, C the bottom-right circle, and NONE is outside all circles.</SolverInstructions>
  </SolverLayout>;
}
