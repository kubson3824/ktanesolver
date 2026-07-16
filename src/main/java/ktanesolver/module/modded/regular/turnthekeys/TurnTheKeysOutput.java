package ktanesolver.module.modded.regular.turnthekeys;

import java.util.List;
import java.util.UUID;

import ktanesolver.logic.ModuleOutput;

public record TurnTheKeysOutput(String leftKeyInstruction, String rightKeyInstruction, int priority,
	boolean canTurnRightKey, boolean canTurnLeftKey, boolean rightKeyTurned, boolean leftKeyTurned,
	List<Requirement> rightKeyRequirements, List<Requirement> leftKeyRequirements) implements ModuleOutput {

	public record Requirement(UUID moduleId, String instruction) {
	}
}
