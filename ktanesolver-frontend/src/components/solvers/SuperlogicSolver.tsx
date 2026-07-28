import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import type { LogicConnective } from "../../services/logicService";
import {
  solveSuperlogic,
  type SuperlogicEquationInput,
  type SuperlogicOutput,
} from "../../services/superlogicService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverResult,
  SolverSection,
  TwitchCommandDisplay,
  useSolver,
  useSolverModulePersistence,
} from "../common";

const VARIABLES = ["A", "B", "C"];
const CONNECTIVES: { value: LogicConnective; symbol: string; label: string }[] = [
  { value: "AND", symbol: "∧", label: "AND" },
  { value: "OR", symbol: "∨", label: "OR" },
  { value: "XOR", symbol: "⊻", label: "XOR" },
  { value: "NAND", symbol: "|", label: "NAND" },
  { value: "NOR", symbol: "↓", label: "NOR" },
  { value: "XNOR", symbol: "↔", label: "XNOR" },
  { value: "IMPL_LEFT", symbol: "→", label: "left implies right" },
  { value: "IMPL_RIGHT", symbol: "←", label: "right implies left" },
];

const defaultEquations = (): SuperlogicEquationInput[] => [
  { operand1: "B", operand2: "C", connective: "AND", negated1: false, negated2: false, negatedExpression: false },
  { operand1: "A", operand2: "C", connective: "AND", negated1: false, negated2: false, negatedExpression: false },
  { operand1: "A", operand2: "B", connective: "AND", negated1: false, negated2: false, negatedExpression: false },
];

interface SuperlogicSolverProps {
  bomb: BombEntity | null | undefined;
}

type Negation = "negated1" | "negated2" | "negatedExpression";

