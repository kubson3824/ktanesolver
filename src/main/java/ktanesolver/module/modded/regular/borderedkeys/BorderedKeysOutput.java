package ktanesolver.module.modded.regular.borderedkeys;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record BorderedKeysOutput(
	int targetValue,
	List<Integer> decodedValues,
	List<Integer> validPositions,
	int recommendedPosition,
	Action action,
	String twitchCommand
) implements ModuleOutput {
	public enum Action { PRESS, RESET }
}
