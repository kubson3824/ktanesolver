import { useCallback, useMemo, useState } from "react";

import {
  solveModulesAgainstHumanity,
  type ModulesAgainstHumanityInput,
  type ModulesAgainstHumanityOutput,
} from "../../services/modulesAgainstHumanityService";
import { useRoundStore } from "../../store/useRoundStore";
import type { BombEntity } from "../../types";
import {
  ErrorAlert,
  SegmentedControl,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverResult,
  SolverSection,
  TwitchCommandDisplay,
  useSolver,
  useSolverModulePersistence,
} from "../common";

type CardSide = "black" | "white";

interface PersistedState {
  input?: Partial<ModulesAgainstHumanityInput>;
  initialBlackText?: string;
  initialWhiteText?: string;
  blackOnLeft?: boolean;
  secondaryBlackPresent?: boolean | null;
  secondaryWhitePresent?: boolean | null;
  result?: ModulesAgainstHumanityOutput | null;
  twitchCommands?: string[];
}

function Card({ color, position, label }: { color: CardSide; position: number; label: string }) {
  const black = color === "black";
  return <div className={`flex min-h-32 flex-col justify-between rounded-xl border p-4 ${black ? "border-black bg-black text-white" : "border-border bg-white text-black"}`}>
    <span className="text-xs font-semibold uppercase tracking-widest opacity-70">{label}</span>
    <strong className="text-center font-mono text-5xl tabular-nums">{position}</strong>
    <span className="text-right text-xs font-semibold uppercase tracking-widest">{color}</span>
  </div>;
}

function PresenceSelect({ color, value, onChange, disabled }: {
  color: CardSide;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  disabled: boolean;
}) {
  return <label className="space-y-1.5 text-sm font-medium">
    Does the secondary {color} card refer to a module on the bomb?
    <select
      value={value === null ? "" : String(value)}
      onChange={(event) => onChange(event.target.value === "" ? null : event.target.value === "true")}
      disabled={disabled}
      className="block h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
    >
      <option value="">Select…</option>
      <option value="true">Yes</option>
      <option value="false">No</option>
    </select>
  </label>;
}

function twitchCommands(result: ModulesAgainstHumanityOutput): string[] {
  if (result.finalBlackPosition == null || result.finalWhitePosition == null) return [];
  const commands = ["!number press reset"];
  const offset = (position: number) => position <= 6 ? position - 1 : position - 11;
  if (result.finalBlackPosition !== 1) commands.push(`!number move black ${offset(result.finalBlackPosition)}`);
  if (result.finalWhitePosition !== 1) commands.push(`!number move white ${offset(result.finalWhitePosition)}`);
  commands.push("!number press submit");
  return commands;
}

export default function ModulesAgainstHumanitySolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [initialBlackText, setInitialBlackText] = useState("");
  const [initialWhiteText, setInitialWhiteText] = useState("");
  const [blackOnLeft, setBlackOnLeft] = useState(true);
  const [secondaryBlackPresent, setSecondaryBlackPresent] = useState<boolean | null>(null);
  const [secondaryWhitePresent, setSecondaryWhitePresent] = useState<boolean | null>(null);
  const [result, setResult] = useState<ModulesAgainstHumanityOutput | null>(null);
  const [commands, setCommands] = useState<string[]>([]);
  const {
    currentModule, round, isLoading, isSolved, error,
    setIsLoading, setIsSolved, setError, clearError, reset: resetSolverState, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({
    initialBlackText, initialWhiteText, blackOnLeft,
    secondaryBlackPresent, secondaryWhitePresent, result, twitchCommands: commands,
  }), [initialBlackText, initialWhiteText, blackOnLeft, secondaryBlackPresent, secondaryWhitePresent, result, commands]);

  const restoreState = useCallback((saved: PersistedState) => {
    const input = saved.input ?? saved;
    if (typeof input.initialBlackText === "string") setInitialBlackText(input.initialBlackText);
    if (typeof input.initialWhiteText === "string") setInitialWhiteText(input.initialWhiteText);
    if (typeof input.blackOnLeft === "boolean") setBlackOnLeft(input.blackOnLeft);
    if (typeof input.secondaryBlackPresent === "boolean") setSecondaryBlackPresent(input.secondaryBlackPresent);
    if (typeof input.secondaryWhitePresent === "boolean") setSecondaryWhitePresent(input.secondaryWhitePresent);
    if (saved.result) setResult(saved.result);
    if (Array.isArray(saved.twitchCommands)) setCommands(saved.twitchCommands);
  }, []);

  const restoreSolution = useCallback((solution: ModulesAgainstHumanityOutput) => {
    setResult(solution);
    setCommands(twitchCommands(solution));
  }, []);

  useSolverModulePersistence<PersistedState, ModulesAgainstHumanityOutput>({
    state,
    onRestoreState: restoreState,
    onRestoreSolution: restoreSolution,
    extractSolution: (raw) => raw && typeof raw === "object" && "phase" in raw
      ? raw as ModulesAgainstHumanityOutput : null,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const atSecondaryStep = result?.phase === "SECONDARY";
  const disabled = isLoading || isSolved;

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    const input: ModulesAgainstHumanityInput = {
      initialBlackText, initialWhiteText, blackOnLeft,
      secondaryBlackPresent: atSecondaryStep ? secondaryBlackPresent : null,
      secondaryWhitePresent: atSecondaryStep ? secondaryWhitePresent : null,
    };
    try {
      const response = await solveModulesAgainstHumanity(round.id, bomb.id, currentModule.id, input);
      const nextCommands = twitchCommands(response.output);
      setResult(response.output);
      setCommands(nextCommands);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...input, result: response.output, twitchCommands: nextCommands }, response.output, response.solved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve Modules Against Humanity");
    } finally { setIsLoading(false); }
  };

  const reset = () => {
    setInitialBlackText(""); setInitialWhiteText(""); setBlackOnLeft(true);
    setSecondaryBlackPresent(null); setSecondaryWhitePresent(null); setResult(null); setCommands([]);
    resetSolverState();
  };

  const finalCards = result?.phase === "FINAL" && result.finalBlackPosition != null && result.finalWhitePosition != null
    ? (blackOnLeft
      ? [{ color: "black" as const, position: result.finalBlackPosition }, { color: "white" as const, position: result.finalWhitePosition }]
      : [{ color: "white" as const, position: result.finalWhitePosition }, { color: "black" as const, position: result.finalBlackPosition }])
    : [];

  return <SolverLayout>
    {!atSecondaryStep && !isSolved && <>
      <SolverSection title="Initial cards" description="Enter the complete text shown on card 1 of each color.">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium">Black card text
            <textarea value={initialBlackText} onChange={(event) => setInitialBlackText(event.target.value)} disabled={disabled} rows={4} className="block w-full rounded-md border border-input bg-black p-3 text-sm text-white" />
          </label>
          <label className="space-y-1.5 text-sm font-medium">White card text
            <textarea value={initialWhiteText} onChange={(event) => setInitialWhiteText(event.target.value)} disabled={disabled} rows={4} className="block w-full rounded-md border border-input bg-white p-3 text-sm text-black" />
          </label>
        </div>
      </SolverSection>
      <SolverSection title="Card layout" description="Which color is physically on the left?">
        <SegmentedControl<CardSide>
          value={blackOnLeft ? "black" : "white"}
          onChange={(value) => setBlackOnLeft(value === "black")}
          options={[{ value: "black", label: "Black on left" }, { value: "white", label: "White on left" }]}
          disabled={disabled}
          ariaLabel="Card color on the left"
        />
      </SolverSection>
    </>}

    {atSecondaryStep && <>
      <SolverSection title="Secondary cards" description="Move each color to the shown card, identify the referenced module, then answer below.">
        <div className="grid grid-cols-2 gap-3">
          <Card color="black" position={result.secondaryBlackPosition} label="Secondary" />
          <Card color="white" position={result.secondaryWhitePosition} label="Secondary" />
        </div>
      </SolverSection>
      <SolverSection title="Modules on the bomb">
        <div className="grid gap-3 md:grid-cols-2">
          <PresenceSelect color="black" value={secondaryBlackPresent} onChange={setSecondaryBlackPresent} disabled={disabled} />
          <PresenceSelect color="white" value={secondaryWhitePresent} onChange={setSecondaryWhitePresent} disabled={disabled} />
        </div>
      </SolverSection>
    </>}

    {finalCards.length > 0 && <SolverSection title="Final cards" description="Set both cards to these positions, then press Submit." className="border-emerald-500/40">
      <div className="grid grid-cols-2 gap-3">
        {finalCards.map((card, index) => <Card key={card.color} {...card} label={index === 0 ? "Left" : "Right"} />)}
      </div>
    </SolverSection>}

    <SolverControls
      onSolve={solve}
      onReset={reset}
      isSolveDisabled={atSecondaryStep
        ? secondaryBlackPresent === null || secondaryWhitePresent === null
        : !initialBlackText.trim() || !initialWhiteText.trim()}
      isLoading={isLoading}
      isSolved={isSolved}
      solveText={atSecondaryStep ? "Find final cards" : "Find secondary cards"}
    />
    <ErrorAlert error={error} />
    {isSolved && <SolverResult title="Cards ready" description="Press Submit on the module." />}
    {commands.length > 0 && <TwitchCommandDisplay command={commands} />}
    <SolverInstructions>Start from card 1 for both colors. The solver counts the required letters in the initial text and uses the bomb edgework automatically.</SolverInstructions>
  </SolverLayout>;
}
