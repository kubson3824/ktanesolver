import { useCallback, useMemo, useState } from "react";
import {
  solveTheCube,
  type TheCubeButton,
  type TheCubeColor,
  type TheCubeInput,
  type TheCubeOutput,
  type TheCubeRotation,
} from "../../services/theCubeService";
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

const ROTATIONS: Array<{ value: TheCubeRotation; label: string }> = [
  { value: "ROTATE_CLOCKWISE", label: "Rotate clockwise" },
  { value: "TIP_LEFT", label: "Tip left" },
  { value: "TIP_BACKWARDS", label: "Tip backwards" },
  { value: "ROTATE_COUNTERCLOCKWISE", label: "Rotate counterclockwise" },
  { value: "TIP_RIGHT", label: "Tip right" },
  { value: "TIP_FORWARDS", label: "Tip forwards" },
];
const COLORS: Array<{ value: TheCubeColor; label: string }> = [
  { value: "BLUE", label: "Blue" },
  { value: "GREEN", label: "Green" },
  { value: "ORANGE", label: "Orange" },
  { value: "PURPLE", label: "Purple" },
  { value: "RED", label: "Red" },
  { value: "WHITE", label: "White wire / grey button" },
];
const emptyButtons = (): Array<Partial<TheCubeButton>> =>
  Array.from({ length: 8 }, () => ({ color: undefined, label: "" }));

interface SavedState {
  rotations?: string[];
  faces?: string[];
  wires?: string[];
  buttons?: Array<Partial<TheCubeButton>>;
  executeButton?: Partial<TheCubeButton>;
  cipherTwo?: string;
  cipherThree?: string;
  result?: TheCubeOutput | null;
}

