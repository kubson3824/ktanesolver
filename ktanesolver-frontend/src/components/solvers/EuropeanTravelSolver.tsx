import { useCallback, useMemo, useState } from "react";

import {
  solveEuropeanTravel,
  type EuropeanTravelOutput,
} from "../../services/europeanTravelService";
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

const COUNTRIES = ["The Netherlands", "UK", "Germany", "France", "Spain", "Belgium"];

export default function EuropeanTravelSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [country, setCountry] = useState("");
  const [ticketSerial, setTicketSerial] = useState("");
  const [result, setResult] = useState<EuropeanTravelOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(
    () => ({ country, ticketSerial, result, twitchCommand }),
    [country, ticketSerial, result, twitchCommand],
  );

  useSolverModulePersistence<typeof moduleState, EuropeanTravelOutput>({
    state: moduleState,
    onRestoreState: (state) => {
      if (state.country !== undefined) setCountry(state.country);
      if (state.ticketSerial !== undefined) setTicketSerial(state.ticketSerial);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
    },
    onRestoreSolution: (solution) => {
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({
        moduleType: ModuleType.EUROPEAN_TRAVEL,
        result: solution,
      }));
    },
    currentModule,
    setIsSolved,
  });

  const solve = useCallback(async () => {
    if (!country) return setError("Select the ticket country.");
    if (!/^[A-NP-Z0-9]{6}$/.test(ticketSerial)) {
      return setError("Enter the six-character ticket serial; O is not used.");
    }
    if (!round?.id || !bomb?.id || !currentModule?.id) {
      return setError("Missing required information");
    }
    clearError();
    setIsLoading(true);
    try {
      const input = { country, ticketSerial };
      const response = await solveEuropeanTravel(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({
        moduleType: ModuleType.EUROPEAN_TRAVEL,
        result: response.output,
      });
      setResult(response.output);
      setTwitchCommand(command);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(
        bomb.id,
        currentModule.id,
        { ...input, result: response.output, twitchCommand: command },
        response.output,
        response.solved,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve European Travel");
    } finally {
      setIsLoading(false);
    }
  }, [
    country, ticketSerial, round?.id, bomb?.id, currentModule?.id, clearError,
    markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve,
  ]);

  const reset = useCallback(() => {
    setCountry("");
    setTicketSerial("");
    setResult(null);
    setTwitchCommand("");
    resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    <SolverSection
      title="Ticket"
      description="Select the ticket color's country and enter its printed serial."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium">Country</span>
          <select
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            disabled={isLoading || isSolved}
            aria-label="Ticket country"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Select country</option>
            {COUNTRIES.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium">Ticket serial</span>
          <Input
            value={ticketSerial}
            onChange={(event) => setTicketSerial(
              event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
            )}
            maxLength={6}
            placeholder="ABC123"
            aria-label="Six-character ticket serial"
            disabled={isLoading || isSolved}
            className="font-mono tracking-[0.25em]"
          />
        </label>
      </div>
    </SolverSection>
    <SolverControls
      onSolve={solve}
      onReset={reset}
      isSolveDisabled={!country || ticketSerial.length !== 6}
      isLoading={isLoading}
      isSolved={isSolved}
    />
    <ErrorAlert error={error} />
    {result && <SolverSection
      title="Completed ticket"
      description="Set every field exactly as shown, then ring the bell."
      className="border-emerald-500/40"
    >
      <div className="rounded-lg border-2 border-dashed border-emerald-600/50 bg-emerald-500/5 p-4">
        <div className="flex flex-wrap justify-between gap-2 text-lg font-bold">
          <span>{result.ticketType}</span>
          <span>{result.travelClass}</span>
          <span>Seat {result.seat}</span>
        </div>
        <div className="my-4 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <p><span className="block text-xs uppercase text-muted-foreground">From</span>{result.departure}</p>
          <span aria-hidden="true">→</span>
          <p><span className="block text-xs uppercase text-muted-foreground">To</span>{result.destination}</p>
        </div>
        <p className="text-right text-2xl font-black tabular-nums">€{result.price}</p>
      </div>
    </SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>
      The ticket serial is separate from the bomb serial. The letter O never appears.
    </SolverInstructions>
  </SolverLayout>;
}
