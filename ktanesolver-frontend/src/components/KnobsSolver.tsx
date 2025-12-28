import { useState } from "react";
import { solveKnob } from "../services/knobsService";
import type { KnobRequest, KnobResponse } from "../services/knobsService";

interface KnobsSolverProps {
  bomb: any;
  roundId: string;
  bombId: string;
  moduleId: string;
  onSolve?: (solution: any) => void;
}

export default function KnobsSolver({ bomb, roundId, bombId, moduleId, onSolve }: KnobsSolverProps) {
  const [indicators, setIndicators] = useState<boolean[]>(Array(12).fill(false));
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [solved, setSolved] = useState(false);

  const handleIndicatorChange = (index: number, checked: boolean) => {
    const newIndicators = [...indicators];
    newIndicators[index] = checked;
    setIndicators(newIndicators);
    setResult("");
  };

  const handleSolve = async () => {
    if (solved) return;
    
    setLoading(true);
    try {
      const response = await solveKnob(roundId, bombId, moduleId, { indicators });
      setResult(response.position);
      setSolved(true);
      
      if (onSolve) {
        onSolve({ position: response.position });
      }
    } catch (error) {
      setResult("Error solving knob");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIndicators(Array(12).fill(false));
    setResult("");
    setSolved(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Select the indicators that are lit on the module, then click solve to determine the correct knob position.
        </p>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {indicators.map((checked, index) => (
          <div key={index} className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => handleIndicatorChange(index, e.target.checked)}
              className="checkbox checkbox-primary"
              id={`indicator-${index}`}
            />
            <label htmlFor={`indicator-${index}`} className="ml-2 text-sm">
              {index + 1}
            </label>
          </div>
        ))}
      </div>

      {result && (
        <div className={`p-4 rounded-lg text-center font-bold text-lg ${
          result === "Unknown configuration" 
            ? "bg-gray-100 text-gray-800" 
            : "bg-green-100 text-green-800"
        }`}>
          {result === "Unknown configuration" ? result : `Turn knob ${result}`}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSolve}
          disabled={loading || !indicators.some(i => i) || solved}
          className="btn btn-primary flex-1"
        >
          {loading ? "Solving..." : solved ? "Solved" : "Solve"}
        </button>
        <button
          onClick={handleReset}
          className="btn btn-outline flex-1"
        >
          Reset
        </button>
      </div>
    </div>
  );
}