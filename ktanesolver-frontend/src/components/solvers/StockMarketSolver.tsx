import { useCallback, useMemo, useState } from "react";
import {
  STOCK_MARKET_COLORS, STOCK_MARKET_COMPANIES, solveStockMarket,
  type StockMarketColor, type StockMarketCompanyInput, type StockMarketOutput,
} from "../../services/stockMarketService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const initialCompanies = (): StockMarketCompanyInput[] => STOCK_MARKET_COMPANIES.slice(0, 4).map(([abbreviation]) => ({
  abbreviation, color: "BLUE", fluctuations: [5, 5, 5, 5],
}));

export default function StockMarketSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [companies, setCompanies] = useState<StockMarketCompanyInput[]>(initialCompanies);
  const [result, setResult] = useState<StockMarketOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ companies, result, twitchCommand }), [companies, result, twitchCommand]);

  useSolverModulePersistence<typeof state, StockMarketOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      if (Array.isArray(saved.companies) && saved.companies.length === 4) setCompanies(saved.companies);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: StockMarketOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.THE_STOCK_MARKET, result: solution }));
    }, []),
    currentModule,
    setIsSolved,
  });

  const updateCompany = (index: number, update: Partial<StockMarketCompanyInput>) => {
    setCompanies((current) => current.map((company, position) => position === index ? { ...company, ...update } : company));
    setResult(null); setTwitchCommand(""); clearError();
  };
  const updateFluctuation = (companyIndex: number, quarter: number, value: number) => {
    const fluctuations = [...companies[companyIndex].fluctuations];
    fluctuations[quarter] = value;
    updateCompany(companyIndex, { fluctuations });
  };

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (new Set(companies.map((company) => company.abbreviation)).size !== 4) return setError("Use four distinct companies");
    if (companies.some((company) => company.fluctuations.some((value) => !Number.isFinite(value) || Math.abs(value) < 5 || Math.abs(value) >= 50))) {
      return setError("Fluctuations must be from ±5.00 through ±49.99");
    }
    clearError(); setIsLoading(true);
    try {
      const response = await solveStockMarket(round.id, bomb.id, currentModule.id, companies);
      const command = generateTwitchCommand({ moduleType: ModuleType.THE_STOCK_MARKET, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { companies, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve The Stock Market"); }
    finally { setIsLoading(false); }
  };

  const reset = () => {
    setCompanies(initialCompanies()); setResult(null); setTwitchCommand(""); resetSolverState();
  };

  return <SolverLayout>
    <SolverSection title="Company observations" description="Enter the four displays in their physical order and each quarter from Q1 through Q4.">
      <div className="space-y-4">
        {companies.map((company, index) => <fieldset key={index} className="rounded-md border border-border p-3" disabled={isLoading || isSolved}>
          <legend className="px-1 text-sm font-semibold">Company {index + 1}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">Company
              <select aria-label={`Company ${index + 1} abbreviation`} value={company.abbreviation} onChange={(event) => updateCompany(index, { abbreviation: event.target.value })} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3">
                {STOCK_MARKET_COMPANIES.map(([abbreviation, name]) => <option key={abbreviation} value={abbreviation}>{abbreviation} — {name}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium">Text color
              <select aria-label={`Company ${index + 1} color`} value={company.color} onChange={(event) => updateCompany(index, { color: event.target.value as StockMarketColor })} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3">
                {STOCK_MARKET_COLORS.map((color) => <option key={color}>{color}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {company.fluctuations.map((value, quarter) => <label key={quarter} className="text-sm font-medium">Q{quarter + 1}
              <input aria-label={`Company ${index + 1} quarter ${quarter + 1}`} type="number" min="-49.99" max="49.99" step="0.01" value={value} onChange={(event) => updateFluctuation(index, quarter, Number(event.target.value))} className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3" />
            </label>)}
          </div>
        </fieldset>)}
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Rank companies" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Investment result" className="border-emerald-500/40">
      <p className="text-center font-semibold">Invest in {result.companies.join(" or ")}</p>
      <div className="mt-3 overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className="text-left">Company</th><th>Peak</th><th>Slump</th><th>Flux</th><th>Total</th></tr></thead>
        <tbody>{result.scores.map((score) => <tr key={score.abbreviation} className="border-t"><td>{score.abbreviation} — {score.name}</td><td className="text-center">{score.peakPoints}</td><td className="text-center">{score.slumpPoints}</td><td className="text-center">{score.fluctuationPoints}</td><td className="text-center font-semibold">{score.total}</td></tr>)}</tbody>
      </table></div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>The starting price comes from the company text color. A wrong investment regenerates all four companies, colors, and figures, so reset this solver before entering the replacement observation.</SolverInstructions>
  </SolverLayout>;
}
