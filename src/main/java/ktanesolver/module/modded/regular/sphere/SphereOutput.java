package ktanesolver.module.modded.regular.sphere;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record SphereOutput(List<Action> actions, List<Action> fullSequence, int order, List<Integer> holdTimes) implements ModuleOutput {
	public record Action(String type, int value) {}
}
