import { useCallback, useMemo, useState, type SVGProps } from "react";

import { solveOnlyConnect, type OnlyConnectOutput } from "../../services/onlyConnectService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver, useSolverModulePersistence,
} from "../common";
import { Input } from "../ui/input";

export const ONLY_CONNECT_HIEROGLYPHS = [
  "Two Reeds", "Lion", "Twisted Flax", "Horned Viper", "Water", "Eye of Horus",
] as const;
const POSITIONS = ["Top left", "Top middle", "Top right", "Bottom left", "Bottom middle", "Bottom right"];
const emptyLetters = () => Array<string>(9).fill("");

export function OnlyConnectHieroglyph({ name, ...props }: { name: string } & SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 32 32" role="img" aria-label={name} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {name === "Two Reeds" && <><path d="M10 28V7m12 21V7M7 9c4 0 6-2 6-5m6 5c4 0 6-2 6-5" /><path d="M7 28h6m6 0h6" /></>}
    {name === "Lion" && <><path d="M7 21c3-8 14-8 17-2v6H11v-4m13-2c4-1 4-5 2-7" /><circle cx="9" cy="14" r="4" /><path d="M7 12 5 9m6 3 2-3" /></>}
    {name === "Twisted Flax" && <><path d="M23 7c-10-5-17 4-12 10 4 5 13 1 10-4-2-3-7-1-6 2 2 6 11 7 12 13" /><path d="M12 28h16" /></>}
    {name === "Horned Viper" && <><path d="M5 22c4-8 7 8 11 0s7 8 11 0" /><path d="M6 20 4 15m5 4 1-5" /></>}
    {name === "Water" && <><path d="M3 10c3-4 5 4 8 0s5 4 8 0 5 4 8 0M3 17c3-4 5 4 8 0s5 4 8 0 5 4 8 0M3 24c3-4 5 4 8 0s5 4 8 0 5 4 8 0" /></>}
    {name === "Eye of Horus" && <><path d="M3 16c7-8 19-8 26 0-7 7-19 7-26 0Z" /><circle cx="16" cy="16" r="4" /><path d="M13 21c0 5-4 7-7 7m13-7 4 5" /></>}
  </svg>;
}

type PersistedState = {
  phase?: number;
  teamName?: string;
  hieroglyphs?: string[];
  letters?: string[];
  wall?: string[];
  result?: OnlyConnectOutput | null;
  twitchCommand?: string;
};

