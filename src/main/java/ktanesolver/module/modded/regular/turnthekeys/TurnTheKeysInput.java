package ktanesolver.module.modded.regular.turnthekeys;

import ktanesolver.logic.ModuleInput;

public record TurnTheKeysInput(int priority, Boolean rightKeyTurned, Boolean leftKeyTurned) implements ModuleInput {

	public TurnTheKeysInput(int priority) {
		this(priority, null, null);
	}
}
