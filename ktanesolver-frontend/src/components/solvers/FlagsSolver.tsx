import { useCallback, useMemo, useState } from "react";
import {
  FLAGS_COUNTRIES,
  flagsCountryName,
  solveFlags,
  type FlagsCountry,
  type FlagsInput,
  type FlagsOutput,
} from "../../services/flagsService";
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

const emptyCountries = (): Array<FlagsCountry | ""> => Array(7).fill("");
const SELECT_CLASS = "mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm";

export default function FlagsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [mainCountry, setMainCountry] = useState<FlagsCountry | "">("");
  const [countries, setCountries] = useState<Array<FlagsCountry | "">>(emptyCountries);
  const [displayedNumber, setDisplayedNumber] = useState(1);
  const [result, setResult] = useState<FlagsOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const savedState = useMemo(
    () => ({ mainCountry, countries, displayedNumber, result }),
    [mainCountry, countries, displayedNumber, result],
  );

  useSolverModulePersistence<typeof savedState, FlagsOutput>({
    state: savedState,
    onRestoreState: useCallback((saved: Partial<typeof savedState> & { input?: Partial<FlagsInput> }) => {
      const input = saved.input ?? saved;
      if (input.mainCountry) setMainCountry(input.mainCountry);
      if (input.countries?.length === 7) setCountries(input.countries);
      if (Number.isInteger(input.displayedNumber) && input.displayedNumber! >= 1 && input.displayedNumber! <= 7) {
        setDisplayedNumber(input.displayedNumber!);
      }
      if (saved.result) setResult(saved.result);
    }, []),
    onRestoreSolution: useCallback((solution: FlagsOutput) => {
      if (solution?.answerCountry) setResult(solution);
    }, []),
    currentModule,
    setIsSolved,
  });

  const valid = mainCountry !== ""
    && countries.every(Boolean)
    && new Set(countries).size === 7
    && !countries.includes(mainCountry);
  const twitchCommand = result
    ? generateTwitchCommand({ moduleType: ModuleType.FLAGS, result })
    : "";
  const change = () => { setResult(null); clearError(); };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!mainCountry) return setError("Select the main flag");
    if (countries.some((country) => !country) || new Set(countries).size !== 7) {
      return setError("Select seven different candidate flags");
    }
    if (countries.includes(mainCountry)) return setError("The main flag cannot also be a candidate flag");

    clearError(); setIsLoading(true);
    try {
      const input: FlagsInput = { mainCountry, countries: countries as FlagsCountry[], displayedNumber };
      const response = await solveFlags(round.id, bomb.id, currentModule.id, input);
      setResult(response.output); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { ...input, result: response.output },
        response.output,
        response.solved,
      );
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Flags"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, mainCountry, countries, displayedNumber, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setMainCountry(""); setCountries(emptyCountries()); setDisplayedNumber(1); setResult(null); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Main flag and display" description="Identify the large flag, then enter the number shown above it.">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Main country
          <select
            aria-label="Main country"
            value={mainCountry}
            onChange={(event) => { setMainCountry(event.target.value as FlagsCountry); change(); }}
            disabled={isLoading || isSolved}
            className={SELECT_CLASS}
          >
            <option value="">Select a country…</option>
            {FLAGS_COUNTRIES.map((country) => <option key={country} value={country} disabled={countries.includes(country)}>{flagsCountryName(country)}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Displayed number
          <select
            aria-label="Displayed number"
            value={displayedNumber}
            onChange={(event) => { setDisplayedNumber(Number(event.target.value)); change(); }}
            disabled={isLoading || isSolved}
            className={SELECT_CLASS}
          >
            {[1, 2, 3, 4, 5, 6, 7].map((number) => <option key={number} value={number}>{number}</option>)}
          </select>
        </label>
      </div>
    </SolverSection>

    <SolverSection title="Candidate flags" description="Identify each of the seven smaller flags.">
      <div className="grid gap-3 sm:grid-cols-2">
        {countries.map((country, index) => <label key={index} className="text-sm font-medium">Candidate {index + 1}
          <select
            aria-label={`Candidate flag ${index + 1}`}
            value={country}
            onChange={(event) => {
              const next = [...countries]; next[index] = event.target.value as FlagsCountry;
              setCountries(next); change();
            }}
            disabled={isLoading || isSolved}
            className={SELECT_CLASS}
          >
            <option value="">Select a country…</option>
            {FLAGS_COUNTRIES.map((option) => <option
              key={option}
              value={option}
              disabled={option === mainCountry || (countries.includes(option) && country !== option)}
            >{flagsCountryName(option)}</option>)}
          </select>
        </label>)}
      </div>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={!valid} solveText="Find the flag" />
    <ErrorAlert error={error} />
    {result && <SolverSection title={`Submit ${flagsCountryName(result.answerCountry)}`} className="border-emerald-500/40">
      <p className="rounded-md border-2 border-emerald-500 bg-emerald-500/15 p-5 text-center text-2xl font-bold text-emerald-700 dark:text-emerald-300">
        {flagsCountryName(result.answerCountry)}
      </p>
      <p className="mt-3 text-sm"><span className="font-semibold">Applied rule:</span> {result.appliedRule}</p>
      {result.appliedRule !== "White Flag (Unicorn)" && <div className="mt-3">
        <p className="text-sm font-semibold">Sorted order</p>
        <ol className="mt-1 list-inside list-decimal text-sm text-muted-foreground">
          {result.sortedCountries.map((country) => <li key={country}>{flagsCountryName(country)}</li>)}
        </ol>
      </div>}
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Select country names rather than trying to describe flag colors or symbols.</SolverInstructions>
  </SolverLayout>;
}
