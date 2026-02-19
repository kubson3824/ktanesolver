package ktanesolver.module.modded.regular.turnthekeys;

import ktanesolver.logic.ModuleOutput;

public record TurnTheKeysOutput(String leftKeyInstruction, String rightKeyInstruction, int priority,
	boolean canTurnRightKey, boolean canTurnLeftKey, boolean rightKeyTurned, boolean leftKeyTurned) implements ModuleOutput {
}
