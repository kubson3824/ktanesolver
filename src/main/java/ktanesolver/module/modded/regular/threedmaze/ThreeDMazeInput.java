package ktanesolver.module.modded.regular.threedmaze;

import java.util.List;

import ktanesolver.logic.ModuleInput;

/**
 * Input for the 3D Maze module: the three maze-identifying letters, optional goal direction (N/S/E/W),
 * and current position via either explicit coordinates or an observed symbol plus ordered wall distances.
 * <p>
 * stepsToWall is [front, right, behind, left] relative to the defuser. The solver infers both position and facing,
 * so the user does not need to know compass direction.
 * <p>
 * When goal direction is omitted, solver returns path to nearest direction marker (star); when provided, returns path to goal wall.
 */
public record ThreeDMazeInput(
	List<String> starLetters,
	String goalDirection,
	Integer currentRow,
	Integer currentCol,
	String currentFacing,
	String letterAtPosition,
	int[] stepsToWall
) implements ModuleInput {
	public boolean hasExactPosition() {
		return currentRow != null && currentCol != null && currentFacing != null;
	}

	/** True if position is to be resolved from symbol plus [front, right, behind, left] distances. */
	public boolean useDistanceIdentification() {
		return stepsToWall != null && stepsToWall.length == 4;
	}
}
