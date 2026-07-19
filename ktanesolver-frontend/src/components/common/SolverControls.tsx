import { useRef } from "react";
import { Button } from "../ui/button";

interface SolverControlsProps {
  onSolve: () => void | Promise<void>;
  onReset: () => void;
  onSolveManually?: () => void;
  isSolveDisabled?: boolean;
  canSolve?: boolean;
  isResetDisabled?: boolean;
  isManualSolveDisabled?: boolean;
  isLoading?: boolean;
  isSolved?: boolean;
  solveText?: string;
  solveButtonText?: string;
  loadingText?: string;
  showManualSolve?: boolean;
  showReset?: boolean;
  className?: string;
}

export default function SolverControls({
  onSolve,
  onReset,
  onSolveManually,
  isSolveDisabled = false,
  canSolve = true,
  isResetDisabled = false,
  isManualSolveDisabled = false,
  isLoading = false,
  isSolved = false,
  solveText = "Solve",
  solveButtonText,
  loadingText = "Solving...",
  showManualSolve = false,
  showReset = true,
  className = "",
}: SolverControlsProps) {
  const solveInFlight = useRef(false);
  const resolvedSolveText = solveButtonText ?? solveText;
  const resolvedSolveDisabled = isSolveDisabled || !canSolve;
  const solve = async () => {
    if (solveInFlight.current) return;
    solveInFlight.current = true;
    try {
      await onSolve();
    } finally {
      solveInFlight.current = false;
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Button
        variant={isSolved ? "success" : "default"}
        size="default"
        className="w-full"
        onClick={solve}
        disabled={resolvedSolveDisabled || isLoading || isSolved}
        loading={isLoading}
      >
        {isSolved ? "Calculated ✓" : isLoading ? loadingText : resolvedSolveText}
      </Button>

      {(showManualSolve || showReset) && (
        <div className="flex items-center justify-between gap-2">
          {showManualSolve && onSolveManually && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSolveManually}
              disabled={isManualSolveDisabled || isLoading}
            >
              Mark Solved
            </Button>
          )}
          {showReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              disabled={isResetDisabled || isLoading}
              className="ml-auto"
            >
              Reset
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
