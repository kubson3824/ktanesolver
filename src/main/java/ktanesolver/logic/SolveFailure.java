
package ktanesolver.logic;

public final class SolveFailure<O extends ModuleOutput> implements SolveResult<O> {

	private final String reason;

	public SolveFailure(String reason) {
		this.reason = reason;
	}
}
