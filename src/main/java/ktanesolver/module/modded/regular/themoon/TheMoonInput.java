package ktanesolver.module.modded.regular.themoon;

import ktanesolver.logic.ModuleInput;

public record TheMoonInput(Direction firstLitPosition) implements ModuleInput {
	public enum Direction { NORTH, NORTHEAST, EAST, SOUTHEAST, SOUTH, SOUTHWEST, WEST, NORTHWEST }
}
