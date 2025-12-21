
package ktanesolver.module.vanilla.regular.maze;

import java.util.Set;

public record Maze(Set<Cell> markers, boolean[][] verticalWalls, // wall between (r,c) and (r,c+1)
	boolean[][] horizontalWalls // wall between (r,c) and (r+1,c)
) {
}
