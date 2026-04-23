import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solveEmojiMath, type EmojiMathOutput, type EmojiMathInput } from "../../services/emojiMathService";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
  SolverResult,
} from "../common";

function isValidEmojiMathOutput(obj: unknown): obj is EmojiMathOutput {
  return (
    obj != null &&
    typeof obj === "object" &&
    "result" in obj &&
    typeof (obj as EmojiMathOutput).result === "number" &&
    "translatedEquation" in obj &&
    typeof (obj as EmojiMathOutput).translatedEquation === "string"
  );
}

interface EmojiMathSolverProps {
  bomb: BombEntity | null | undefined;
}

const EMOJIS = [":)", "=(", "(:", ")=", ":(", "):", "=)", "(=", ":|", "|:"] as const;
const OPERATORS = ["+", "-", "*", "/"] as const;

export default function EmojiMathSolver({ bomb }: EmojiMathSolverProps) {
  const [emojiEquation, setEmojiEquation] = useState<string>("");
  const [result, setResult] = useState<EmojiMathOutput | null>(null);
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
    () => ({ emojiEquation, result, twitchCommand }),
    [emojiEquation, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      emojiEquation?: string;
      input?: { emojiEquation?: string };
      result?: EmojiMathOutput | null;
      twitchCommand?: string;
    }) => {
      const equation = state.input?.emojiEquation ?? state.emojiEquation;
      if (equation !== undefined) setEmojiEquation(equation);
      if (state.result !== undefined && isValidEmojiMathOutput(state.result)) {
        setResult(state.result);
        if (state.twitchCommand) setTwitchCommand(state.twitchCommand);
      } else {
        if (state.result !== undefined) setResult(null);
        setTwitchCommand("");
      }
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (solution: EmojiMathOutput) => {
      if (!isValidEmojiMathOutput(solution)) return;
      setResult(solution);
      const command = generateTwitchCommand({
        moduleType: ModuleType.EMOJI_MATH,
        result: { answer: String(solution.result) },
      });
      setTwitchCommand(command);
    },
  []);

  useSolverModulePersistence<
    { emojiEquation: string; result: EmojiMathOutput | null; twitchCommand: string },
    EmojiMathOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw !== "object") return null;
      const anyRaw = raw as { output?: unknown; result?: unknown; solution?: unknown };
      let candidate: unknown = null;
      if (anyRaw.output && typeof anyRaw.output === "object") candidate = anyRaw.output;
      else if (anyRaw.result && typeof anyRaw.result === "object") candidate = anyRaw.result;
      else if (anyRaw.solution && typeof anyRaw.solution === "object") candidate = anyRaw.solution;
      else candidate = raw;
      return isValidEmojiMathOutput(candidate) ? candidate : null;
    },
    inferSolved: (_solution, currentModule) => Boolean((currentModule as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleEmojiEquationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmojiEquation(e.target.value);
    clearError();
  };

  const solveEmojiMathModule = async () => {
    if (!emojiEquation.trim()) {
      setError("Please enter an emoji equation");
      return;
    }

    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const input: EmojiMathInput = {
        emojiEquation: emojiEquation.trim()
      };

      const response = await solveEmojiMath(round.id, bomb.id, currentModule.id, { input });

      if (response.output && isValidEmojiMathOutput(response.output)) {
        setResult(response.output);
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
        const command = generateTwitchCommand({
          moduleType: ModuleType.EMOJI_MATH,
          result: { answer: String(response.output.result) },
        });
        setTwitchCommand(command);
      } else {
        setResult(null);
        setTwitchCommand("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve emoji math");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setEmojiEquation("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading && !isSolved) {
      void solveEmojiMathModule();
    }
  };

  const insertSymbol = (symbol: string) => {
    if (!isLoading && !isSolved) {
      setEmojiEquation((prev) => prev + symbol);
      clearError();
    }
  };

  return (
    <SolverLayout>
      <SolverSection
        title="Equation"
        description="Enter the emoji expression shown on the module."
      >
        <Input
          type="text"
          value={emojiEquation}
          onChange={handleEmojiEquationChange}
          onKeyPress={handleKeyPress}
          placeholder="e.g. )::(+)=:("
          className="text-center font-mono text-xl"
          disabled={isLoading || isSolved}
          aria-label="Emoji equation"
        />

        <div className="mt-4 space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Emojis
            </p>
            <div className="grid grid-cols-5 gap-1.5">
              {EMOJIS.map((e) => (
                <Button
                  key={e}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="font-mono text-base"
                  onClick={() => insertSymbol(e)}
                  disabled={isLoading || isSolved}
                >
                  {e}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Operators
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {OPERATORS.map((op) => (
                <Button
                  key={op}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="font-mono text-base font-bold"
                  onClick={() => insertSymbol(op)}
                  disabled={isLoading || isSolved}
                >
                  {op}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </SolverSection>

      <SolverControls
        onSolve={solveEmojiMathModule}
        onReset={reset}
        isSolveDisabled={!emojiEquation.trim()}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Press OK"
      />

      <ErrorAlert error={error} />

      {result && isValidEmojiMathOutput(result) && (
        <SolverResult
          variant="success"
          title="Answer"
          description={`Translated: ${result.translatedEquation}\nResult: ${result.result}`}
        />
      )}

      {twitchCommand && result && isValidEmojiMathOutput(result) && (
        <TwitchCommandDisplay command={twitchCommand} />
      )}

      <SolverInstructions>
        Emoji mapping:
        <span className="font-mono"> :)</span>=0,
        <span className="font-mono"> =(</span>=1,
        <span className="font-mono"> (:</span>=2,
        <span className="font-mono"> )=</span>=3,
        <span className="font-mono"> :(</span>=4,
        <span className="font-mono"> ):</span>=5,
        <span className="font-mono"> =)</span>=6,
        <span className="font-mono"> (=</span>=7,
        <span className="font-mono"> :|</span>=8,
        <span className="font-mono"> |:</span>=9.
      </SolverInstructions>
    </SolverLayout>
  );
}
