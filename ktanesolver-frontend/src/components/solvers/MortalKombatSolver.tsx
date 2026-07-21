import { useCallback, useMemo, useState } from "react";

import { solveMortalKombat, type MortalKombatInput, type MortalKombatOutput } from "../../services/mortalKombatService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const CHARACTERS = ["Johnny Cage", "Kano", "Liu Kang", "Raiden", "Scorpion", "Sonya Blade", "Sub-Zero"];
const SELECT_CLASS = "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

export default function MortalKombatSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [player, setPlayer] = useState("");
  const [opponent, setOpponent] = useState("");
  const [result, setResult] = useState<MortalKombatOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(
    () => ({ player, opponent, result, twitchCommand }),
    [player, opponent, result, twitchCommand],
  );

  useSolverModulePersistence<typeof moduleState & { input?: MortalKombatInput }, MortalKombatOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (state.player !== undefined) setPlayer(state.player);
      else if (state.input?.player !== undefined) setPlayer(state.input.player);
      if (state.opponent !== undefined) setOpponent(state.opponent);
      else if (state.input?.opponent !== undefined) setOpponent(state.input.opponent);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: (solution) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.MORTAL_KOMBAT, result: solution }));
    },
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!player || !opponent || player === opponent) return setError("Select two different fighters.");
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError();
    setIsLoading(true);
    try {
      const input = { player, opponent };
      const response = await solveMortalKombat(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.MORTAL_KOMBAT, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id, { ...input, result: response.output, twitchCommand: command },
        response.output, response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Mortal Kombat");
    } finally {
      setIsLoading(false);
    }
  }, [player, opponent, round?.id, bomb?.id, currentModule?.id, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setPlayer("");
    setOpponent("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Fighters" description="Select the character on the large screen and the opponent on the small screen.">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">Your character
          <select aria-label="Your character" value={player} disabled={isLoading || isSolved} className={SELECT_CLASS}
            onChange={(event) => { setPlayer(event.target.value); if (event.target.value === opponent) setOpponent(""); }}>
            <option value="">Select character</option>
            {CHARACTERS.map((character) => <option key={character}>{character}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">Opponent
          <select aria-label="Opponent" value={opponent} disabled={isLoading || isSolved} className={SELECT_CLASS} onChange={(event) => setOpponent(event.target.value)}>
            <option value="">Select opponent</option>
            {CHARACTERS.filter((character) => character !== player).map((character) => <option key={character}>{character}</option>)}
          </select>
        </label>
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={!player || !opponent || player === opponent} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Move sequence" description="Perform all three attacks in order, then the fatality." className="border-emerald-500/40">
      <ol className="grid gap-3 sm:grid-cols-2">
        {[...result.attacks, result.fatality].map((move, index) => <li key={`${move.name}-${index}`} className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{index < 3 ? `Attack ${index + 1}` : "Fatality"}</p>
          <p className="mt-1 font-semibold">{move.name}</p>
          <p className="mt-2 font-mono text-2xl" aria-label={`${move.name} controls`}>{move.controls}</p>
        </li>)}
      </ol>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>If an attack causes a strike, the opponent may change and the attack counter resets; reset this solver and select the new opponent. A fatality-stage strike does not reset progress.</SolverInstructions>
  </SolverLayout>;
}
