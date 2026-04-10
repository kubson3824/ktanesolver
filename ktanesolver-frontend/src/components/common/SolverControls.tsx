import { Button } from "../ui/button";

interface SolverControlsProps {
  onSolve: () => void;
  onReset: () => void;
  onSolveManually?: () => void;
  isSolveDisabled?: boolean;
  isResetDisabled?: boolean;
  isManualSolveDisabled?: boolean;
  isLoading?: boolean;
  isSolved?: boolean;
  solveText?: string;
  loadingText?: string;
  showManualSolve?: boolean;
  className?: string;
}

export default function SolverControls({
  onSolve,
  onReset,
  onSolveManually,
  isSolveDisabled = false,
  isResetDisabled = false,
  isManualSolveDisabled = false,
  isLoading = false,
  isSolved = false,
  solveText = "Solve",
  loadingText = "Solving...",
  showManualSolve = false,
  className = ""
}: SolverControlsProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Button
        variant={isSolved ? "success" : "primary"}
        size="md"
        className="w-full"
        onClick={onSolve}
        disabled={isSolveDisabled || isLoading || isSolved}
        loading={isLoading}
      >
        {isSolved ? "Solved ✓" : isLoading ? loadingText : solveText}
      </Button>

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
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={isResetDisabled || isLoading}
          className="ml-auto"
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
