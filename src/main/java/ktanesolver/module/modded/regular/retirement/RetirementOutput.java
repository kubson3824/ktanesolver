package ktanesolver.module.modded.regular.retirement;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record RetirementOutput(
	String home,
	String wife,
	String child,
	String sibling,
	List<HomeScore> scores,
	boolean tieBreakApplied
) implements ModuleOutput {
	public record HomeScore(String home, int wifeScore, int childScore, int siblingScore, int total) {}
}
