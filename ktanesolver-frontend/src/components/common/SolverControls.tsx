import { Button } from "../ui/button";

interface SolverControlsProps {
  onSolve: () => void;
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
  className = ""
}: SolverControlsProps) {
  const resolvedSolveText = solveButtonText ?? solveText;
  const resolvedSolveDisabled = isSolveDisabled || !canSolve;

  return (
    <div className={`space-y-2 ${className}`}>
      <Button
        variant={isSolved ? "success" : "primary"}
        size="md"
        className="w-full"
        onClick={onSolve}
        disabled={resolvedSolveDisabled || isLoading || isSolved}
        loading={isLoading}
      >
        {isSolved ? "Solved ✓" : isLoading ? loadingText : resolvedSolveText}
      </Button>

      {(showManualSolve || showReset) && (
        <div className="flex items-center justify-between gap-2">
        {showManualSolve && onSolveManually && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onSolveManually}
            disabled={isManualSolveDisabled || isLoading}
            title="Mark this module as solved manually"
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
