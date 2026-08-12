package ktanesolver.module.modded.regular.buttonsequence;

import java.util.List;
import java.util.Map;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.modded.regular.buttonsequence.ButtonSequenceInput.Color;

public record ButtonSequenceOutput(
	int panel,
	List<Action> actions,
	Map<Color, Integer> colorOccurrences
) implements ModuleOutput {
	public enum Action { SKIP, PRESS, HOLD }
}
