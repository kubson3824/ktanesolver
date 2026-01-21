import { useState } from "react";
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

  const clearError = () => setError("");
  
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
  const moduleNumber = useRoundStore((state) => state.moduleNumber);

  return {
    currentModule,
    round,
    markModuleSolved,
    moduleNumber,
  };
}

export function useSolver() {
  const state = useSolverState();
  const data = useSolverData();

  return {
    ...state,
    ...data,
  };
}
