import { useState } from "react";
import { solveUltracube, type UltracubeOutput } from "../../services/ultracubeService";
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

const rotations = ["XY", "YX", "XZ", "ZX", "XW", "WX", "XV", "VX", "YZ", "ZY", "YW", "WY", "YV", "VY", "ZW", "WZ", "ZV", "VZ", "WV", "VW"];
const colors = ["RED", "YELLOW", "GREEN", "BLUE"];
const vertexLabel = (vertex: number) =>
  `${vertex & 16 ? "pong" : "ping"}-${vertex & 8 ? "zag" : "zig"}-${vertex & 2 ? "top" : "bottom"}-${vertex & 4 ? "back" : "front"}-${vertex & 1 ? "right" : "left"}`;

export default function UltracubeSolver({ bomb }: { bomb: BombEntity | null | undefined }) {
  const [observed, setObserved] = useState(["XY", "XY", "XY", "XY", "XY"]);
  const [stage, setStage] = useState(1);
  const [vertices, setVertices] = useState(Array(32).fill("RED"));
  const [result, setResult] = useState<UltracubeOutput | null>(null);
  const {
    isLoading, error, isSolved, setIsLoading, setError, setIsSolved, clearError,
    reset: resetSolver, currentModule, round, markModuleSolved,
  } = useSolver();

  const solve = async () => {
    if (!round?.id || !bomb?.id || !currentModule?.id)
      return setError("Missing required information");
    clearError();
    setIsLoading(true);
    try {
      const response = await solveUltracube(round.id, bomb.id, currentModule.id, observed, stage, vertices);
      setResult(response.output);
      setIsSolved(response.solved);
      if (response.solved)
        markModuleSolved(bomb.id, currentModule.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to solve The Ultracube");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setObserved(["XY", "XY", "XY", "XY", "XY"]);
    setStage(1);
    setVertices(Array(32).fill("RED"));
    setResult(null);
    resetSolver();
  };

  return <SolverLayout>
    <SolverSection title="Rotations">
      <div className="grid grid-cols-5 gap-2">
        {observed.map((rotation, index) => <select
          aria-label={`Rotation ${index + 1}`}
          key={index}
          value={rotation}
          onChange={event => setObserved(observed.map((value, position) => position === index ? event.target.value : value))}
          className="h-11 rounded border bg-background px-2"
        >
          {rotations.map(value => <option key={value}>{value}</option>)}
        </select>)}
      </div>
      <label className="mt-3 block">Stage
        <input type="number" min={1} max={4} value={stage} onChange={event => setStage(Number(event.target.value))} className="mt-1 h-11 w-full rounded border bg-background px-2" />
      </label>
    </SolverSection>
    <SolverSection title="Current vertex colors">
      <div className="grid gap-2 sm:grid-cols-2">
        {vertices.map((color, index) => <label key={index} className="text-xs">{vertexLabel(index)}
          <select value={color} onChange={event => setVertices(vertices.map((value, position) => position === index ? event.target.value : value))} className="mt-1 h-9 w-full rounded border bg-background px-2">
            {colors.map(value => <option key={value}>{value}</option>)}
          </select>
        </label>)}
      </div>
    </SolverSection>
    <SolverControls onSolve={solve} onReset={reset} isLoading={isLoading} isSolved={isSolved} />
    <ErrorAlert error={error} />
    {result && <SolverSection title="Touch vertex">
      <p>{result.face} face · {result.targetColor}</p>
      <p className="font-mono text-xl">{result.vertex}</p>
    </SolverSection>}
    {result && <TwitchCommandDisplay command={result.vertex} />}
    <SolverInstructions>Stop the rotations, enter the current colors, touch the result, then repeat after the colors change.</SolverInstructions>
  </SolverLayout>;
}
