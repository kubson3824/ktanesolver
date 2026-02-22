package ktanesolver.module.modded.regular.threedmaze;

import java.util.List;

import ktanesolver.logic.ModuleInput;

/**
 * Input for the 3D Maze module: the three marker letters (identify the maze), optional goal direction (N/S/E/W),
 * and current position via (letterAtPosition, stepsToWall, currentFacing).
 * <p>
 * stepsToWall is [front, left, right, behind] relative to the defuser. When currentFacing is omitted, the solver
 * infers both position and facing from these four values (user does not need to know compass direction). When
 * currentFacing is provided, it is used directly for backward compatibility.
 * <p>
 * When goal direction is omitted, solver returns path to nearest direction marker (star); when provided, returns path to goal wall.
 */
public record ThreeDMazeInput(
	List<String> starLetters,
	String goalDirection,
	String currentFacing,
	String letterAtPosition,
	int[] stepsToWall
) implements ModuleInput {

	/** True if position is to be resolved from letter at cell + 4 relative distances (facing, left, right, behind). */
	public boolean useDistanceIdentification() {
		return stepsToWall != null && stepsToWall.length == 4;
	}
}
