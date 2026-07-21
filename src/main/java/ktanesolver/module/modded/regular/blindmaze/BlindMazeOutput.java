package ktanesolver.module.modded.regular.blindmaze;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record BlindMazeOutput(
	int mazeNumber,
	int rotationRule,
	String rotation,
	int startRow,
	int startColumn,
	List<Direction> moves
) implements ModuleOutput {
	public enum Direction { NORTH, EAST, SOUTH, WEST }
}
