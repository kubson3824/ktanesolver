
package ktanesolver.module.modded.regular.mouseinthemaze;

import java.util.List;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.vanilla.regular.maze.Cell;

public record MouseInTheMazeOutput(
	SphereColor targetSphereColor,
	Cell targetCell,
	List<MouseMove> moves,
	MouseInTheMazeMaze maze,
	/** Start cell used for pathfinding (enables path display when maze was identified from sphere + distances). */
	Cell startCell
) implements ModuleOutput {
}
