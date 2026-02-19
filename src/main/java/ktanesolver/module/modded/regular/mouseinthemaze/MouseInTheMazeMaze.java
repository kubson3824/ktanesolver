
package ktanesolver.module.modded.regular.mouseinthemaze;

import java.util.Map;

import ktanesolver.module.vanilla.regular.maze.Cell;

/**
 * 10×10 cell grid with walls between cells.
 * horizontalWalls[r][c] = wall between (r+1, c+1) and (r+2, c+1); dimensions 9×10.
 * verticalWalls[r][c] = wall between (r+1, c+1) and (r+1, c+2); dimensions 10×9.
 */
public record MouseInTheMazeMaze(
	boolean[][] horizontalWalls,
	boolean[][] verticalWalls,
	Map<SphereColor, Cell> spherePositions
) {
}
