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
  SolverControls,
  ErrorAlert,
  TwitchCommandDisplay,
} from "../common";

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
    [ciphertext, keyLetters, result, twitchCommand]
  );

  const onRestoreState = useCallback(
    (state: {
      ciphertext?: string;
      keyLetters?: string[];
      result?: CryptographyOutput | null;
      twitchCommand?: string;
    }) => {
      if (state.ciphertext !== undefined) setCiphertext(state.ciphertext);
      if (state.keyLetters !== undefined && state.keyLetters.length === 5)
        setKeyLetters(state.keyLetters);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    []
  );

  const onRestoreSolution = useCallback((solution: CryptographyOutput) => {
    if (solution?.plaintext != null && solution?.keyOrder?.length === 5) {
      setResult(solution);
      setTwitchCommand(
        generateTwitchCommand({
          moduleType: ModuleType.CRYPTOGRAPHY,
          result: { keyOrder: solution.keyOrder },
        })
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
      if (
        typeof o.plaintext === "string" &&
        Array.isArray(o.keyOrder) &&
        o.keyOrder.length === 5
      ) {
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
      const response = await solveCryptography(
        round.id,
        bomb.id,
        currentModule.id,
        {
          input: {
            ciphertext: ciphertext.trim(),
            keyLetters: keys,
          },
        }
      );

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
        true
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

  const canSolve =
    ciphertext.trim().length > 0 &&
    keyLetters.every((k) => k.trim().length === 1);

  return (
    <SolverLayout>
      <div className="rounded-xl border-2 border-neutral-600 bg-neutral-700/95 shadow-lg p-5 text-neutral-100">
        <p className="text-sm text-neutral-300 mb-4">
          The module shows ciphertext from &quot;A Christmas Carol&quot; (substitution cipher). E always decrypts to E; no other letter maps to itself. Enter the ciphertext and the five letters on the keys, then solve to get the decrypted text and the order to press the keys (first appearance in plaintext).
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-1">
              Ciphertext
            </label>
            <textarea
              className="w-full rounded-lg bg-neutral-800 border border-neutral-600 px-3 py-2 font-mono text-sm text-neutral-100 placeholder-neutral-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              rows={3}
              placeholder={PLACEHOLDER_CIPHERTEXT}
              value={ciphertext}
              onChange={(e) => setCiphertext(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              Key letters (5 keys, any order)
            </label>
            <div className="flex gap-2 flex-wrap">
              {[0, 1, 2, 3, 4].map((i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  className="w-12 rounded-lg bg-neutral-800 border border-neutral-600 px-2 py-2 text-center font-mono text-lg font-bold text-neutral-100 uppercase focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="?"
                  value={keyLetters[i] ?? ""}
                  onChange={(e) => setKeyLetter(i, e.target.value)}
                />
              ))}
            </div>
          </div>
        </div>

        {result && (
          <div className="mt-6 space-y-3 rounded-lg bg-neutral-800/80 border border-neutral-600 p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-1">
                Plaintext
              </p>
              <p className="text-neutral-100 font-mono text-sm leading-relaxed">
                {result.plaintext}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-400 mb-1">
                Press keys in order
              </p>
              <p className="text-amber-400 font-mono font-bold text-lg">
                {result.keyOrder.join(" → ")}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <SolverControls
          onSolve={handleSolve}
          onReset={reset}
          isSolveDisabled={!canSolve}
          isLoading={isLoading}
          solveText="Solve"
        />
      </div>

      <ErrorAlert error={error} />

      {result && (
        <div className="alert alert-success mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="font-bold">On the module</p>
            <p className="text-sm mt-1">
              Press the five keys once each in this order: {result.keyOrder.join(", ")}.
            </p>
          </div>
        </div>
      )}

      <TwitchCommandDisplay command={twitchCommand} />
    </SolverLayout>
  );
}
