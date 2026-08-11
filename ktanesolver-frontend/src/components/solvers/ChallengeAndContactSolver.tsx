import { useCallback, useMemo, useState } from "react";
import { solveChallengeAndContact, type ChallengeAndContactOutput } from "../../services/challengeAndContactService";
import { useRoundStore } from "../../store/useRoundStore";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver, useSolverModulePersistence } from "../common";

const CLUES: Array<[string, string]> = [
  ["VANILLA", "Solvable vanilla module"], ["ROYAL", "Module by Royal_Flu$h"], ["TIMWI", "Module by Timwi"],
  ["MAZE", "Other word in a two-word maze module"], ["AUDIO", "Last word of a module requiring audio"], ["SQUARE", "Other word with ‘Square’"],
  ["NEEDY", "Needy module"], ["PORT", "Modded port"], ["INDICATOR", "Vanilla indicator label"], ["RULESEED", "Module with rule-seed support"],
  ["BUTTON", "Other word with ‘Button(s)’"], ["WIRE", "Other word with ‘Wire(s)’"], ["NO_EA", "One-word solvable without E or A"],
  ["MUSIC", "Last word of a music-related module"], ["ICE_CREAM", "Person from Ice Cream"], ["MURDER", "Area in Murder"],
  ["CONTACT", "Contact."], ["ADVENTURE", "Item from Adventure Game"], ["TURN_KEYS", "Must not be solved for Turn the Keys"],
  ["ANAGRAMS", "Possible word from Anagrams"], ["DISEASE", "Disease from Dr. Doctor"], ["MONSPLODE", "Monsplode™"],
];

export default function ChallengeAndContactSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [stage, setStage] = useState(1), [clue, setClue] = useState(CLUES[0][0]), [letter, setLetter] = useState("");
  const [result, setResult] = useState<ChallengeAndContactOutput | null>(null), [twitchCommand, setTwitchCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolverState, currentModule, round, markModuleSolved } = useSolver();
  const updateModuleAfterSolve = useRoundStore(s => s.updateModuleAfterSolve);
  const state = useMemo(() => ({ stage, clue, letter, result, twitchCommand }), [stage, clue, letter, result, twitchCommand]);
  useSolverModulePersistence<typeof state, ChallengeAndContactOutput>({
    state, onRestoreState: useCallback(s => { if (s.stage) setStage(s.stage); if (s.clue) setClue(s.clue); if (s.letter) setLetter(s.letter); if (s.result) setResult(s.result); if (s.twitchCommand) setTwitchCommand(s.twitchCommand); }, []),
    onRestoreSolution: useCallback((solution: ChallengeAndContactOutput) => { setResult(solution); setTwitchCommand(generateTwitchCommand({ moduleType: ModuleType.CHALLENGE_AND_CONTACT, result: solution })); }, []), currentModule, setIsSolved,
  });
  const changed = () => { setResult(null); setTwitchCommand(""); setIsSolved(false); clearError(); };
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveChallengeAndContact(round.id, bomb.id, currentModule.id, stage, clue, letter);
      const command = generateTwitchCommand({ moduleType: ModuleType.CHALLENGE_AND_CONTACT, result: response.output });
      setResult(response.output); setTwitchCommand(command); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      else { setStage(stage + 1); setLetter(""); }
      updateModuleAfterSolve(bomb.id, currentModule.id, { stage: response.solved ? stage : stage + 1, clue, letter: "", result: response.output, twitchCommand: command }, response.output, response.solved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Challenge & Contact"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setStage(1); setClue(CLUES[0][0]); setLetter(""); setResult(null); setTwitchCommand(""); resetSolverState(); };
  return <SolverLayout>
    <SolverSection title={`Stage ${stage} live clue`}>
      <label>Clue<select aria-label="Clue" value={clue} onChange={e => { setClue(e.target.value); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3">{CLUES.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="mt-3 block">Newly revealed encrypted letter<input aria-label="Displayed letter" maxLength={1} value={letter} onChange={e => { setLetter(e.target.value.toUpperCase()); changed(); }} className="mt-1 h-11 w-full rounded border bg-background px-3 text-center text-xl uppercase" /></label>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} solveText="Find word" />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Contact, type, then submit" className="border-emerald-500/40"><p className="text-4xl font-bold">{result.answer}</p><p className="mt-2 text-sm">Decoded prefix: {result.decodedPrefix}</p></SolverSection>}
    {twitchCommand && <TwitchCommandDisplay command={twitchCommand} />}
    <SolverInstructions>Use default rule seed 1. Submit the word before the timer becomes the sad face. After a correct word, enter only the next newly revealed letter and the new clue. A wrong or late submission regenerates the entire streak: press Reset and restart at stage 1. Souvenir records each of the three encrypted displayed letters.</SolverInstructions>
  </SolverLayout>;
}
