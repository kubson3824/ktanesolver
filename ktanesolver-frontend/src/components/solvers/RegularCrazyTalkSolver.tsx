import { useMemo, useState } from "react";
import { solveRegularCrazyTalk, type RegularCrazyTalkOutput } from "../../services/regularCrazyTalkService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

type State = { text: string; result: RegularCrazyTalkOutput | null; command: string };

export default function RegularCrazyTalkSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [text, setText] = useState("We just blew up. | 0\nWe ran out of time. | 1\nYou cut out. | 2\nYou just cut out. | 3\nWere you saying something? | 4");
  const [result, setResult] = useState<RegularCrazyTalkOutput | null>(null);
  const [command, setCommand] = useState("");
  const solver = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo<State>(() => ({ text, result, command }), [text, result, command]);
  useSolverModulePersistence<State, RegularCrazyTalkOutput>({
    state,
    onRestoreState: saved => { if (saved.text !== undefined) setText(saved.text); if (saved.result !== undefined) setResult(saved.result); if (saved.command !== undefined) setCommand(saved.command); },
    onRestoreSolution: solution => { if (solution) setResult(solution); },
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule: solver.currentModule,
    setIsSolved: solver.setIsSolved,
  });

  const solve = async () => {
    if (!solver.round?.id || !bomb?.id || !solver.currentModule?.id) return solver.setError("Missing required information");
    const phrases = text.split(/\n/).map(line => {
      const separator = line.lastIndexOf("|");
      return { phrase: separator < 0 ? line.trim() : line.slice(0, separator).trim(), displayedDigit: Number(separator < 0 ? "" : line.slice(separator + 1).trim()) };
    });
    solver.clearError(); solver.setIsLoading(true);
    try {
      const response = await solveRegularCrazyTalk(solver.round.id, bomb.id, solver.currentModule.id, phrases);
      const nextCommand = generateTwitchCommand({ moduleType: ModuleType.REGULAR_CRAZY_TALK, result: response.output });
      setResult(response.output); setCommand(nextCommand); solver.setIsSolved(response.solved);
      if (response.solved) solver.markModuleSolved(bomb.id, solver.currentModule.id);
      updateModuleAfterSolve(bomb.id, solver.currentModule.id, { text, result: response.output, command: nextCommand }, response.output, response.solved);
    } catch (error) { solver.setError(error instanceof Error ? error.message : "Failed to solve Regular Crazy Talk"); }
    finally { solver.setIsLoading(false); }
  };

  return <SolverLayout>
    <SolverSection title="Five displayed phrases"><label>exact phrase | shown digit<textarea aria-label="Regular Crazy Talk phrases" rows={8} value={text} onChange={event => setText(event.target.value)} className="mt-1 w-full rounded border bg-background p-3 font-mono" /></label></SolverSection>
    <SolverControls onSolve={solve} onReset={() => { setResult(null); setCommand(""); solver.reset(); }} isLoading={solver.isLoading} isSolved={solver.isSolved} solveText="Find matching phrase" />
    <ErrorAlert error={solver.error} />
    {result && <SolverSection title={`Select phrase ${result.position}`} className="border-emerald-500/40"><p className="text-xl font-bold">{result.phrase || "(blank)"}</p><p>Hold at {result.hold}; release at {result.release}.</p></SolverSection>}
    {command && <TwitchCommandDisplay command={command} />}
    <SolverInstructions>Copy the exact five phrases and their displayed digits. The solver applies the official default rule-seed table, including insert substitutions and embellishment column order.</SolverInstructions>
  </SolverLayout>;
}