function SelectField({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return <label className="text-sm font-medium">
    {label}
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3"
    >
      <option value="">Select</option>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </label>;
}

export default function TheCubeSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [rotations, setRotations] = useState<string[]>(Array(6).fill(""));
  const [faces, setFaces] = useState<string[]>(Array(6).fill(""));
  const [wires, setWires] = useState<string[]>(Array(4).fill(""));
  const [buttons, setButtons] = useState<Array<Partial<TheCubeButton>>>(emptyButtons);
  const [executeButton, setExecuteButton] = useState<Partial<TheCubeButton>>({ label: "" });
  const [cipherTwo, setCipherTwo] = useState("");
  const [cipherThree, setCipherThree] = useState("");
  const [result, setResult] = useState<TheCubeOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolverState, currentModule, round, markModuleSolved,
  } = useSolver();
  const updateModuleAfterSolve = useRoundStore((state) => state.updateModuleAfterSolve);
  const state = useMemo(() => ({
    rotations, faces, wires, buttons, executeButton, cipherTwo, cipherThree, result,
  }), [rotations, faces, wires, buttons, executeButton, cipherTwo, cipherThree, result]);

  useSolverModulePersistence<SavedState, TheCubeOutput>({
    state,
    onRestoreState: useCallback((saved) => {
      if (saved.rotations?.length === 6) setRotations(saved.rotations);
      if (saved.faces?.length === 6) setFaces(saved.faces);
      if (saved.wires?.length === 4) setWires(saved.wires);
      if (saved.buttons?.length === 8) setButtons(saved.buttons);
      if (saved.executeButton) setExecuteButton(saved.executeButton);
      if (saved.cipherTwo !== undefined) setCipherTwo(saved.cipherTwo);
      if (saved.cipherThree !== undefined) setCipherThree(saved.cipherThree);
      if (saved.result) setResult(saved.result);
    }, []),
    onRestoreSolution: useCallback((solution: TheCubeOutput) => setResult(solution), []),
    inferSolved: (_solution, module) => Boolean((module as { solved?: boolean } | undefined)?.solved),
    currentModule,
    setIsSolved,
  });

  const setListValue = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number, value: string) =>
    setter((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
  const setButtonValue = (index: number, key: keyof TheCubeButton, value: string) =>
    setButtons((current) => current.map((button, buttonIndex) =>
      buttonIndex === index ? { ...button, [key]: value } : button));

  const reset = () => {
    setRotations(Array(6).fill(""));
    setFaces(Array(6).fill(""));
    setWires(Array(4).fill(""));
    setButtons(emptyButtons());
    setExecuteButton({ label: "" });
    setCipherTwo("");
    setCipherThree("");
    setResult(null);
    resetSolverState();
  };

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id) return setError("Missing required information");
    if (rotations.some((rotation) => !rotation)) return setError("Enter all six cube rotations");
    if (faces.some((face) => !/^\d$/.test(face))) return setError("Enter all six cube face digits");
    if (wires.some((wire) => !wire)) return setError("Enter all four wire colors");
    if (buttons.some((button) => !button.color || !/^[A-QX]$/i.test(button.label ?? ""))
      || !executeButton.color || !/^[A-QX]$/i.test(executeButton.label ?? "")) {
      return setError("Enter every button color and one-letter label");
    }
    const second = cipherTwo.replace(/\s/g, "").toUpperCase();
    const third = cipherThree.replace(/\s/g, "").toUpperCase();
    if (!/^[A-QX]{8}$/.test(second) || !/^[A-QX]{8}$/.test(third)) {
      return setError("Enter each translated cipher as eight letters from A–Q or X");
    }

    const input: TheCubeInput = {
      rotations: rotations as TheCubeRotation[],
      faces: faces.map(Number),
      wires: wires as TheCubeColor[],
      buttons: buttons.map((button) => ({
        color: button.color as TheCubeColor,
        label: button.label!.toUpperCase(),
      })),
      executeButton: {
        color: executeButton.color as TheCubeColor,
        label: executeButton.label!.toUpperCase(),
      },
      cipherTwo: second,
      cipherThree: third,
    };
    clearError();
    setIsLoading(true);
    try {
      const response = await solveTheCube(round.id, bomb.id, currentModule.id, input);
      setResult(response.output);
      setIsSolved(response.solved);
      if (response.solved) markModuleSolved(bomb.id, currentModule.id);
      updateModuleAfterSolve(bomb.id, currentModule.id, { ...state, ...input, result: response.output }, response.output, response.solved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to solve The Cube");
    } finally {
      setIsLoading(false);
    }
  };

  return <SolverLayout>
    {!result && <>
      <SolverSection title="Cube rotations" description="Enter the six movements in observed order.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rotations.map((rotation, index) => <SelectField
            key={index}
            label={`Rotation ${index + 1}`}
            value={rotation}
            options={ROTATIONS}
            onChange={(value) => setListValue(setRotations, index, value)}
            disabled={isLoading}
          />)}
        </div>
      </SolverSection>

      <SolverSection title="Cube faces" description="Enter faces 1–6 from the manual net; face 1 has the green LED and face 6 has the red LED.">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {faces.map((face, index) => <label key={index} className="text-sm font-medium">
            Face {index + 1}
            <input
              type="number"
              min={0}
              max={9}
              aria-label={`Face ${index + 1}`}
              value={face}
              onChange={(event) => setListValue(setFaces, index, event.target.value)}
              disabled={isLoading}
              className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3"
            />
          </label>)}
        </div>
      </SolverSection>

      <SolverSection title="Wires" description="Enter the four wires from top to bottom.">
        <div className="grid gap-3 sm:grid-cols-4">
          {wires.map((wire, index) => <SelectField
            key={index}
            label={`Wire ${index + 1}`}
            value={wire}
            options={COLORS}
            onChange={(value) => setListValue(setWires, index, value)}
            disabled={isLoading}
          />)}
        </div>
      </SolverSection>

      <SolverSection title="Square buttons" description="Enter buttons 1–8 in reading order. White represents grey buttons.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {buttons.map((button, index) => <div key={index} className="rounded-md border p-3">
            <SelectField
              label={`Button ${index + 1} color`}
              value={button.color ?? ""}
              options={COLORS}
              onChange={(value) => setButtonValue(index, "color", value)}
              disabled={isLoading}
            />
            <label className="mt-3 block text-sm font-medium">
              Button {index + 1} label
              <input
                type="text"
                maxLength={1}
                value={button.label ?? ""}
                onChange={(event) => setButtonValue(index, "label", event.target.value)}
                disabled={isLoading}
                className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3 uppercase"
              />
            </label>
          </div>)}
        </div>
      </SolverSection>

      <SolverSection title="Execute button">
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="Execute button color"
            value={executeButton.color ?? ""}
            options={COLORS}
            onChange={(value) => setExecuteButton((current) => ({ ...current, color: value as TheCubeColor }))}
            disabled={isLoading}
          />
          <label className="text-sm font-medium">
            Execute button label
            <input
              type="text"
              maxLength={1}
              value={executeButton.label ?? ""}
              onChange={(event) => setExecuteButton((current) => ({ ...current, label: event.target.value }))}
              disabled={isLoading}
              className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3 uppercase"
            />
          </label>
        </div>
      </SolverSection>

      <SolverSection title="Translated displays" description="Translate both repeating symbol transmissions with the manual, then enter the eight English letters.">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["Cipher 2", cipherTwo, setCipherTwo],
            ["Cipher 3", cipherThree, setCipherThree],
          ].map(([label, value, setter]) => <label key={label as string} className="text-sm font-medium">
            {label as string}
            <input
              type="text"
              maxLength={8}
              value={value as string}
              onChange={(event) => (setter as React.Dispatch<React.SetStateAction<string>>)(event.target.value)}
              disabled={isLoading}
              className="mt-1 block h-11 w-full rounded-md border border-input bg-background px-3 uppercase"
            />
          </label>)}
        </div>
      </SolverSection>
    </>}

    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />

    {result && <>
      <SolverSection title="Ciphers" className="border-emerald-500/40">
        <div className="grid gap-3 text-center sm:grid-cols-2">
          <p><span className="block text-sm text-muted-foreground">Cipher 1</span><strong className="text-2xl tracking-widest">{result.cipherOne}</strong></p>
          <p><span className="block text-sm text-muted-foreground">Final cipher</span><strong className="text-2xl tracking-widest">{result.finalCipher}</strong></p>
        </div>
      </SolverSection>
      <SolverSection title="Stage solutions" description="Press the listed square buttons in any order, then press execute.">
        <div className="space-y-4">
          {result.stages.map((stage) => {
            const twitchCommand = generateTwitchCommand({ moduleType: ModuleType.THE_CUBE, result: stage });
            return <div key={stage.stage} className="rounded-md border p-4">
              <p className="font-semibold">Stage {stage.stage} · cipher digit {stage.cipherDigit}</p>
              <p className="mt-1">
                {stage.buttons.length ? `Press buttons ${stage.buttons.join(", ")}, then execute.` : "Press execute without selecting a square button."}
              </p>
              {twitchCommand && <div className="mt-3"><TwitchCommandDisplay command={twitchCommand} /></div>}
            </div>;
          })}
        </div>
      </SolverSection>
    </>}
    <SolverInstructions>Observe all fixed module information before solving. A wrong stage resets selected buttons; re-enter the listed buttons for that stage.</SolverInstructions>
  </SolverLayout>;
}
