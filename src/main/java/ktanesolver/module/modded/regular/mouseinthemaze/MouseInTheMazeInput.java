package ktanesolver.module.modded.regular.mouseinthemaze;

import ktanesolver.logic.ModuleInput;
import ktanesolver.module.vanilla.regular.maze.Cell;

/**
 * Either (mazeIndex, start) for legacy flow, or (sphereColorAtPosition, stepsToWall) for sphere-based identification.
 * When sphereColorAtPosition and stepsToWall (length 4) are present, maze and start are resolved from the lookup.
 */
public record MouseInTheMazeInput(
	Integer mazeIndex,
	SphereColor torusColor,
	Cell start,
	Direction startDirection,
	SphereColor sphereColorAtPosition,
	int[] stepsToWall
) implements ModuleInput {

	/** True if this input uses sphere + wall-steps identification instead of explicit maze/start. */
	public boolean useSphereIdentification() {
		return sphereColorAtPosition != null && stepsToWall != null && stepsToWall.length == 4;
	}
}
