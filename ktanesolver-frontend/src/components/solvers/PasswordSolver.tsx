import { useCallback, useMemo, useState } from "react";
import type { BombEntity } from "../../types";
import { ModuleType } from "../../types";
import { solvePassword, type PasswordOutput } from "../../services/passwordService";
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
  SolverResult,
} from "../common";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { TranslatedLanguageSelect, type TranslatedLanguageCode } from "../common/TranslatedLanguageSelect";
import CharacterKeyboard, { TRANSLATED_KEYBOARD_CHARACTERS } from "../common/CharacterKeyboard";

interface PasswordSolverProps {
  bomb: BombEntity | null | undefined;
}

export default function PasswordSolver({ bomb }: PasswordSolverProps) {
  const [columnLetters, setColumnLetters] = useState<Record<number, string[]>>({});
  const [language, setLanguage] = useState<TranslatedLanguageCode>("EN");
  const [activeColumn, setActiveColumn] = useState(1);
  const [result, setResult] = useState<PasswordOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState<string>("");

  const {
    isLoading,
    error,
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
    () => ({ language, columnLetters, result, twitchCommand }),
    [language, columnLetters, result, twitchCommand],
  );

  const onRestoreState = useCallback(
    (state: {
      columnLetters?: Record<number, string[]>;
      language?: TranslatedLanguageCode;
      result?: PasswordOutput | null;
      twitchCommand?: string;
      input?: { letters?: Record<number, string[]>; language?: TranslatedLanguageCode };
    }) => {
      if (state.input?.letters) setColumnLetters(state.input.letters);
      else if (state.columnLetters) setColumnLetters(state.columnLetters);
      if (state.input?.language) setLanguage(state.input.language);
      else if (state.language) setLanguage(state.language);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    [],
  );

  const onRestoreSolution = useCallback(
    (solution: PasswordOutput) => {
      if (!solution || !solution.possibleWords) return;
      setResult(solution);
      if (solution.possibleWords.length === 1) {
        setTwitchCommand(
          generateTwitchCommand({
            moduleType: ModuleType.PASSWORDS,
            result: { password: solution.possibleWords[0] },
          }),
        );
      }
      if (solution.resolved) setIsSolved(true);
    },
    [setIsSolved],
  );

  useSolverModulePersistence<
    { language: TranslatedLanguageCode; columnLetters: Record<number, string[]>; result: PasswordOutput | null; twitchCommand: string },
    PasswordOutput
  >({
    state: moduleState,
    onRestoreState,
    onRestoreSolution,
    extractSolution: (raw) => {
      if (raw == null) return null;
      if (typeof raw === "object") {
        const anyRaw = raw as { output?: unknown; result?: unknown };
        if (anyRaw.output && typeof anyRaw.output === "object") return anyRaw.output as PasswordOutput;
        if (anyRaw.result && typeof anyRaw.result === "object") return anyRaw.result as PasswordOutput;
        return raw as PasswordOutput;
      }
      return null;
    },
    inferSolved: (sol, currentModule) =>
      Boolean((currentModule as { solved?: boolean } | undefined)?.solved) || Boolean(sol?.resolved),
    currentModule,
    setIsSolved,
  });

  const handleColumnChange = (column: number, value: string) => {
    const letters = Array.from(value.normalize("NFKC").toUpperCase()).filter((letter) => !/\s/u.test(letter));
    setColumnLetters((prev) => ({ ...prev, [column]: letters }));
  };

  const handleSolve = async () => {
    if (!round || !currentModule || !bomb) return;
    setIsLoading(true);
    clearError();
    try {
      const response = await solvePassword(round.id, bomb.id, currentModule.id, {
        input: { letters: columnLetters, language },
      });
      setResult(response.output);
      if (response.output.resolved) {
        setIsSolved(true);
        markModuleSolved(bomb.id, currentModule.id);
        setTwitchCommand(
          generateTwitchCommand({
            moduleType: ModuleType.PASSWORDS,
            result: { password: response.output.possibleWords[0] },
          }),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to solve password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setColumnLetters({});
    setLanguage("EN");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  const hasAnyLetters = Object.values(columnLetters).some((arr) => arr.length > 0);

  return (
    <SolverLayout>
      <SolverSection title="Language">
        <TranslatedLanguageSelect
          value={language}
          onChange={(value) => { setLanguage(value); setColumnLetters({}); setResult(null); setTwitchCommand(""); }}
          disabled={isLoading || Boolean(result?.resolved)}
        />
      </SolverSection>

      <SolverSection
        title="Password columns"
        description="Enter the letters visible in each of the 5 columns (up to 6 per column)."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[1, 2, 3, 4, 5].map((col) => (
            <div key={col} className="flex flex-col gap-1.5">
              <label
                htmlFor={`password-column-${col}`}
                className="text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                Column {col}
              </label>
              <Input
                id={`password-column-${col}`}
                type="text"
                className="text-center font-mono text-lg font-semibold uppercase tracking-widest"
                placeholder={language === "EN" ? "ABC" : "…"}
                maxLength={6}
                value={(columnLetters[col] || []).join("")}
                onChange={(e) => handleColumnChange(col, e.target.value)}
                onFocus={() => setActiveColumn(col)}
                disabled={isLoading}
                aria-label={`Column ${col} letters`}
              />
            </div>
          ))}
        </div>
        {language !== "EN" && (
          <CharacterKeyboard
            characters={TRANSLATED_KEYBOARD_CHARACTERS[language]}
            onCharacter={(character) => setColumnLetters((current) => {
              const letters = current[activeColumn] ?? [];
              return letters.length >= 6
                ? current
                : { ...current, [activeColumn]: [...letters, character] };
            })}
            onBackspace={() => setColumnLetters((current) => ({
              ...current,
              [activeColumn]: (current[activeColumn] ?? []).slice(0, -1),
            }))}
            targetLabel={`column ${activeColumn}`}
            disabled={isLoading}
          />
        )}
      </SolverSection>

      <SolverControls
        onSolve={handleSolve}
        onReset={handleReset}
        isSolveDisabled={!hasAnyLetters}
        isLoading={isLoading}
        solveText="Solve"
      />

      <ErrorAlert error={error} />

      {result && (
        <>
          {result.resolved && result.possibleWords.length === 1 ? (
            <SolverResult variant="success" title={`Password: ${result.possibleWords[0]}`} />
          ) : (
            <SolverResult
              variant="warning"
              title="Multiple possibilities"
              description="Enter more letters to narrow the answer."
            />
          )}
          <SolverSection
            title={`Candidates (${result.possibleWords.length})`}
            plain={false}
          >
            <div className="flex flex-wrap gap-2">
              {result.possibleWords.map((word) => (
                <Badge
                  key={word}
                  variant={
                    result.resolved && result.possibleWords[0] === word
                      ? "success"
                      : "secondary"
                  }
                  className="font-mono text-sm py-1 px-3"
                >
                  {word}
                </Badge>
              ))}
            </div>
          </SolverSection>
        </>
      )}

      <TwitchCommandDisplay command={twitchCommand} />

      <SolverInstructions>
        Each column holds the letters that appear as you scroll through that
        position on the module. The solver narrows candidates as more letters
        are entered.
      </SolverInstructions>
    </SolverLayout>
  );
}
