import { useEffect, useRef } from "react";
import { debugModuleSync } from "../../lib/api";

export type InferSolvedFn<TSolution> = (
  solution: TSolution | null,
  currentModule: unknown,
) => boolean;

export interface UseSolverModulePersistenceOptions<TState, TSolution> {
  state: TState;
  onRestoreState: (restored: TState) => void;

  solution?: TSolution | null;
  onRestoreSolution?: (restored: TSolution) => void;
  extractSolution?: (raw: unknown) => TSolution | null;

  inferSolved?: InferSolvedFn<TSolution>;
  persistState?: boolean;

  /**
   * When true, only call onRestoreSolution and set isSolved from solution when
   * inferSolved returns true. Use for modules that store in-progress solution
   * (e.g. Forget Me Not) so the "final" solution UI is not shown until solved.
   */
  onlyRestoreSolutionWhenSolved?: boolean;

  /**
   * The current module from the round store.
   * This should be the same object used by the solver component via `useSolver`.
   */
  currentModule: {
    id?: string;
    solved?: boolean;
    state?: unknown;
    solution?: unknown;
    moduleType?: unknown;
  } | null | undefined;

  /**
   * Setter for the shared `isSolved` flag from `useSolver`.
   * This ensures persistence updates the same solved state the component uses.
   */
  setIsSolved: (solved: boolean) => void;

  /**
   * Called at the start of the restore effect when there is state/solution to restore,
   * before onRestoreState/onRestoreSolution. Use to e.g. set a "skip clear once" ref
   * so dependent effects (e.g. on morseInput) do not clear the restored solution.
   */
  onBeforeRestore?: () => void;
}

export function useSolverModulePersistence<TState, TSolution = unknown>(
  options: UseSolverModulePersistenceOptions<TState, TSolution>,
) {
  const {
    onRestoreState,
    onRestoreSolution,
    extractSolution,
    inferSolved,
    onlyRestoreSolutionWhenSolved,
    currentModule,
    setIsSolved,
    onBeforeRestore,
  } = options;

  const onRestoreStateRef = useRef(onRestoreState);
  const onRestoreSolutionRef = useRef(onRestoreSolution);
  const extractSolutionRef = useRef(extractSolution);
  const inferSolvedRef = useRef(inferSolved);
  const onBeforeRestoreRef = useRef(onBeforeRestore);

  const restoredForModuleIdRef = useRef<string | undefined>(undefined);
  const currentModuleIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    onRestoreStateRef.current = onRestoreState;
    onRestoreSolutionRef.current = onRestoreSolution;
    extractSolutionRef.current = extractSolution;
    inferSolvedRef.current = inferSolved;
    onBeforeRestoreRef.current = onBeforeRestore;
  }, [onRestoreState, onRestoreSolution, extractSolution, inferSolved, onBeforeRestore]);

  useEffect(() => {
    currentModuleIdRef.current = currentModule?.id;
  }, [currentModule?.id]);

  useEffect(() => {
    if (!currentModule) return;

    const hasRestorableState =
      currentModule.state != null && typeof currentModule.state === "object";
    const hasRestorableSolution = currentModule.solution !== undefined;
    if (hasRestorableState || hasRestorableSolution) {
      onBeforeRestoreRef.current?.();
    }

    debugModuleSync("solverRestore:start", {
      moduleId: currentModule.id,
      moduleType: (currentModule as { moduleType?: unknown } | undefined)?.moduleType,
      solved: (currentModule as { solved?: boolean } | undefined)?.solved,
      hasState: Boolean((currentModule as { state?: unknown } | undefined)?.state),
      hasSolution: (currentModule as { solution?: unknown } | undefined)?.solution !== undefined,
    });

    restoredForModuleIdRef.current = undefined;

    if (currentModule.state && typeof currentModule.state === "object") {
      debugModuleSync("solverRestore:state", {
        moduleId: currentModule.id,
        stateKeys:
          currentModule.state && typeof currentModule.state === "object"
            ? Object.keys(currentModule.state as Record<string, unknown>)
            : undefined,
      });
      onRestoreStateRef.current(currentModule.state as TState);
    }

    if (currentModule.solution !== undefined) {
      const rawSolution = currentModule.solution as unknown;
      const parsed = extractSolutionRef.current
        ? extractSolutionRef.current(rawSolution)
        : (rawSolution as TSolution);

      debugModuleSync("solverRestore:solution", {
        moduleId: currentModule.id,
        parsed: parsed != null,
      });

      if (parsed != null) {
        const solved = inferSolvedRef.current
          ? inferSolvedRef.current(parsed, currentModule)
          : Boolean((currentModule as { solved?: boolean } | undefined)?.solved) || Boolean(parsed);

        if (onlyRestoreSolutionWhenSolved && !solved) {
          // Do not restore solution UI or mark solved when module is not actually solved
        } else {
          onRestoreSolutionRef.current?.(parsed);
          if (solved) {
            debugModuleSync("solverRestore:markSolved", { moduleId: currentModule.id });
            setIsSolved(true);
          }
        }
      } else if ((currentModule as { solved?: boolean } | undefined)?.solved) {
        debugModuleSync("solverRestore:markSolved", { moduleId: currentModule.id });
        setIsSolved(true);
      }
    } else if ((currentModule as { solved?: boolean } | undefined)?.solved) {
      debugModuleSync("solverRestore:markSolved", { moduleId: currentModule.id });
      setIsSolved(true);
    }

    const restoredId = currentModule?.id;
    queueMicrotask(() => {
      if (currentModuleIdRef.current !== restoredId) return;
      restoredForModuleIdRef.current = restoredId;
    });
    // Re-run when module state or solution content changes (e.g. after refreshRound) so backend state is applied
  }, [currentModule?.id, JSON.stringify(currentModule?.state ?? {}), JSON.stringify(currentModule?.solution ?? {}), onlyRestoreSolutionWhenSolved, setIsSolved]);
}
