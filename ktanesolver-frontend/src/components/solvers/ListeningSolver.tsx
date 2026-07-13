import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { solveListening, type ListeningInput, type ListeningOutput } from "../../services/listeningService";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  SolverResult,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";

interface ListeningSolverProps {
  bomb: BombEntity | null | undefined;
}

export const SOUND_OPTIONS = [
  "Taxi Dispatch", "Dial-up Internet", "Cow", "Police Radio Scanner", "Extractor Fan",
  "Censorship Bleep", "Train Station", "Medieval Weapons", "Arcade", "Door Closing",
  "Casino", "Chainsaw", "Supermarket", "Compressed Air", "Soccer Match",
  "Servo Motor", "Tawny Owl", "Waterfall", "Sewing Machine", "Tearing Fabric",
  "Thrush Nightingale", "Zipper", "Car Engine", "Vacuum Cleaner", "Reloading Glock 19",
  "Ballpoint Pen Writing", "Oboe", "Rattling Iron Chain", "Saxophone", "Book Page Turning",
  "Tuba", "Table Tennis", "Marimba", "Squeaky Toy", "Phone Ringing",
  "Helicopter", "Tibetan Nuns", "Firework Exploding", "Throat Singing", "Glass Shattering",
  "Beach",
];

const SELECT_CLASS =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

export default function ListeningSolver({ bomb }: ListeningSolverProps) {
  const [selectedSound, setSelectedSound] = useState<string>("");
  const [result, setResult] = useState<ListeningOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

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

  const moduleState = useMemo(
    () => ({ selectedSound, result, twitchCommand }),
    [selectedSound, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: { selectedSound?: string; result?: ListeningOutput | null; twitchCommand?: string }) => {
      if (state.selectedSound !== undefined) setSelectedSound(state.selectedSound);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback((solution: ListeningOutput) => {
    if (!solution?.code) return;
    setResult(solution);
    const command = generateTwitchCommand({
      moduleType: ModuleType.LISTENING,
      result: { code: solution.code },
    });
    setTwitchCommand(command);
  }, []);

  useSolverModulePersistence<
    { selectedSound: string; result: ListeningOutput | null; twitchCommand: string },
    ListeningOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; code?: unknown };
        if (anyRaw.output && typeof anyRaw.output === "object") return anyRaw.output as ListeningOutput;
        if (typeof anyRaw.code === "string") return raw as ListeningOutput;
        return raw as ListeningOutput;
      }
      return null;
    },
    inferSolved: (_sol, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solveListeningModule = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    if (!selectedSound) {
      setError("Please select a sound");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const input: ListeningInput = { soundDescription: selectedSound };
      const response = await solveListening(round.id, bomb.id, currentModule.id, { input });

      setResult(response.output);

      if (response.output.code) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);

        const command = generateTwitchCommand({
          moduleType: ModuleType.LISTENING,
          result: response.output,
        });
        setTwitchCommand(command);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Listening");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setSelectedSound("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  return (
    <SolverLayout>
      <SolverSection
        title="Sound on the module"
        description="Press play on the module, identify the sound, and pick it from the list."
      >
        <select
          value={selectedSound}
          onChange={(e) => setSelectedSound(e.target.value)}
          className={SELECT_CLASS}
          disabled={isLoading || isSolved}
          aria-label="Sound"
        >
          <option value="">Select a sound…</option>
          {SOUND_OPTIONS.map((sound) => (
            <option key={sound} value={sound}>{sound}</option>
          ))}
        </select>
      </SolverSection>

      <SolverControls
        onSolve={solveListeningModule}
        onReset={reset}
        isSolveDisabled={!selectedSound}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Get code"
      />

      <ErrorAlert error={error} />

      {result && !result.code && (
        <SolverResult
          variant="info"
          title="Sound not found"
          description="Try a different selection — the solver did not recognise this sound."
        />
      )}

      {result?.code && (
        <SolverSection
          title="Enter this code"
          description="Use the $ * & # buttons on the module to input the symbols."
        >
          <div className="flex flex-wrap justify-center gap-2">
            {result.code.split("").map((symbol, index) => (
              <div
                key={index}
                className="flex h-12 w-12 items-center justify-center rounded-md border-2 border-emerald-500 bg-emerald-500/10 font-mono text-2xl text-emerald-700 dark:text-emerald-300"
              >
                {symbol}
              </div>
            ))}
          </div>
        </SolverSection>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        Press play on the module to hear the sound, identify it from the list, then enter the
        returned code on the module using the $ * &amp; # buttons. Pressing play again clears any
        previously entered code.
      </SolverInstructions>
    </SolverLayout>
  );
}
