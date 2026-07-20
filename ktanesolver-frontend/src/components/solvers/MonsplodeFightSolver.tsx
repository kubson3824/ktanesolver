import { useCallback, useMemo, useState } from "react";
import {
  solveMonsplodeFight,
  type MonsplodeFightInput,
  type MonsplodeFightOutput,
} from "../../services/monsplodeFightService";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
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
import { cn } from "../../lib/cn";

const OPPONENTS = [
  "Buhar", "Lanaluff", "Bob", "Mountoise", "Nibs", "Aluga", "Lugirit", "Caadarim",
  "Vellarim", "Flaurim", "Gloorim", "Melbor", "Clondar", "Docsplode", "Magmy", "Pouse",
  "Ukkens", "Asteran", "Violan", "Zenlad", "Zapra", "Myrchat", "Percy", "Cutie Pie",
];

const MOVES = [
  "Appearify", "Battery Power", "Bedrock", "Boo", "Boom", "Bug Spray", "Countdown",
  "Dark Portal", "Fiery Soul", "Finale", "Freak Out", "Glyph", "Last Word", "Sendify",
  "Shock", "Shrink", "Sidestep", "Stretch", "Void", "Defuse", "Candle", "Cave In",
  "Double Zap", "Earthquake", "Flame Spear", "Fountain", "Grass Blade", "Heavy Rain",
  "High Voltage", "Hollow Gaze", "Ivy Spikes", "Spectre", "Splash", "Tac", "Tangle",
  "Tic", "Toe", "Torchlight", "Toxic Waste", "Venom Fang", "Zap",
];

const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

// ponytail: hotlinks the official manual repo; vendor the PNGs locally if offline use matters
const opponentIconUrl = (name: string) =>
  `https://ktane.timwi.de/HTML/img/Monsplode/${name.toLowerCase().replace(/\s/g, "")}.png`;

interface Props { bomb: BombEntity | null | undefined }

export default function MonsplodeFightSolver({ bomb }: Props) {
  const [opponent, setOpponent] = useState("");
  const [moves, setMoves] = useState(["", "", "", ""]);
  const [minutesRemaining, setMinutesRemaining] = useState("");
  const [result, setResult] = useState<MonsplodeFightOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const moduleState = useMemo(
    () => ({ opponent, moves, minutesRemaining, result, twitchCommand }),
    [opponent, moves, minutesRemaining, result, twitchCommand],
  );

  const applyResult = useCallback((output: MonsplodeFightOutput) => {
    setResult(output);
    setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.MONSPLODE_FIGHT, result: output }));
  }, []);

  const onRestoreState = useCallback((state: Partial<typeof moduleState> & { input?: Partial<MonsplodeFightInput> }) => {
    const input = state.input ?? state;
    if (input.opponent !== undefined) setOpponent(input.opponent);
    if (input.moves?.length === 4) setMoves(input.moves);
    if (input.minutesRemaining !== undefined && input.minutesRemaining !== null) setMinutesRemaining(String(input.minutesRemaining));
    if (state.result) applyResult(state.result);
    if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
  }, [applyResult]);

  useSolverModulePersistence<typeof moduleState, MonsplodeFightOutput>({
    state: moduleState,
    onRestoreState,
    onRestoreSolution: applyResult,
    extractSolution: (raw) => {
      if (!raw || typeof raw !== "object") return null;
      const value = raw as MonsplodeFightOutput & { output?: MonsplodeFightOutput };
      return value.output ?? (typeof value.move === "string" ? value : null);
    },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = async () => {
    if (!opponent || moves.some((move) => !move) || new Set(moves).size !== 4) return setError("Select an opponent and four different moves.");
    if (moves.includes("Countdown") && (!minutesRemaining || Number(minutesRemaining) < 0)) return setError("Enter the whole minutes remaining.");
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information.");
    setIsLoading(true);
    clearError();
    try {
      const response = await solveMonsplodeFight(round.id, bomb.id, currentModule.id, {
        opponent,
        moves,
        minutesRemaining: moves.includes("Countdown") ? Number(minutesRemaining) : null,
      });
      applyResult(response.output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Monsplode, Fight!");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setOpponent("");
    setMoves(["", "", "", ""]);
    setMinutesRemaining("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  return (
    <SolverLayout>
      <SolverSection title="Opponent" description="Select the Monsplode shown above the moves.">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {OPPONENTS.map((name) => <button
            key={name}
            type="button"
            onClick={() => setOpponent(name)}
            disabled={isLoading || isSolved}
            aria-pressed={opponent === name}
            className={cn(
              "flex flex-col items-center rounded-md border border-input bg-background p-1 text-[10px] hover:bg-muted",
              opponent === name && "border-ring ring-2 ring-ring",
            )}
          >
            <img src={opponentIconUrl(name)} alt="" className="h-14 w-14 object-contain" />
            <span>{name}</span>
          </button>)}
        </div>
      </SolverSection>

      <SolverSection title="Moves" description="Enter the four buttons in reading order: top-left, top-right, bottom-left, bottom-right.">
        <div className="grid grid-cols-2 gap-3">
          {moves.map((move, index) => (
            <select
              key={index}
              className={selectClass}
              value={move}
              onChange={(event) => setMoves(moves.map((value, i) => i === index ? event.target.value : value))}
              disabled={isLoading || isSolved}
              aria-label={`Move ${index + 1}`}
            >
              <option value="">Move {index + 1}</option>
              {MOVES.map((name) => <option key={name}>{name}</option>)}
            </select>
          ))}
        </div>
      </SolverSection>

      {moves.includes("Countdown") && (
        <SolverSection title="Timer" description="Enter the whole minutes currently remaining on the bomb.">
          <Input type="number" min="0" step="1" value={minutesRemaining} onChange={(event) => setMinutesRemaining(event.target.value)} disabled={isLoading || isSolved} aria-label="Minutes remaining" />
        </SolverSection>
      )}

      <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={!opponent || moves.some((move) => !move)} isLoading={isLoading} isSolved={isSolved} solveText="Choose move" />
      <ErrorAlert error={error} />

      {result && (
        <SolverSection title="Press this move" className="border-emerald-500/40">
          <div className="text-center text-3xl font-bold text-emerald-700 dark:text-emerald-400">{result.move}</div>
          <div className="mt-1 text-center text-sm text-muted-foreground">Net damage: {result.netDamage}</div>
        </SolverSection>
      )}
      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
      <SolverInstructions>The solver applies move damage, type effectiveness, edgework, and opponent special rules.</SolverInstructions>
    </SolverLayout>
  );
}
