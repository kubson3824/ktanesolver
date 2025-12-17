package ktanesolver.logic;

public final class SolveFailure<O extends ModuleOutput>
    implements SolveResult<O> {

    private final String reason;
    private final int strikes;

    public SolveFailure(String reason, int strikes) {
        this.reason = reason;
        this.strikes = strikes;
    }
}