export default function OnlyConnectSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [phase, setPhase] = useState(1);
  const [teamName, setTeamName] = useState("");
  const [hieroglyphs, setHieroglyphs] = useState<string[]>([...ONLY_CONNECT_HIEROGLYPHS]);
  const [letters, setLetters] = useState(emptyLetters);
  const [result, setResult] = useState<OnlyConnectOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const moduleState = useMemo(() => ({ phase, teamName, hieroglyphs, letters, result, twitchCommand }), [phase, teamName, hieroglyphs, letters, result, twitchCommand]);

  useSolverModulePersistence<PersistedState, OnlyConnectOutput>({
    state: moduleState,
    onRestoreState: useCallback((state) => {
      if (state.teamName !== undefined) setTeamName(state.teamName);
      if (state.hieroglyphs?.length === 6) setHieroglyphs(state.hieroglyphs);
      if (state.letters?.length === 9) setLetters(state.letters);
      else if (state.wall?.length === 9) setLetters(state.wall);
      if (state.result !== undefined) setResult(state.result);
      if (state.twitchCommand !== undefined) setTwitchCommand(state.twitchCommand);
      setPhase(state.phase ?? (state.hieroglyphs?.length === 6 ? 2 : 1));
    }, []),
    onRestoreSolution: useCallback((solution: OnlyConnectOutput) => {
      if (solution?.round !== 2) return;
      setPhase(2);
      setResult(solution);
      setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.ONLY_CONNECT, result: solution }));
    }, []),
    extractSolution: (raw) => raw && typeof raw === "object" && "round" in raw ? raw as OnlyConnectOutput : null,
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | null)?.solved),
    currentModule,
    setIsSolved,
  });

  const validGlyphs = new Set(hieroglyphs).size === 6;
  const validWall = letters.every((letter) => Array.from(letter.trim()).length === 1) && new Set(letters.map((letter) => letter.toLocaleLowerCase())).size === 9;

  const solve = useCallback(async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (phase === 1 && (!teamName.trim() || !validGlyphs)) return setError("Enter the team and place each hieroglyph once");
    if (phase === 2 && !validWall) return setError("Enter nine different single letters");
    clearError(); setIsLoading(true);
    try {
      const input = phase === 1
        ? { round: 1, teamName, hieroglyphs, letters: null }
        : { round: 2, teamName: null, hieroglyphs: null, letters };
      const response = await solveOnlyConnect(round.id, bomb.id, currentModule.id, input);
      const command = generateTwitchCommand({ moduleType: ModuleType.ONLY_CONNECT, result: response.output });
      const nextPhase = response.output.round === 1 ? 2 : phase;
      setPhase(nextPhase); setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { phase: nextPhase, teamName, hieroglyphs, letters, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Only Connect"); }
    finally { setIsLoading(false); }
  }, [round?.id, bomb?.id, currentModule?.id, phase, teamName, hieroglyphs, letters, validGlyphs, validWall, clearError, markModuleSolved, setError, setIsLoading, setIsSolved, updateModuleAfterSolve]);

  const reset = useCallback(() => {
    setPhase(1); setTeamName(""); setHieroglyphs([...ONLY_CONNECT_HIEROGLYPHS]); setLetters(emptyLetters());
    setResult(null); setTwitchCommand(""); resetSolverState();
  }, [resetSolverState]);

  return <SolverLayout>
    {phase === 1 ? <>
      <SolverSection title="Team name"><Input value={teamName} onChange={(event) => setTeamName(event.target.value.toUpperCase())} placeholder="ACADEMICALS" aria-label="Team name" disabled={isLoading || isSolved} /></SolverSection>
      <SolverSection title="Egyptian hieroglyphs" description="Set the six displayed positions in reading order.">
        <div className="grid gap-2 sm:grid-cols-2">
          {hieroglyphs.map((glyph, index) => <label key={index} className="flex items-center gap-3 rounded-md border p-2 text-sm">
            <span className="w-24 text-xs font-medium text-muted-foreground">{POSITIONS[index]}</span>
            <OnlyConnectHieroglyph name={glyph} className="h-9 w-9 shrink-0" />
            <select value={glyph} onChange={(event) => setHieroglyphs((current) => current.map((value, position) => position === index ? event.target.value : value))} disabled={isLoading || isSolved} aria-label={POSITIONS[index]} className="min-w-0 flex-1 bg-transparent">
              {ONLY_CONNECT_HIEROGLYPHS.map((name) => <option key={name}>{name}</option>)}
            </select>
          </label>)}
        </div>
      </SolverSection>
    </> : <SolverSection title="Connecting wall" description="Enter the jumbled 3 × 3 grid in reading order.">
      <div className="mx-auto grid max-w-xs grid-cols-3 gap-2">
        {letters.map((letter, index) => <Input key={index} value={letter} onChange={(event) => setLetters((current) => current.map((value, position) => position === index ? Array.from(event.target.value.normalize("NFC")).at(-1) ?? "" : value))} maxLength={1} aria-label={`Wall letter ${index + 1}`} disabled={isLoading || isSolved} className="h-14 text-center text-2xl font-semibold" />)}
      </div>
    </SolverSection>}

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} isSolveDisabled={phase === 1 ? !teamName.trim() || !validGlyphs : !validWall} solveText={phase === 1 ? "Find hieroglyph" : "Group letters"} />
    <ErrorAlert error={error} />

    {result?.round === 1 && <SolverSection title={`Press ${POSITIONS[(result.position ?? 1) - 1]}`} className="border-emerald-500/40"><div className="flex items-center justify-center gap-3 text-lg font-semibold"><OnlyConnectHieroglyph name={result.hieroglyph ?? ""} className="h-14 w-14" />{result.hieroglyph}</div></SolverSection>}
    {result?.round === 2 && <SolverSection title="Language groups" className="border-emerald-500/40"><div className="grid gap-2 sm:grid-cols-3">{result.groups.map((group) => <div key={group.letters.join("")} className="rounded-md border bg-emerald-500/10 p-3 text-center"><div className="text-2xl font-semibold">{group.letters.join(" · ")}</div><div className="mt-1 text-xs text-muted-foreground">{group.language}</div></div>)}</div></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Round 1 uses the current bomb serial number and ports. In round 2, selecting any two complete groups solves the remaining row automatically.</SolverInstructions>
  </SolverLayout>;
}
