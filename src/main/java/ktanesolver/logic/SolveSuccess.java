package ktanesolver.logic;

public record SolveSuccess<O extends ModuleOutput>(O output, boolean solved)
        implements SolveResult<O> {

}
