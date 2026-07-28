import { useCallback, useMemo, useState } from "react";

import {
  solveTangrams,
  type TangramsChipType,
  type TangramsOutput,
} from "../../services/tangramsService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
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

const validLengths: Record<TangramsChipType, number[]> = {
  "TAN-S": [7, 8, 9],
  "TAN-D": [6, 7, 9],
};

export default function TangramsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [chipType, setChipType] = useState<TangramsChipType>("TAN-S");
  const [chipCode, setChipCode] = useState("");
  const [result, setResult] = useState<TangramsOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const validCode = validLengths[chipType].includes(chipCode.length);
  const moduleState = useMemo(
    () => ({ chipType, chipCode, result, twitchCommand }),
    [chipType, chipCode, result, twitchCommand],
  );

  useSolverModulePersistence<typeof moduleState, TangramsOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (state.chipType !== undefined) setChipType(state.chipType);
      if (state.chipCode !== undefined) setChipCode(state.chipCode);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: (solution) => {
      if (!solution?.connections?.length) return;
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.TANGRAMS, result: solution }));
    },
    currentModule,
    setIsSolved,
  });

  const clearResult = () => {
    setResult(null);
    setTwitchCommand("");
    clearError();
  };

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (!validCode) return setError(`Enter a ${validLengths[chipType].join(", ")}-digit ${chipType} code`);
    clearError();
    setIsLoading(true);
    try {
      const response = await solveTangrams(
        round.id,
        bomb.id,
        currentModule.id,
        { chipType, chipCode },
      );
      const command = generateTwitchCommand({ moduleType: ModuleType.TANGRAMS, result: response.output });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { chipType, chipCode, result: response.output, twitchCommand: command },
        response.output,
        response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Tangrams");
    } finally {
      setIsLoading(false);
    }
  }, [
    round?.id, bomb?.id, currentModule?.id, validCode, chipType, chipCode, clearError,
    markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve,
  ]);

  const reset = useCallback(() => {
    setChipType("TAN-S");
    setChipCode("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection title="Chip code" description="Select the displayed chip family and enter the digits below it.">
      <div className="grid gap-3 sm:grid-cols-[9rem_1fr]">
        <label className="text-sm font-medium">
          Chip family
          <select
            value={chipType}
            onChange={(event) => {
              setChipType(event.target.value as TangramsChipType);
              clearResult();
            }}
            disabled={isLoading || isSolved}
            className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="TAN-S">TAN-S</option>
            <option value="TAN-D">TAN-D</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Digits
          <Input
            value={chipCode}
            onChange={(event) => {
              setChipCode(event.target.value.replace(/\D/g, "").slice(0, 9));
              clearResult();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && validCode && !isLoading && !isSolved) void solve();
            }}
            placeholder={chipType === "TAN-S" ? "1234567" : "376581"}
            aria-label="Tangrams chip code digits"
            inputMode="numeric"
            autoComplete="off"
            disabled={isLoading || isSolved}
            className="mt-2 text-center font-mono text-xl tracking-widest"
          />
        </label>
      </div>
    </SolverSection>

    <SolverControls
      onSolve={solve}
      onReset={reset}
      isSolveDisabled={!validCode}
      isLoading={isLoading}
      isSolved={isSolved}
      solveText="Trace circuit"
    />
    <ErrorAlert error={error} />

    {result && <SolverSection title="Overload these circuits" className="border-emerald-500/40">
      <ol className="grid gap-3 sm:grid-cols-3">
        {result.connections.map((connection, index) => <li
          key={connection.positivePin}
          className="rounded-md border bg-muted/40 p-3 text-center"
        >
          <span className="block text-xs font-medium uppercase text-muted-foreground">Pair {index + 1}</span>
          <span className="mt-1 block font-mono text-lg font-semibold">
            +{connection.positivePin} <span aria-hidden="true">→</span> −{connection.negativePin}
          </span>
        </li>)}
      </ol>
    </SolverSection>}

    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>
      Pins are numbered clockwise from the indicated pin. Select each positive pin first, then its negative pin,
      and wait for the pop before entering the next pair.
    </SolverInstructions>
  </SolverLayout>;
}
