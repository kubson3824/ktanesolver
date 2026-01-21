interface SolverControlsProps {
  onSolve: () => void;
  onReset: () => void;
  onSolveManually?: () => void;
  isSolveDisabled?: boolean;
  isResetDisabled?: boolean;
  isManualSolveDisabled?: boolean;
  isLoading?: boolean;
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
  solveText = "Solve",
  loadingText = "Solving...",
  showManualSolve = false,
  className = ""
}: SolverControlsProps) {
  return (
    <div className={`flex gap-3 mb-4 ${className}`}>
      <button
        onClick={onSolve}
        className="btn btn-primary flex-1"
        disabled={isSolveDisabled || isLoading}
      >
        {isLoading ? <span className="loading loading-spinner loading-sm"></span> : ""}
        {isLoading ? loadingText : solveText}
      </button>
      {showManualSolve && onSolveManually && (
        <button 
          onClick={onSolveManually} 
          className="btn btn-success" 
          disabled={isManualSolveDisabled || isLoading}
          title="Mark this module as solved manually"
        >
          Solve
        </button>
      )}
      <button 
        onClick={onReset} 
        className="btn btn-outline" 
        disabled={isResetDisabled || isLoading}
      >
        Reset
      </button>
    </div>
  );
}
