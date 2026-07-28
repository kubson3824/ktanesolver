package ktanesolver.module.modded.regular.thesun;

import ktanesolver.logic.ModuleInput;

public record TheSunInput(Direction ledPosition) implements ModuleInput {
	public enum Direction { NORTH, NORTHEAST, EAST, SOUTHEAST, SOUTH, SOUTHWEST, WEST, NORTHWEST }
}
