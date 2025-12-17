package ktanesolver.logic;

public sealed interface SolveResult<O extends ModuleOutput>
    permits SolveSuccess, SolveFailure {}
