
package ktanesolver.module.modded.regular.mouseinthemaze;

import ktanesolver.logic.ModuleInput;
import ktanesolver.module.vanilla.regular.maze.Cell;

public record MouseInTheMazeInput(
	int mazeIndex,
	SphereColor torusColor,
	Cell start,
	Direction startDirection
) implements ModuleInput {
}
