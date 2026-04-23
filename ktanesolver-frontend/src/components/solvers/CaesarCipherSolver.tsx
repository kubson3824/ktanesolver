import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  solveCaesarCipher,
  type CaesarCipherSolveResponse,
} from "../../services/caesarCipherService";
import {
  useSolver,
  useSolverModulePersistence,
  SolverLayout,
  SolverSection,
  SolverInstructions,
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";
import { Input } from "../ui/input";
import { cn } from "../../lib/cn";

interface CaesarCipherSolverProps {
  bomb: BombEntity | null | undefined;
}

const CIPHER_LENGTH = 5;
const EMPTY_LETTERS = Array(CIPHER_LENGTH).fill("") as string[];

export default function CaesarCipherSolver({ bomb }: CaesarCipherSolverProps) {
  const [letters, setLetters] = useState<string[]>(EMPTY_LETTERS);
  const [result, setResult] = useState<CaesarCipherSolveResponse["output"] | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(CIPHER_LENGTH).fill(null));

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

  const updateModuleAfterSolve = useRoundStore((s) => s.updateModuleAfterSolve);

  const ciphertext = useMemo(() => letters.join(""), [letters]);
  const allFilled = letters.every((l) => l.length === 1);

  const moduleState = useMemo(
    () => ({ ciphertext, result, twitchCommand }),
    [ciphertext, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (
      state:
        | { ciphertext?: string; result?: CaesarCipherSolveResponse["output"] | null; twitchCommand?: string }
        | { input?: { ciphertext?: string } },
    ) => {
      const fillFromString = (text: string) => {
        const chars = text.toUpperCase().replace(/[^A-Z]/g, "").slice(0, CIPHER_LENGTH).split("");
        setLetters(Array.from({ length: CIPHER_LENGTH }, (_, i) => chars[i] ?? ""));
      };
      if ("input" in state && state.input?.ciphertext) {
        fillFromString(state.input.ciphertext);
      } else if ("ciphertext" in state && state.ciphertext !== undefined) {
        fillFromString(state.ciphertext);
      }
      if ("result" in state && state.result !== undefined) {
        setResult(state.result);
      }
      if ("twitchCommand" in state && state.twitchCommand !== undefined) {
        setTwitchCommand(state.twitchCommand);
      }
    },
    [],
  );

  const onRestoreSolution = useCallback((solution: CaesarCipherSolveResponse["output"]) => {
    if (!solution?.solution) return;
    setResult(solution);
    setTwitchCommand(
      generateTwitchCommand({ moduleType: ModuleType.CAESAR_CIPHER, result: solution }),
    );
  }, []);

  useSolverModulePersistence<
    { ciphertext: string; result: CaesarCipherSolveResponse["output"] | null; twitchCommand: string },
    CaesarCipherSolveResponse["output"]
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null || typeof raw !== "object") return null;
      const candidate = raw as { solution?: unknown; offset?: unknown; output?: unknown; result?: unknown };
      if (candidate.result && typeof candidate.result === "object") {
        return candidate.result as CaesarCipherSolveResponse["output"];
      }
      if (candidate.output && typeof candidate.output === "object") {
        return candidate.output as CaesarCipherSolveResponse["output"];
      }
      if (typeof candidate.solution === "string" && typeof candidate.offset === "number") {
        return raw as CaesarCipherSolveResponse["output"];
      }
      return null;
    },
    inferSolved: (_sol, mod) => Boolean((mod as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const handleLetterChange = (index: number, value: string) => {
    const upper = value.toUpperCase().replace(/[^A-Z]/g, "");
    if (error) clearError();

    if (upper.length > 1) {
      const chars = upper.slice(0, CIPHER_LENGTH - index).split("");
      setLetters((prev) => {
        const next = [...prev];
        chars.forEach((c, i) => {
          next[index + i] = c;
        });
        return next;
      });
      const nextFocus = Math.min(index + chars.length, CIPHER_LENGTH - 1);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    setLetters((prev) => {
      const next = [...prev];
      next[index] = upper.slice(-1);
      return next;
    });
    if (upper && index < CIPHER_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const solveModule = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing required information");
      return;
    }
    if (!allFilled) {
      setError("Please enter all 5 letters");
      return;
    }

    clearError();
    setIsLoading(true);

    try {
      const response = await solveCaesarCipher(round.id, bomb.id, currentModule.id, {
        input: { ciphertext },
      });

      const output = response.output;
      const command = generateTwitchCommand({
        moduleType: ModuleType.CAESAR_CIPHER,
        result: output,
      });

      setResult(output);
      setTwitchCommand(command);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { ciphertext, result: output, twitchCommand: command },
        output,
        true,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve Caesar Cipher");
    } finally {
      setIsLoading(false);
    }
  }, [
    round?.id,
    bomb?.id,
    currentModule?.id,
    ciphertext,
    allFilled,
    clearError,
    setIsLoading,
    setError,
    setIsSolved,
    markModuleSolved,
    updateModuleAfterSolve,
  ]);

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !letters[index] && index > 0) {
      e.preventDefault();
      setLetters((prev) => {
        const next = [...prev];
        next[index - 1] = "";
        return next;
      });
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < CIPHER_LENGTH - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === "Enter" && allFilled && !isLoading && !isSolved) {
      e.preventDefault();
      void solveModule();
    }
  };

  const handlePaste = (index: number, e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (!pasted) return;
    e.preventDefault();
    handleLetterChange(index, pasted);
  };

  const reset = useCallback(() => {
    setLetters(EMPTY_LETTERS);
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
    inputRefs.current[0]?.focus();
  }, [resetSolverState]);

  const offsetLabel = result
    ? result.offset > 0
      ? `+${result.offset}`
      : String(result.offset)
    : "";

  return (
    <SolverLayout>
      <SolverSection
        title="Ciphertext"
        description="Enter the five letters displayed on the module."
      >
        <div className="flex justify-center gap-2">
          {letters.map((letter, i) => (
            <Input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              value={letter}
              onChange={(e) => handleLetterChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={(e) => handlePaste(i, e)}
              onFocus={(e) => e.currentTarget.select()}
              className={cn(
                "h-14 w-12 px-0 text-center text-2xl font-bold font-mono rounded-md border-2 transition-colors",
                letter
                  ? "border-amber-500 bg-amber-500/10 text-foreground"
                  : "border-border bg-muted/40 text-muted-foreground",
              )}
              maxLength={1}
              autoComplete="off"
              autoCapitalize="characters"
              inputMode="text"
              aria-label={`Ciphertext letter ${i + 1}`}
              disabled={isLoading || isSolved}
            />
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground tabular-nums">
          {letters.filter((l) => l).length}/{CIPHER_LENGTH} letters
        </p>
      </SolverSection>

      <SolverControls
        onSolve={solveModule}
        onReset={reset}
        isSolveDisabled={!allFilled}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Decode"
      />

      <ErrorAlert error={error} />

      {result && (
        <SolverSection title="Decoded word" className="border-emerald-500/40">
          <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cipher shift
            </p>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 tabular-nums">
              {offsetLabel}
            </span>
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <LetterRow letters={ciphertext.split("")} tone="muted" />
            <span className="text-lg text-muted-foreground" aria-hidden>
              →
            </span>
            <LetterRow letters={result.solution.split("")} tone="solution" />
          </div>
        </SolverSection>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        The solver uses the bomb edgework to calculate the Caesar shift. A parallel
        port plus a lit NSA indicator forces the offset to 0.
      </SolverInstructions>
    </SolverLayout>
  );
}

function LetterRow({
  letters,
  tone,
}: {
  letters: string[];
  tone: "muted" | "solution";
}) {
  return (
    <div className="flex gap-1.5">
      {letters.map((ch, i) => (
        <div
          key={i}
          className={cn(
            "flex h-10 w-9 items-center justify-center rounded border text-lg font-mono font-bold",
            tone === "solution"
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-border bg-muted/60 text-muted-foreground",
          )}
        >
          {ch}
        </div>
      ))}
    </div>
  );
}
