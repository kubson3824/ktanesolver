import { useState } from "react";

import {
  BORDERED_KEYS_COLORS,
  solveBorderedKeys,
  type BorderedKey,
  type BorderedKeysColor,
  type BorderedKeysOutput,
} from "../../services/borderedKeysService";
import type { BombEntity } from "../../types";
import {
  ErrorAlert,
  SolverControls,
  SolverInstructions,
  SolverLayout,
  SolverSection,
  TwitchCommandDisplay,
  useSolver,
} from "../common";

const initialKeys = (): BorderedKey[] => Array.from({ length: 6 }, (_, index) => ({
  active: true,
  keyColor: "RED",
  labelColor: "RED",
  borderColor: "RED",
  label: index + 1,
  display: 1,
}));

export default function BorderedKeysSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [pressedBeforeReset, setPressedBeforeReset] = useState(0);
  const [keys, setKeys] = useState(initialKeys);
  const [result, setResult] = useState<BorderedKeysOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved,
    clearError, reset: resetSolver, currentModule, round, markModuleSolved,
  } = useSolver();
  const setKey = (index: number, value: Partial<BorderedKey>) =>
    setKeys(keys.map((key, keyIndex) => keyIndex === index ? { ...key, ...value } : key));

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    clearError();
    setIsLoading(true);
    try {
      const response = await solveBorderedKeys(round.id, bomb.id, currentModule.id, pressedBeforeReset, keys);
      setResult(response.output);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to solve Bordered Keys");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setPressedBeforeReset(0);
    setKeys(initialKeys());
    setResult(null);
    resetSolver();
  };

  return <SolverLayout>
    <SolverSection title="Current layout">
      <label>Keys already pressed before this layout <input
        type="number" min={0} max={5} value={pressedBeforeReset}
        onChange={event => setPressedBeforeReset(Number(event.target.value))}
        className="ml-2 h-10 w-20 rounded border bg-background px-2"
      /></label>
    </SolverSection>
    <SolverSection title="Keys in reading order">
      <div className="grid gap-2 sm:grid-cols-2">
        {keys.map((key, index) => <fieldset key={index} className="rounded border p-2">
          <legend><label><input
            type="checkbox" checked={key.active}
            onChange={event => setKey(index, { active: event.target.checked })}
          /> Key {index + 1} still active</label></legend>
          {key.active && <div className="grid grid-cols-2 gap-2">
            {(["keyColor", "labelColor", "borderColor"] as const).map(field => <label key={field}>
              {field === "keyColor" ? "Key" : field === "labelColor" ? "Label" : "Border"} color
              <select
                value={key[field]}
                onChange={event => setKey(index, { [field]: event.target.value as BorderedKeysColor })}
                className="block h-10 w-full rounded border bg-background"
              >{BORDERED_KEYS_COLORS.map(color => <option key={color}>{color}</option>)}</select>
            </label>)}
            <label>Label<input
              aria-label={`Key ${index + 1} label`} type="number" min={1} max={6} value={key.label}
              onChange={event => setKey(index, { label: Number(event.target.value) })}
              className="block h-10 w-full rounded border bg-background px-2"
            /></label>
            <label>Displayed digit<input
              aria-label={`Key ${index + 1} displayed digit`} type="number" min={1} max={6} value={key.display}
              onChange={event => setKey(index, { display: Number(event.target.value) })}
              className="block h-10 w-full rounded border bg-background px-2"
            /></label>
          </div>}
        </fieldset>)}
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverSection title={result.action === "RESET" ? "Press the black reset" : "Press this key"}>
      <p className="font-mono text-3xl">{result.recommendedPosition}</p>
      {result.validPositions.length > 1 && <p>Also valid now: {result.validPositions.join(", ")}</p>}
      <p>Target value {result.targetValue} · decoded {result.decodedValues.map(value => value || "–").join(", ")}</p>
    </SolverSection>}
    {result && <TwitchCommandDisplay command={result.twitchCommand} />}
    <SolverInstructions>
      Uncheck the recommended key after pressing it. After pressing reset, set the count to the number of unchecked keys and update every remaining key because the layout changes.
    </SolverInstructions>
  </SolverLayout>;
}
