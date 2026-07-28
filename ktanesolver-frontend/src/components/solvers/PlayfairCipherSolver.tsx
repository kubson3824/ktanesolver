import { useCallback, useMemo, useState } from "react";

import {
  solvePlayfairCipher,
  type PlayfairCipherInput,
  type PlayfairCipherOutput,
} from "../../services/playfairCipherService";
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

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const COLORS: PlayfairCipherInput["screenColor"][] = ["MAGENTA", "BLUE", "ORANGE", "YELLOW"];
const today = () => DAYS[(new Date().getDay() + 6) % 7];

interface PersistedState {
  encryptedMessage?: string;
  screenColor?: PlayfairCipherInput["screenColor"];
  dayOfWeek?: string;
  result?: PlayfairCipherOutput | null;
  twitchCommand?: string;
}

export default function PlayfairCipherSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [encryptedMessage, setEncryptedMessage] = useState("");
  const [screenColor, setScreenColor] = useState<PlayfairCipherInput["screenColor"]>("MAGENTA");
  const [dayOfWeek, setDayOfWeek] = useState(today);
  const [result, setResult] = useState<PlayfairCipherOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const validMessage = /^[A-Z]{6}$/.test(encryptedMessage) && !encryptedMessage.includes("J");
  const moduleState = useMemo(() => ({
    encryptedMessage, screenColor, dayOfWeek, result, twitchCommand,
  }), [encryptedMessage, screenColor, dayOfWeek, result, twitchCommand]);

  useSolverModulePersistence<PersistedState, PlayfairCipherOutput>({
    state: moduleState,
    onRestoreState: useCallback((state: PersistedState) => {
      if (state.encryptedMessage !== undefined) setEncryptedMessage(state.encryptedMessage);
      if (state.screenColor !== undefined) setScreenColor(state.screenColor);
      if (state.dayOfWeek !== undefined) setDayOfWeek(state.dayOfWeek);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    }, []),
    onRestoreSolution: useCallback((solution: PlayfairCipherOutput) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.PLAYFAIR_CIPHER, result: solution }));
    }, []),
    extractSolution: (raw) => raw && typeof raw === "object" && "pressSequence" in raw
      ? raw as PlayfairCipherOutput : null,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!validMessage) return setError("Enter the six displayed letters, using I instead of J");
    clearError();
    setIsLoading(true);
    try {
      const response = await solvePlayfairCipher(round.id, bomb.id, currentModule.id, {
        encryptedMessage, screenColor, dayOfWeek,
      });
      const output = response.output;
      const command = generateTwitchCommand({ moduleType: ModuleType.PLAYFAIR_CIPHER, result: output });
      setResult(output);
      setTwitchCommand(command);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { encryptedMessage, screenColor, dayOfWeek, result: output, twitchCommand: command },
        output,
        response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Playfair Cipher");
    } finally {
      setIsLoading(false);
    }
  }, [round?.id, bomb, currentModule?.id, validMessage, encryptedMessage, screenColor, dayOfWeek, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setEncryptedMessage("");
    setScreenColor("MAGENTA");
    setDayOfWeek(today());
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Displayed message" description="Enter the six letters before the question mark.">
      <Input
        value={encryptedMessage}
        onChange={(event) => setEncryptedMessage(event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6))}
        onKeyDown={(event) => {
          if (event.key === "Enter" && validMessage && !isLoading && !isSolved) void solve();
        }}
        placeholder="ABCDEF"
        aria-label="Encrypted message"
        autoCapitalize="characters"
        autoComplete="off"
        disabled={isLoading || isSolved}
        className="text-center font-mono text-xl uppercase tracking-widest"
      />
    </SolverSection>

    <SolverSection title="Module details" description="Use the screen color and the day when this display was generated.">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Screen color
          <select
            value={screenColor}
            onChange={(event) => setScreenColor(event.target.value as PlayfairCipherInput["screenColor"])}
            disabled={isLoading || isSolved}
            className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {COLORS.map((color) => <option key={color} value={color}>{color[0] + color.slice(1).toLowerCase()}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Day of week
          <select
            value={dayOfWeek}
            onChange={(event) => setDayOfWeek(event.target.value)}
            disabled={isLoading || isSolved}
            className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {DAYS.map((day) => <option key={day} value={day}>{day[0] + day.slice(1).toLowerCase()}</option>)}
          </select>
        </label>
      </div>
    </SolverSection>

    <SolverControls onSolve={solve} onReset={reset} isSolveDisabled={!validMessage} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverResult
      title={`Press ${result.pressSequence.split("").join(" → ")}`}
      description={`Decrypted message: ${result.decryptedMessage}\nKey: ${result.key}`}
    />}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>The day defaults to today. Change it if the module was generated before midnight.</SolverInstructions>
  </SolverLayout>;
}
