import { useMemo, useState } from "react";

import { solveErrorCodes, type ErrorCodesOutput } from "../../services/errorCodesService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";

const EMPTY_CODES = ["", "", "", ""];
const validCodes = (codes: string[]) =>
  codes.length === 4 && codes.every((code) => /^[0-9A-F]{2}$/.test(code) && parseInt(code, 16) <= 101);

export default function ErrorCodesSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [errorCodes, setErrorCodes] = useState(EMPTY_CODES);
  const [result, setResult] = useState<ErrorCodesOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(
    () => ({ errorCodes, result, twitchCommand }),
    [errorCodes, result, twitchCommand],
  );

  useSolverModulePersistence<typeof moduleState, ErrorCodesOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (state.errorCodes !== undefined) setErrorCodes(state.errorCodes);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: (solution) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.ERROR_CODES, result: solution }));
    },
    currentModule,
    setIsSolved,
  });

  const solve = async () => {
    if (!validCodes(errorCodes)) return setError("Enter four hexadecimal codes from 00 to 65");
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError();
    setIsLoading(true);
    try {
      const response = await solveErrorCodes(round.id, bomb.id, currentModule.id, { errorCodes });
      const command = generateTwitchCommand({ moduleType: ModuleType.ERROR_CODES, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id, currentModule.id, { errorCodes, result: response.output, twitchCommand: command },
        response.output, response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Error Codes");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setErrorCodes(EMPTY_CODES);
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  };

  return <SolverLayout>
    <SolverSection title="Displayed error codes" description="Enter the four hexadecimal codes from left to right.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {errorCodes.map((code, index) => <label key={index} className="text-sm font-medium">
          {index + 1}{["st", "nd", "rd", "th"][index]} code
          <input
            type="text"
            inputMode="text"
            maxLength={2}
            value={code}
            onChange={(event) => {
              const next = [...errorCodes];
              next[index] = event.target.value.toUpperCase().replace(/[^0-9A-F]/g, "").slice(0, 2);
              setErrorCodes(next);
              setResult(null);
              setTwitchCommand("");
              clearError();
            }}
            disabled={isLoading || isSolved}
            aria-label={`Error code ${index + 1}`}
            className="mt-2 h-12 w-full rounded-md border bg-background px-3 text-center font-mono text-2xl"
          />
        </label>)}
      </div>
    </SolverSection>
    <SolverControls
      onSolve={solve}
      onReset={reset}
      isSolveDisabled={!validCodes(errorCodes)}
      isLoading={isLoading}
      isSolved={isSolved}
      solveText="Calculate fix code"
    />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Fix code" description={`Enter this ${result.format.toLowerCase()} value, including leading zeros, then press Send.`} className="border-emerald-500/40">
      <div className="text-center font-mono text-4xl font-bold tracking-widest" aria-label={`Fix code ${result.fixCode}`}>
        {result.fixCode}
      </div>
      <p className="mt-3 text-center text-sm text-muted-foreground">
        Active error: {result.activeErrorCode} · Decimal value: {result.decimalFixCode}
      </p>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>The active code and required number base depend on whether the serial contains a vowel and whether the battery count is even.</SolverInstructions>
  </SolverLayout>;
}
