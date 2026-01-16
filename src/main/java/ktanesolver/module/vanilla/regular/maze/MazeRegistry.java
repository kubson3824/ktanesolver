
package ktanesolver.module.vanilla.regular.maze;

import java.util.List;
import java.util.Set;

public final class MazeRegistry {

	public static final List<Maze> MAZES = List.of(
		MazeDefinitions.MAZE_1, MazeDefinitions.MAZE_2, MazeDefinitions.MAZE_3, MazeDefinitions.MAZE_4, MazeDefinitions.MAZE_5, MazeDefinitions.MAZE_6, MazeDefinitions.MAZE_7, MazeDefinitions.MAZE_8,
		MazeDefinitions.MAZE_9);

	public static Maze find(Cell m1, Cell m2) {
		return MAZES.stream().filter(m -> m.markers().containsAll(Set.of(m1, m2))).findFirst().orElseThrow(() -> new IllegalArgumentException("Unknown maze"));
	}
}
