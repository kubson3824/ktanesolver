package ktanesolver.module.modded.regular.rhythms;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record RhythmsOutput(boolean mash, List<Action> actions) implements ModuleOutput {
	public record Action(String button, int beeps) {
	}
}