export default function SuperlogicSolver({ bomb }: SuperlogicSolverProps) {
  const [equations, setEquations] = useState(defaultEquations);
  const [result, setResult] = useState<SuperlogicOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading,
    error,
    isSolved,
    setIsLoading,
    setError,
    setIsSolved,
    clearError,
    reset: resetSolverState,
    currentModule,
    round,
    markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);

  const moduleState = useMemo(
    () => ({ equations, result, twitchCommand }),
    [equations, result, twitchCommand],
  );

  const onRestoreState = useCallback((state: {
    equations?: SuperlogicEquationInput[];
    result?: SuperlogicOutput | null;
    twitchCommand?: string;
    input?: { equations?: SuperlogicEquationInput[] };
  }) => {
    const restored = state.equations ?? state.input?.equations;
    if (restored?.length === 3) setEquations(restored);
    if (state.result !== undefined) setResult(state.result);
    if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
  }, []);

  const onRestoreSolution = useCallback((solution: SuperlogicOutput) => {
    if (solution?.values?.length === 3) {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({
        moduleType: ModuleType.SUPERLOGIC,
        result: solution,
      }));
    }
  }, []);

  useSolverModulePersistence<
    { equations: SuperlogicEquationInput[]; result: SuperlogicOutput | null; twitchCommand: string },
    SuperlogicOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (typeof raw === "object" && raw !== null && Array.isArray((raw as SuperlogicOutput).values)) {
        return raw as SuperlogicOutput;
      }
      return null;
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean })?.solved),
    currentModule,
    setIsSolved,
  });

  const setEquation = (index: number, equation: SuperlogicEquationInput) => {
    setEquations((current) => current.map((item, itemIndex) => itemIndex === index ? equation : item));
  };

  const toggleNegation = (index: number, selected: Negation) => {
    const equation = equations[index];
    if (!equation) return;
    const enabled = !equation[selected];
    setEquation(index, {
      ...equation,
      negated1: selected === "negated1" && enabled,
      negated2: selected === "negated2" && enabled,
      negatedExpression: selected === "negatedExpression" && enabled,
    });
  };

  const handleSolve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing round, bomb, or module.");
      return;
    }
    setIsLoading(true);
    clearError();
    try {
      const response = await solveSuperlogic(round.id, bomb.id, currentModule.id, { equations });
      const output = response.output;
      const command = generateTwitchCommand({
        moduleType: ModuleType.SUPERLOGIC,
        result: output,
      });
      setResult(output);
      setTwitchCommand(command);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { equations, result: output, twitchCommand: command },
        output,
        true,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Solve failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setEquations(defaultEquations());
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  const canSolve = equations.every((equation, index) =>
    equation.operand1 !== equation.operand2
    && equation.operand1 !== VARIABLES[index]
    && equation.operand2 !== VARIABLES[index]
  );
  const disabled = isLoading || isSolved;

  return (
    <SolverLayout>
      <SolverSection
        title="Boolean equations"
        description="Enter the right side shown for A, B, and C. Select ¬ expression only when the negator covers the complete right side."
      >
        <div className="space-y-4">
          {equations.map((equation, index) => {
            const available = VARIABLES.filter((variable) => variable !== VARIABLES[index]);
            return (
              <fieldset
                key={VARIABLES[index]}
                disabled={disabled}
                className="rounded-lg border border-border p-4"
              >
                <legend className="px-2 font-semibold">{VARIABLES[index]} equation</legend>
                <div className="flex flex-wrap items-end justify-center gap-3">
                  <span className="pb-2 text-xl font-bold">{VARIABLES[index]} =</span>
                  <label className="flex flex-col gap-1 text-sm">
                    <span>First variable</span>
                    <select
                      value={equation.operand1}
                      onChange={(event) => setEquation(index, { ...equation, operand1: event.target.value })}
                      className="h-11 rounded-md border border-border bg-card px-3 text-lg"
                    >
                      {available.map((variable) => <option key={variable}>{variable}</option>)}
                    </select>
                  </label>
                  <label className="flex items-center gap-2 pb-2 text-sm">
                    <input
                      type="checkbox"
                      checked={equation.negated1}
                      onChange={() => toggleNegation(index, "negated1")}
                    />
                    Negate first
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span>Operator</span>
                    <select
                      value={equation.connective}
                      onChange={(event) => setEquation(index, {
                        ...equation,
                        connective: event.target.value as LogicConnective,
                      })}
                      className="h-11 rounded-md border border-border bg-card px-3 text-lg"
                    >
                      {CONNECTIVES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.symbol} — {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span>Second variable</span>
                    <select
                      value={equation.operand2}
                      onChange={(event) => setEquation(index, { ...equation, operand2: event.target.value })}
                      className="h-11 rounded-md border border-border bg-card px-3 text-lg"
                    >
                      {available.map((variable) => <option key={variable}>{variable}</option>)}
                    </select>
                  </label>
                  <label className="flex items-center gap-2 pb-2 text-sm">
                    <input
                      type="checkbox"
                      checked={equation.negated2}
                      onChange={() => toggleNegation(index, "negated2")}
                    />
                    Negate second
                  </label>
                  <label className="flex items-center gap-2 pb-2 text-sm">
                    <input
                      type="checkbox"
                      checked={equation.negatedExpression}
                      onChange={() => toggleNegation(index, "negatedExpression")}
                    />
                    ¬ expression
                  </label>
                </div>
              </fieldset>
            );
          })}
        </div>
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={!canSolve}
        isLoading={isLoading}
        isSolved={isSolved}
      />
      <ErrorAlert error={error} />
      {result && (
        <SolverResult
          variant="success"
          title="Set the variables and submit"
          description={result.values.map((value, index) =>
            `${VARIABLES[index]} = ${value ? "True" : "False"}`
          ).join("\n")}
        />
      )}
      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
      <SolverInstructions>
        Match each equation exactly. A Superlogic equation contains the other two variables, one
        Boolean operator, and at most one ¬ negator.
      </SolverInstructions>
    </SolverLayout>
  );
}
