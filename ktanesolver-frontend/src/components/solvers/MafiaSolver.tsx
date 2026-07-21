import { useCallback, useMemo, useState } from "react";
import { MAFIA_SUSPECTS, solveMafia, type MafiaInput, type MafiaOutput, type MafiaSuspect } from "../../services/mafiaService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";
import { Input } from "../ui";

const POSITIONS = ["Top left", "Top right", "Right top", "Right bottom", "Bottom right", "Bottom left", "Left bottom", "Left top"];
const name = (suspect: MafiaSuspect) => suspect[0] + suspect.slice(1).toLowerCase();

export default function MafiaSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [suspects, setSuspects] = useState<Array<MafiaSuspect | "">>(Array(8).fill(""));
  const [startingTimeMinutes, setStartingTimeMinutes] = useState(5);
  const [additionalModuleNames, setAdditionalModuleNames] = useState("");
  const [additionalPortCount, setAdditionalPortCount] = useState(0);
  const [hasTwoFactor, setHasTwoFactor] = useState(false);
  const [hasColoredIndicator, setHasColoredIndicator] = useState(false);
  const [hasHdmiPort, setHasHdmiPort] = useState(false);
  const [hasVgaPort, setHasVgaPort] = useState(false);
  const [hasAdditionalNeedyModule, setHasAdditionalNeedyModule] = useState(false);
  const [result, setResult] = useState<MafiaOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const savedState = useMemo(() => ({ suspects, startingTimeMinutes, additionalModuleNames, additionalPortCount, hasTwoFactor, hasColoredIndicator, hasHdmiPort, hasVgaPort, hasAdditionalNeedyModule, result, twitchCommand }), [suspects, startingTimeMinutes, additionalModuleNames, additionalPortCount, hasTwoFactor, hasColoredIndicator, hasHdmiPort, hasVgaPort, hasAdditionalNeedyModule, result, twitchCommand]);

  useSolverModulePersistence<typeof savedState, MafiaOutput>({
    state: savedState,
    onRestoreState: useCallback((saved: Partial<typeof savedState> & { input?: Partial<MafiaInput> }) => {
      const input = saved.input ?? saved;
      if (input.suspects?.length === 8) setSuspects(input.suspects);
      if (Number.isFinite(input.startingTimeMinutes)) setStartingTimeMinutes(input.startingTimeMinutes!);
      if (Array.isArray(input.additionalModuleNames)) setAdditionalModuleNames(input.additionalModuleNames.join(", "));
      else if (typeof saved.additionalModuleNames === "string") setAdditionalModuleNames(saved.additionalModuleNames);
      if (Number.isFinite(input.additionalPortCount)) setAdditionalPortCount(input.additionalPortCount!);
      if (typeof input.hasTwoFactor === "boolean") setHasTwoFactor(input.hasTwoFactor);
      if (typeof input.hasColoredIndicator === "boolean") setHasColoredIndicator(input.hasColoredIndicator);
      if (typeof input.hasHdmiPort === "boolean") setHasHdmiPort(input.hasHdmiPort);
      if (typeof input.hasVgaPort === "boolean") setHasVgaPort(input.hasVgaPort);
      if (typeof input.hasAdditionalNeedyModule === "boolean") setHasAdditionalNeedyModule(input.hasAdditionalNeedyModule);
      if (saved.result) setResult(saved.result);
      if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: MafiaOutput) => {
      if (!solution?.godfather) return;
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.MAFIA, result: solution }));
    }, []),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (suspects.some((suspect) => !suspect) || new Set(suspects).size !== 8) return setError("Select eight different suspects");
    if (!Number.isFinite(startingTimeMinutes) || startingTimeMinutes < 0) return setError("Enter a valid starting time in minutes");
    if (!Number.isInteger(additionalPortCount) || additionalPortCount < 0) return setError("Enter a valid additional port count");
    clearError(); setIsLoading(true);
    try {
      const input: MafiaInput = {
        suspects: suspects as MafiaSuspect[], startingTimeMinutes,
        additionalModuleNames: additionalModuleNames.split(",").map((value) => value.trim()).filter(Boolean),
        additionalPortCount, hasTwoFactor, hasColoredIndicator, hasHdmiPort, hasVgaPort, hasAdditionalNeedyModule,
      };
      const response = await solveMafia(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.MAFIA, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command }, response.output, true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Mafia"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, suspects, startingTimeMinutes, additionalModuleNames, additionalPortCount, hasTwoFactor, hasColoredIndicator, hasHdmiPort, hasVgaPort, hasAdditionalNeedyModule, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setSuspects(Array(8).fill("")); setStartingTimeMinutes(5); setAdditionalModuleNames(""); setAdditionalPortCount(0);
    setHasTwoFactor(false); setHasColoredIndicator(false); setHasHdmiPort(false); setHasVgaPort(false); setHasAdditionalNeedyModule(false);
    setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="People around the gallows" description="Start at the top-left and continue clockwise.">
      <div className="grid gap-3 sm:grid-cols-2">
        {POSITIONS.map((position, index) => <label key={position} className="text-sm font-medium">{position}
          <select aria-label={position} value={suspects[index]} onChange={(event) => { const next = [...suspects]; next[index] = event.target.value as MafiaSuspect; setSuspects(next); clearError(); }} disabled={isLoading || isSolved} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Select a person…</option>
            {MAFIA_SUSPECTS.map((suspect) => <option key={suspect} value={suspect} disabled={suspects.includes(suspect) && suspects[index] !== suspect}>{name(suspect)}</option>)}
          </select>
        </label>)}
      </div>
    </SolverSection>

    <SolverSection title="Extra edgework" description="Configured bomb details are read automatically. Add only details this app cannot represent.">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Starting time in minutes
          <Input aria-label="Starting time in minutes" type="number" min={0} step="any" value={startingTimeMinutes} onChange={(event) => setStartingTimeMinutes(event.target.valueAsNumber)} disabled={isLoading || isSolved} className="mt-1" />
        </label>
        <label className="text-sm font-medium">Other unconfigured ports
          <Input aria-label="Other unconfigured ports" type="number" min={0} step={1} value={additionalPortCount} onChange={(event) => setAdditionalPortCount(event.target.valueAsNumber)} disabled={isLoading || isSolved} className="mt-1" />
        </label>
      </div>
      <label className="mt-3 block text-sm font-medium">Other module names, comma-separated
        <Input aria-label="Other module names" value={additionalModuleNames} onChange={(event) => setAdditionalModuleNames(event.target.value)} disabled={isLoading || isSolved} placeholder="Marble Tumble, The Swan" className="mt-1" />
      </label>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {[
          ["Two Factor present", hasTwoFactor, setHasTwoFactor],
          ["Colored indicator present", hasColoredIndicator, setHasColoredIndicator],
          ["HDMI port present", hasHdmiPort, setHasHdmiPort],
          ["VGA port present", hasVgaPort, setHasVgaPort],
          ["An additional listed module is needy", hasAdditionalNeedyModule, setHasAdditionalNeedyModule],
        ].map(([label, checked, setter]) => <label key={label as string} className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={checked as boolean} onChange={(event) => (setter as (value: boolean) => void)(event.target.checked)} disabled={isLoading || isSolved} />
          {label as string}
        </label>)}
      </div>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={suspects.some((suspect) => !suspect)} solveText="Identify the Godfather" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Execute this person" className="border-emerald-500/40">
      <p className="rounded-md border-2 border-emerald-500 bg-emerald-500/15 p-5 text-center text-2xl font-bold text-emerald-700 dark:text-emerald-300">{name(result.godfather)}</p>
      <p className="mt-3 text-sm text-muted-foreground">Last remaining: {name(result.lastRemaining)} · Ruled out: {result.eliminationOrder.map(name).join(" → ")}</p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>HDMI and VGA are counted automatically when selected. “Other unconfigured ports” excludes those two.</SolverInstructions>
  </SolverLayout>;
}
