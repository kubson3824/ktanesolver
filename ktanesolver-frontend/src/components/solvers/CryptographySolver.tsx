import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { useRoundStore } from "../../store/useRoundStore";
import {
  solveCryptography,
  type CryptographyOutput,
} from "../../services/cryptographyService";
import { ModuleType } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
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
import { cn } from "../../lib/cn";

interface CryptographySolverProps {
  bomb: BombEntity | null | undefined;
}

const PLACEHOLDER_CIPHERTEXT = "WLMY ETGXFD EQCD ED PQKW WT CMFF EZYDFB";

export default function CryptographySolver({ bomb }: CryptographySolverProps) {
  const [ciphertext, setCiphertext] = useState("");
  const [keyLetters, setKeyLetters] = useState<string[]>(["", "", "", "", ""]);
  const [result, setResult] = useState<CryptographyOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const {
    isLoading,
    error,
    isSolved,
    setError,
    setIsLoading,
    setIsSolved,
    clearError,
    reset: resetSolverState,
    currentModule,
    round,
    markModuleSolved,
  } = useSolver();

  const updateModuleAfterSolve = useRoundStore((s) => s.updateModuleAfterSolve);

  const moduleState = useMemo(
    () => ({ ciphertext, keyLetters, result, twitchCommand }),
    [ciphertext, keyLetters, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      ciphertext?: string;
      keyLetters?: string[];
      result?: CryptographyOutput | null;
      twitchCommand?: string;
    }) => {
      if (state.ciphertext !== undefined) setCiphertext(state.ciphertext);
      if (state.keyLetters !== undefined && state.keyLetters.length === 5) setKeyLetters(state.keyLetters);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback((solution: CryptographyOutput) => {
    if (solution?.plaintext != null && solution?.keyOrder?.length === 5) {
      setResult(solution);
      setTwitchCommand(
        generateTwitchCommand({
          moduleType: ModuleType.CRYPTOGRAPHY,
          result: { keyOrder: solution.keyOrder },
        }),
      );
    }
  }, []);

  useSolverModulePersistence<
    { ciphertext: string; keyLetters: string[]; result: CryptographyOutput | null; twitchCommand: string },
    CryptographyOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      const o = raw as { plaintext?: unknown; keyOrder?: unknown };
      if (typeof o.plaintext === "string" && Array.isArray(o.keyOrder) && o.keyOrder.length === 5) {
        return raw as CryptographyOutput;
      }
      return null;
    },
    inferSolved: (_sol, mod) => Boolean((mod as { solved?: boolean })?.solved),
    currentModule,
    setIsSolved,
  });

  const handleSolve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      setError("Missing round, bomb, or module.");
      return;
    }
    const keys = keyLetters.map((k) => k.trim().toUpperCase()).filter(Boolean);
    if (keys.length !== 5) {
      setError("Enter exactly 5 key letters (one per key).");
      return;
    }
    if (!ciphertext.trim()) {
      setError("Enter the ciphertext from the module.");
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      const response = await solveCryptography(round.id, bomb.id, currentModule.id, {
        input: {
          ciphertext: ciphertext.trim(),
          keyLetters: keys,
        },
      });

      const output = response.output;
      setResult(output);
      setIsSolved(true);
      markModuleSolved(bomb.id, currentModule.id);

      const command = generateTwitchCommand({
        moduleType: ModuleType.CRYPTOGRAPHY,
        result: { keyOrder: output.keyOrder },
      });
      setTwitchCommand(command);

      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        {
          ciphertext,
          keyLetters: keys,
          result: output,
          twitchCommand: command,
        },
        { plaintext: output.plaintext, keyOrder: output.keyOrder },
        true,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Solve failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const setKeyLetter = (index: number, value: string) => {
    const next = [...keyLetters];
    next[index] = value.replace(/[^A-Za-z]/g, "").slice(0, 1).toUpperCase();
    setKeyLetters(next);
  };

  const reset = () => {
    setCiphertext("");
    setKeyLetters(["", "", "", "", ""]);
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  const canSolve = ciphertext.trim().length > 0 && keyLetters.every((k) => k.trim().length === 1);

  return (
    <SolverLayout>
      <SolverSection
        title="Ciphertext"
        description='Copy the substitution ciphertext shown on the module ("A Christmas Carol").'
      >
        <textarea
          className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          rows={3}
          placeholder={PLACEHOLDER_CIPHERTEXT}
          value={ciphertext}
          onChange={(e) => setCiphertext(e.target.value)}
          disabled={isLoading || isSolved}
          aria-label="Ciphertext"
        />
      </SolverSection>

      <SolverSection
        title="Key letters"
        description="Enter the five letters on the module's keys in any order."
      >
        <div className="flex flex-wrap justify-center gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <input
              key={i}
              type="text"
              maxLength={1}
              className={cn(
                "h-12 w-12 rounded-md border-2 px-2 text-center font-mono text-lg font-bold uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
                keyLetters[i]
                  ? "border-ring bg-accent/15 text-foreground"
                  : "border-border bg-muted/40 text-muted-foreground",
              )}
              placeholder="?"
              value={keyLetters[i] ?? ""}
              onChange={(e) => setKeyLetter(i, e.target.value)}
              disabled={isLoading || isSolved}
              aria-label={`Key ${i + 1}`}
            />
          ))}
        </div>
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={reset}
        isSolveDisabled={!canSolve}
        isLoading={isLoading}
        isSolved={isSolved}
        solveText="Solve"
      />

      <ErrorAlert error={error} />

      {result && (
        <SolverSection title="Decrypted plaintext" className="border-emerald-500/40">
          <p className="mb-3 font-mono text-sm leading-relaxed text-foreground">
            {result.plaintext}
          </p>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Press keys in order
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {result.keyOrder.map((letter, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i > 0 && <span aria-hidden className="text-muted-foreground">→</span>}
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/10 font-mono text-lg font-bold text-emerald-700 dark:text-emerald-400">
                    {letter}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </SolverSection>
      )}

      {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}

      <SolverInstructions>
        E always decrypts to E; no other letter maps to itself. Press keys in the order
        their letters first appear in the plaintext.
      </SolverInstructions>
    </SolverLayout>
  );
}
