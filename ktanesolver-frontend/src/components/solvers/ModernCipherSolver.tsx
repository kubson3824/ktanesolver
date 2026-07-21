import { useCallback, useEffect, useMemo, useState } from "react";

import { solveModernCipher, type ModernCipherOutput } from "../../services/modernCipherService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
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
import { Input } from "../ui/input";

interface PersistedState {
  nextStage?: number;
  ciphertext?: string;
  strikesAtGeneration?: number;
  solvedModulesAtGeneration?: number;
  result?: ModernCipherOutput | null;
  twitchCommand?: string;
}

export default function ModernCipherSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const liveSolved = bomb?.modules.filter((module) => module.solved).length ?? 0;
  const [stage, setStage] = useState(1);
  const [ciphertext, setCiphertext] = useState("");
  const [strikes, setStrikes] = useState(bomb?.strikes ?? 0);
  const [solvedModules, setSolvedModules] = useState(liveSolved);
  const [result, setResult] = useState<ModernCipherOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const resetModule = useRoundStore((state) => state.resetModule);
  const validCiphertext = /^[A-Z]{4,8}$/.test(ciphertext);
  const moduleState = useMemo(() => ({
    nextStage: stage, ciphertext, strikesAtGeneration: strikes,
    solvedModulesAtGeneration: solvedModules, result, twitchCommand,
  }), [stage, ciphertext, strikes, solvedModules, result, twitchCommand]);

  useEffect(() => {
    if (!ciphertext) {
      setStrikes(bomb?.strikes ?? 0);
      setSolvedModules(liveSolved);
    }
  }, [bomb?.strikes, liveSolved, ciphertext]);

  useSolverModulePersistence<PersistedState, ModernCipherOutput>({
    state: moduleState,
    onRestoreState: useCallback((state: PersistedState) => {
      if (state.nextStage !== undefined) setStage(Math.min(state.nextStage, 3));
      if (state.ciphertext !== undefined) setCiphertext(state.ciphertext);
      if (state.strikesAtGeneration !== undefined) setStrikes(state.strikesAtGeneration);
      if (state.solvedModulesAtGeneration !== undefined) setSolvedModules(state.solvedModulesAtGeneration);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: ModernCipherOutput) => {
      setResult(solution);
      setStage(Math.min(solution.stage + 1, 3));
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.MODERN_CIPHER, result: solution }));
    }, []),
    extractSolution: (raw) => raw && typeof raw === "object" && "solution" in raw
      ? raw as ModernCipherOutput : null,
    inferSolved: (solution, module) => solution?.stage === 3 || Boolean((module as { solved?: boolean })?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!validCiphertext) return setError("Enter the 4 to 8 displayed letters");
    if (strikes < 0 || solvedModules < 0 || solvedModules > bomb.modules.length) {
      return setError("Generation-time counts must match the bomb");
    }
    clearError();
    setIsLoading(true);
    try {
      const response = await solveModernCipher(round.id, bomb.id, currentModule.id, {
        ciphertext,
        strikesAtGeneration: strikes,
        solvedModulesAtGeneration: solvedModules,
      });
      const output = response.output;
      const command = generateTwitchCommand({ moduleType: ModuleType.MODERN_CIPHER, result: output });
      const nextStage = Math.min(output.stage + 1, 3);
      setResult(output);
      setTwitchCommand(command);
      setStage(nextStage);
      setCiphertext("");
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, {
        nextStage, ciphertext: "", strikesAtGeneration: strikes,
        solvedModulesAtGeneration: solvedModules, result: output, twitchCommand: command,
      }, output, response.solved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Modern Cipher");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb, currentModule?.id, validCiphertext, ciphertext, strikes, solvedModules, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(async () => {
    setStage(1);
    setCiphertext("");
    setStrikes(bomb?.strikes ?? 0);
    setSolvedModules(liveSolved);
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
    if (bomb?.id && currentModule?.id) {
      try {
        await resetModule(bomb.id, currentModule.id);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Failed to reset Modern Cipher");
      }
    }
  }, [bomb?.id, bomb?.strikes, currentModule?.id, liveSolved, resetModule, resetSolverState, setError]);

  return <SolverLayout>
    <SolverSection
      title={`Stage ${stage} of 3`}
      description="Enter the encrypted word currently shown on the upper display."
    >
      <Input
        value={ciphertext}
        onChange={(event) => {
          setCiphertext(event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 8));
          if (result && result.stage < stage) {
            setResult(null);
            setTwitchCommand("");
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && validCiphertext && !isLoading && !isSolved) void solve();
        }}
        placeholder="CIPHERTEXT"
        aria-label={`Encrypted word for stage ${stage}`}
        autoCapitalize="characters"
        autoComplete="off"
        disabled={isLoading || isSolved}
        className="text-center font-mono text-xl uppercase tracking-widest"
      />
      <p className="mt-2 text-center text-xs text-muted-foreground">QWERTYUIOPASDFGHJKLZXCVBNM</p>
    </SolverSection>

    <SolverSection title="Generation-time snapshot" description="Use the counts from when this word appeared; edit them if the bomb changed afterward.">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm font-medium">Strikes
          <Input type="number" min={0} value={strikes} onChange={(event) => setStrikes(event.target.valueAsNumber || 0)} disabled={isLoading || isSolved} className="mt-2" />
        </label>
        <label className="text-sm font-medium">Solved modules
          <Input type="number" min={0} max={bomb?.modules.length ?? 0} value={solvedModules} onChange={(event) => setSolvedModules(event.target.valueAsNumber || 0)} disabled={isLoading || isSolved} className="mt-2" />
        </label>
      </div>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={!validCiphertext} isLoading={isLoading} isSolved={isSolved} solveText="Decode stage" />
    <ErrorAlert error={error} />
    {result && <SolverResult
      title={`Submit ${result.solution}`}
      description={`Stage: ${result.stage} of 3\nKey: ${result.key} ${result.direction}`}
    />}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>
      Submit each decoded word before entering the next display. A strike regenerates every word; press Reset here after recording the strike.
    </SolverInstructions>
  </SolverLayout>;
}
