import { useState } from "react";
import { solveGryphons, type GryphonsOutput } from "../../services/gryphonsService";
import { ModuleType, type BombEntity } from "../../types";
import { generateTwitchCommand } from "../../utils/twitchCommands";
import { ErrorAlert, SolverControls, SolverLayout, SolverSection, TwitchCommandDisplay, useSolver } from "../common";

export default function GryphonsSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [name, setName] = useState(""); const [age, setAge] = useState(23);
  const [result, setResult] = useState<GryphonsOutput | null>(null); const [command, setCommand] = useState("");
  const { isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, currentModule, round, markModuleSolved } = useSolver();
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    setIsLoading(true); clearError();
    try { const response = await solveGryphons(round.id, bomb.id, currentModule.id, { name, age }); setResult(response.output);
      const next = generateTwitchCommand({ moduleType: ModuleType.GRYPHONS, result: response.output }); setCommand(next); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Failed to solve Gryphons"); } finally { setIsLoading(false); }
  };
  return <SolverLayout>
    <SolverSection title="Displayed gryphon"><div className="grid gap-3 sm:grid-cols-2">
      <label>Name<input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block h-11 w-full rounded-md border bg-background px-3" /></label>
      <label>Age<input type="number" min={23} max={34} value={age} onChange={(e) => setAge(Number(e.target.value))} className="mt-1 block h-11 w-full rounded-md border bg-background px-3" /></label>
    </div></SolverSection>
    <SolverControls onSolve={solve} onReset={() => { setResult(null); setCommand(""); setName(""); setAge(23); setIsSolved(false); }} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Set and submit"><p className="text-center text-xl font-bold">{result.birdType} / {result.catType} — {result.accessory}</p></SolverSection>}
    {command && <TwitchCommandDisplay command={command} />}
  </SolverLayout>;
}
