import { useCallback, useMemo, useState } from "react";
import { solveMelodySequencer, type MelodySequencerOutput } from "../../services/melodySequencerService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const PARTS = [
  ["D4", "F4", "A4", "F4", "A#4", "F4", "A4", "F4"],
  ["D4", "F4", "A4", "C5", "D5", "A4", "D5", "C5"],
  ["F5", "D5", "F5", "A5", "A#5", "F5", "A#5", "A5"],
  ["G5", "E5", "G5", "E5", "C5", "E5", "C5", "A4"],
  ["G4", "E4", "G4", "E4", "A4", "E4", "A4", "F4"],
  ["A#4", "F4", "A#4", "G4", "C5", "G4", "C5", "A4"],
  ["D5", "A4", "D5", "G4", "C5", "G4", "C5", "F4"],
  ["A#4", "F4", "A#4", "E4", "A4", "E4", "A4", "C4"],
];

export default function MelodySequencerSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [slotParts, setSlotParts] = useState<Array<number | null>>(Array(8).fill(null));
  const [result, setResult] = useState<MelodySequencerOutput | null>(null);
  const [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(state => state.updateModuleAfterSolve);
  const state = useMemo(() => ({ slotParts, result, twitchCommand }), [slotParts, result, twitchCommand]);
  useSolverModulePersistence<typeof state, MelodySequencerOutput>({
    state,
    onRestoreState: useCallback(saved => { if (saved.slotParts) setSlotParts(saved.slotParts); if (saved.result) setResult(saved.result); if (saved.twitchCommand) setTwitchCommand(saved.twitchCommand); }, []),
    onRestoreSolution: useCallback((solution: MelodySequencerOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.MELODY_SEQUENCER, result: solution })); }, []),
    currentModule,
    setIsSolved,
  });
  const changed = () => { setResult(null); setTwitchCommand(""); setIsSolved(false); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (slotParts.filter(part => part !== null).length !== 4) return setError("Identify exactly four given melody parts");
    clearError(); setIsLoading(true);
    try {
      const response = await solveMelodySequencer(round.id, bomb.id, currentModule.id, slotParts);
      const command = generateTwitchCommand({ moduleType: ModuleType.MELODY_SEQUENCER, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { slotParts, result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Melody Sequencer"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setSlotParts(Array(8).fill(null)); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title="Identify the four given slots" description="Listen to each occupied slot, match its notes to the reference table, and leave empty slots as Missing.">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{slotParts.map((part, index) => <label key={index}>Slot {index + 1}<select aria-label={`Slot ${index + 1} melody part`} value={part ?? ""} onChange={event => { const value = event.target.value; setSlotParts(current => current.map((old, slot) => slot === index ? value === "" ? null : Number(value) : old)); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-2"><option value="">Missing</option>{PARTS.map((_, partIndex) => <option key={partIndex} value={partIndex + 1}>Part {partIndex + 1}</option>)}</select></label>)}</div>
    </SolverSection>
    <SolverSection title="Default melody reference"><div className="space-y-1 font-mono text-xs">{PARTS.map((notes, index) => <p key={index}><strong>Part {index + 1}:</strong> {notes.join(", ")}</p>)}</div></SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Plan moves and recordings" />
    <ErrorAlert error={error} />
    {result && <>
      <SolverSection title="Move the given parts" className="border-emerald-500/40">{result.moves.length ? <ol className="space-y-1">{result.moves.map((move, index) => <li key={index}>{index + 1}. Move slot <strong>{move.fromSlot}</strong> to slot <strong>{move.toSlot}</strong>.</li>)}</ol> : <p>All four given parts are already in their correct slots.</p>}</SolverSection>
      <SolverSection title="Record the missing parts"><ol className="space-y-3">{result.recordings.map(recording => <li key={recording.slot}>Slot <strong>{recording.slot}</strong>: <span className="font-mono">{recording.notes.join(" · ")}</span></li>)}</ol></SolverSection>
    </>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>This solver follows the manual’s default rule seed. Perform all listed moves before recording; each move is planned so its destination is the selected melody’s correct position. A wrong move or note strikes, but the layout remains usable—recheck the current slots before solving again. Melody Sequencer is not a Souvenir candidate.</SolverInstructions>
  </SolverLayout>;
}
