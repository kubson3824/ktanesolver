import { useCallback, useMemo, useState } from "react";
import { solveTaxReturns, type TaxReturnsOutput } from "../../services/taxReturnsService";
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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const emptyRecords = () => Array<string>(12).fill("");
const emptyExpenses = () => Array<string>(36).fill("");
const parseAmount = (value: string) => Number(value.replace(/[£,\s]/g, ""));
const validAmount = (value: string) => /^(?:£\s*)?\d[\d,\s]*$/.test(value.trim());
const money = (value: number) => `£${value.toLocaleString("en-GB")}`;

export default function TaxReturnsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [turnovers, setTurnovers] = useState(emptyRecords);
  const [expenses, setExpenses] = useState(emptyExpenses);
  const [surnameFirstLetter, setSurnameFirstLetter] = useState("");
  const [niLastLetter, setNiLastLetter] = useState("");
  const [payrollLastDigit, setPayrollLastDigit] = useState("");
  const [result, setResult] = useState<TaxReturnsOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved,
    clearError, reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({
    turnovers, expenses, surnameFirstLetter, niLastLetter, payrollLastDigit, result,
  }), [turnovers, expenses, surnameFirstLetter, niLastLetter, payrollLastDigit, result]);
  const twitchCommand = result
    ? generateTwitchCommand({ moduleType: ModuleType.TAX_RETURNS, result })
    : "";

  useSolverModulePersistence<typeof state, TaxReturnsOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      if (Array.isArray(saved.turnovers)) setTurnovers(saved.turnovers);
      if (Array.isArray(saved.expenses)) setExpenses(saved.expenses);
      if (typeof saved.surnameFirstLetter === "string") setSurnameFirstLetter(saved.surnameFirstLetter);
      if (typeof saved.niLastLetter === "string") setNiLastLetter(saved.niLastLetter);
      if (typeof saved.payrollLastDigit === "string") setPayrollLastDigit(saved.payrollLastDigit);
      if (saved.result) setResult(saved.result);
    }, []),
    onRestoreSolution: useCallback((solution: TaxReturnsOutput) => setResult(solution), []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!turnovers.every(validAmount) || !expenses.every(validAmount)) {
      return setError("Enter every turnover and expense amount");
    }
    if (!/^[A-Za-z]$/.test(surnameFirstLetter.trim()) || !/^[A-Za-z]$/.test(niLastLetter.trim())) {
      return setError("Enter one letter for the surname and NI fields");
    }
    if (!/^\d$/.test(payrollLastDigit.trim())) return setError("Enter the last payroll digit");

    clearError();
    setIsLoading(true);
    try {
      const response = await solveTaxReturns(round.id, bomb.id, currentModule.id, {
        turnovers: turnovers.map(parseAmount),
        expenses: expenses.map(parseAmount),
        surnameFirstLetter,
        niLastLetter,
        payrollLastDigit: Number(payrollLastDigit),
      });
      setResult(response.output);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { ...state, result: response.output },
        response.output,
        response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Tax Returns");
    } finally {
      setIsLoading(false);
    }
  }, [
    round?.id, bomb?.id, currentModule?.id, turnovers, expenses, surnameFirstLetter,
    niLastLetter, payrollLastDigit, state, clearError, markModuleSolved, setError,
    setIsLoading, setIsSolved, updateModuleAfterSolve,
  ]);

  const reset = useCallback(() => {
    setTurnovers(emptyRecords());
    setExpenses(emptyExpenses());
    setSurnameFirstLetter("");
    setNiLastLetter("");
    setPayrollLastDigit("");
    setResult(null);
    resetSolverState();
  }, [resetSolverState]);
  const disabled = isLoading || isSolved;

  return <SolverLayout>
    <SolverSection title="Financial records" description="Enter the turnover and three expenses shown for each month. Commas and £ signs are accepted.">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] border-separate border-spacing-2">
          <caption className="sr-only">Monthly turnover and expense records</caption>
          <thead>
            <tr className="text-left text-sm">
              <th scope="col">Month</th>
              <th scope="col">Turnover</th>
              <th scope="col">Expense 1</th>
              <th scope="col">Expense 2</th>
              <th scope="col">Expense 3</th>
            </tr>
          </thead>
          <tbody>
            {MONTHS.map((month, monthIndex) => <tr key={month}>
              <th scope="row" className="pr-2 text-left text-sm font-medium">{month}</th>
              <td><Input
                inputMode="numeric"
                aria-label={`${month} turnover`}
                value={turnovers[monthIndex]}
                onChange={(event) => setTurnovers((values) =>
                  values.map((value, index) => index === monthIndex ? event.target.value : value))}
                disabled={disabled}
              /></td>
              {[0, 1, 2].map((expenseIndex) => {
                const index = monthIndex * 3 + expenseIndex;
                return <td key={expenseIndex}><Input
                  inputMode="numeric"
                  aria-label={`${month} expense ${expenseIndex + 1}`}
                  value={expenses[index]}
                  onChange={(event) => setExpenses((values) =>
                    values.map((value, valueIndex) => valueIndex === index ? event.target.value : value))}
                  disabled={disabled}
                /></td>;
              })}
            </tr>)}
          </tbody>
        </table>
      </div>
    </SolverSection>

    <SolverSection title="Taxpayer details" description="Use only the requested character from each displayed record.">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-medium">Surname first letter
          <Input maxLength={1} value={surnameFirstLetter} onChange={(event) => setSurnameFirstLetter(event.target.value)} disabled={disabled} className="mt-1" />
        </label>
        <label className="text-sm font-medium">NI number last letter
          <Input maxLength={1} value={niLastLetter} onChange={(event) => setNiLastLetter(event.target.value)} disabled={disabled} className="mt-1" />
        </label>
        <label className="text-sm font-medium">Payroll number last digit
          <Input inputMode="numeric" maxLength={1} value={payrollLastDigit} onChange={(event) => setPayrollLastDigit(event.target.value)} disabled={disabled} className="mt-1" />
        </label>
      </div>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />

    {result && <SolverSection title="Tax calculation" className="border-emerald-500/40">
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-muted-foreground">Gross turnover</dt><dd className="font-semibold">{money(result.grossTurnover)}</dd></div>
        <div><dt className="text-muted-foreground">Gross expenses</dt><dd className="font-semibold">{money(result.grossExpenses)}</dd></div>
        <div><dt className="text-muted-foreground">Pension contribution ({result.pensionRate}%)</dt><dd className="font-semibold">{money(result.pensionContribution)}</dd></div>
        <div><dt className="text-muted-foreground">Portfolio {result.portfolio} investment</dt><dd className="font-semibold">{money(result.taxFreeInvestment)}</dd></div>
        <div><dt className="text-muted-foreground">Gross profit</dt><dd className="font-semibold">{money(result.grossProfit)}</dd></div>
        <div><dt className="text-muted-foreground">Tax-free allowance</dt><dd className="font-semibold">{money(result.taxFreeAllowance)}</dd></div>
        <div><dt className="text-muted-foreground">Income Tax</dt><dd className="font-semibold">{money(result.incomeTax)}</dd></div>
        <div><dt className="text-muted-foreground">National Insurance</dt><dd className="font-semibold">{money(result.nationalInsurance)}</dd></div>
      </dl>
      <div className="mt-5 rounded-xl border-4 border-emerald-500/70 bg-slate-950 p-6 text-center text-white" role="status" aria-live="polite">
        <p className="text-sm text-slate-300">Submit this total tax bill</p>
        <p className="font-mono text-4xl font-bold tabular-nums sm:text-5xl">{money(result.totalTaxBill)}</p>
      </div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Toggle to the HMRC terminal, enter the total tax bill, then press Submit.</SolverInstructions>
  </SolverLayout>;
}
