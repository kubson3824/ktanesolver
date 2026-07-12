import { useCallback, useMemo, useState } from "react";
import { solveSeaShells, type SeaShellsOutput } from "../../services/seaShellsService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, StageIndicator, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const PHRASES = ["SEA SHELLS", "SHE SHELLS", "SEA SELLS", "SHE SELLS"];
const KEYS = ["ON THE SEA SHORE", "ON THE SHE SORE", "ON THE SHE SURE", "ON THE SEESAW"];

function PhraseSelect({ label, value, options, onChange, disabled }: { label: string; value: string; options: string[]; onChange: (value: string) => void; disabled: boolean }) {
  return <label className="space-y-1.5 text-sm font-medium">{label}
    <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="block h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
      {options.map((option) => <option key={option}>{option}</option>)}
    </select>
  </label>;
}

export default function SeaShellsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [row, setRow] = useState(PHRASES[0]);
  const [column, setColumn] = useState(PHRASES[0]);
  const [key, setKey] = useState(KEYS[0]);
  const [result, setResult] = useState<SeaShellsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ row, column, key, result, twitchCommand }), [row, column, key, result, twitchCommand]);

  useSolverModulePersistence<typeof state, SeaShellsOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      if (saved.row && PHRASES.includes(saved.row)) setRow(saved.row);
      if (saved.column && PHRASES.includes(saved.column)) setColumn(saved.column);
      if (saved.key && KEYS.includes(saved.key)) setKey(saved.key);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: SeaShellsOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.SEA_SHELLS, result: solution }));
    }, []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveSeaShells(round.id, bomb.id, currentModule.id, { row, column, key });
      const command = generateTwitchCommand({ moduleType: ModuleType.SEA_SHELLS, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { row, column, key, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Sea Shells");
    } finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, row, column, key, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => { setRow(PHRASES[0]); setColumn(PHRASES[0]); setKey(KEYS[0]); setResult(null); setTwitchCommand(""); resetSolverState(); }, [resetSolverState]);
  const disabled = isLoading || isSolved;

  return <SolverLayout>
    <SolverSection title="Stage progress" description={isSolved ? "All 3 stages complete." : `Enter the phrase for stage ${(result?.stage ?? 0) + 1}.`}>
      <StageIndicator total={3} current={isSolved ? 4 : (result?.stage ?? 0) + 1} completedThrough={result?.stage ?? 0} />
    </SolverSection>
    {!isSolved && <SolverSection title="Displayed phrase" description="Select the first two words, next two words, and remaining words in order.">
      <div className="grid gap-3 md:grid-cols-3">
        <PhraseSelect label="First two words" value={row} options={PHRASES} onChange={setRow} disabled={disabled} />
        <PhraseSelect label="Third and fourth words" value={column} options={PHRASES} onChange={setColumn} disabled={disabled} />
        <PhraseSelect label="Remaining words" value={key} options={KEYS} onChange={setKey} disabled={disabled} />
      </div>
    </SolverSection>}
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText={`Solve stage ${(result?.stage ?? 0) + 1}`} />
    <ErrorAlert error={error} />
    {result && <SolverSection title={`Stage ${result.stage} button order`} className="border-emerald-500/40">
      <ol className="flex flex-wrap justify-center gap-2">{result.pressOrder.map((word, index) => <li key={index} className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 font-semibold"><span className="mr-1 text-xs text-muted-foreground">{index + 1}.</span>{word}</li>)}</ol>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Press the shown words in order. After a correct sequence, enter the new display; three correct stages disarm the module.</SolverInstructions>
  </SolverLayout>;
}
