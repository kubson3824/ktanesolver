import { useState, useEffect, useCallback } from "react";
import { useRoundStore } from "../../store/useRoundStore";

export interface SolverState {
  isLoading: boolean;
  error: string;
  isSolved: boolean;
}

export interface SolverActions {
  setIsLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setIsSolved: (solved: boolean) => void;
  clearError: () => void;
  reset: () => void;
}

export function useSolverState(initialState: Partial<SolverState> = {}) {
  const [isLoading, setIsLoading] = useState(initialState.isLoading ?? false);
  const [error, setError] = useState(initialState.error ?? "");
  const [isSolved, setIsSolved] = useState(initialState.isSolved ?? false);

  const clearError = useCallback(() => setError(""), []);
  
  const reset = () => {
    setIsLoading(false);
    setError("");
    setIsSolved(false);
  };

  return {
    isLoading,
    error,
    isSolved,
    setIsLoading,
    setError,
    setIsSolved,
    clearError,
    reset,
  };
}

export function useSolverData() {
  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);

  return {
    currentModule,
    round,
    markModuleSolved,
  };
}

export function useSolver() {
  const currentModule = useRoundStore((state) => state.currentModule);
  const round = useRoundStore((state) => state.round);
  const markModuleSolved = useRoundStore((state) => state.markModuleSolved);
  
  // Initialize isSolved based on currentModule.solved
  const initialState = {
    isSolved: currentModule?.solved ?? false
  };
  
  const state = useSolverState(initialState);
  
  // Update isSolved when currentModule.solved changes
  useEffect(() => {
    if (currentModule?.solved !== state.isSolved) {
      state.setIsSolved(currentModule?.solved ?? false);
    }
  }, [currentModule?.solved, state.isSolved, state.setIsSolved]);

  return {
    ...state,
    resetSolverState: state.reset,
    currentModule,
    round,
    markModuleSolved,
  };
}
