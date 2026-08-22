import {useState} from "react";
import {
  MISORDERED_KEYS_COLORS, solveMisorderedKeys, type MisorderedKey,
  type MisorderedKeysColor, type MisorderedKeysOutput,
} from "../../services/misorderedKeysService";
import type {BombEntity} from "../../types";
import {
  ErrorAlert, SolverControls, SolverInstructions, SolverLayout, SolverSection,
  TwitchCommandDisplay, useSolver,
} from "../common";

const initial = (): MisorderedKey[] => Array.from({length: 6}, () => ({keyColor: "RED", labelColor: "RED", label: "1"}));

export default function MisorderedKeysSolver({bomb}: {bomb: BombEntity | null | undefined}) {
  const [keys, setKeys] = useState(initial);
  const [k, setK] = useState(1);
  const [result, setResult] = useState<MisorderedKeysOutput | null>(null);
  const {isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError, reset: resetSolver, currentModule, round, markModuleSolved} = useSolver();
  const set = (index: number, value: Partial<MisorderedKey>) => setKeys(keys.map((key, i) => i === index ? {...key, ...value} : key));
  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError(); setIsLoading(true);
    try {
      const response = await solveMisorderedKeys(round.id, bomb.id, currentModule.id, keys, k);
      setResult(response.output); setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to solve Misordered Keys"); }
    finally { setIsLoading(false); }
  };
  const reset = () => { setKeys(initial()); setK(1); setResult(null); resetSolver(); };

  return <SolverLayout>
    <SolverSection title="Keys in reading order">
      <div className="grid gap-2 sm:grid-cols-2">
        {keys.map((key, i) => <fieldset key={i} className="rounded border p-2">
          <legend><label><input type="radio" name="misordered-k" checked={k === i + 1} onChange={() => setK(i + 1)}/> Key {i + 1} is K</label></legend>
          <div className="grid grid-cols-3 gap-2">
            <select value={key.keyColor} onChange={e => set(i, {keyColor: e.target.value as MisorderedKeysColor})} aria-label={`Key ${i + 1} color`} className="h-10 rounded border bg-background">
              {MISORDERED_KEYS_COLORS.map(color => <option key={color}>{color}</option>)}
            </select>
            <select value={key.labelColor} onChange={e => set(i, {labelColor: e.target.value as MisorderedKeysColor})} aria-label={`Key ${i + 1} label color`} className="h-10 rounded border bg-background">
              {MISORDERED_KEYS_COLORS.map(color => <option key={color}>{color}</option>)}
            </select>
            <input value={key.label} onChange={e => set(i, {label: e.target.value})} maxLength={6} pattern="[1-6]{1,6}" aria-label={`Key ${i + 1} label`} className="h-10 rounded border bg-background px-2"/>
          </div>
        </fieldset>)}
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved}/>
    <ErrorAlert error={error}/>
    {result && <SolverSection title="Press positions"><p className="font-mono text-3xl">{result.pressOrder.join(" ")}</p><p>First values: {result.firstValues.join(", ")} · second values: {result.secondValues.join(", ")}</p></SolverSection>}
    {result && <TwitchCommandDisplay command={result.twitchCommand}/>} 
    <SolverInstructions>Hover each key to identify K, then enter every key color, label color, and full label exactly as displayed.</SolverInstructions>
  </SolverLayout>;
}
