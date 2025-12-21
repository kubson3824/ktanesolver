
package ktanesolver.module.vanilla.regular.maze;

import java.util.Set;

public class MazeDefinitions {
	public static final Maze MAZE_1 = new Maze(
		Set.of(new Cell(2, 1), new Cell(3, 6)),
		new boolean[][] {
			{false, false, true, false, false},
			{true, false, true, false, false},
			{true, false, true, false, false},
			{true, false, false, true, false},
			{false, false, true, false, true},
			{false, true, false, true, false}
		},
		new boolean[][] {
			{false, true, false, false, true, true},
			{false, false, true, true, true, false},
			{false, true, false, false, true, false},
			{false, true, true, true, true, false},
			{false, true, false, false, true, false}
		}
	);

	public static final Maze MAZE_2 = new Maze(
		Set.of(new Cell(2, 5), new Cell(4, 2)),
		new boolean[][] {
			{false, false, true, false, false},
			{false, true, false, true, false},
			{true, false, true, false, false},
			{false, true, false, true, true},
			{true, true, true, false, true},
			{true, false, true, false, false}
		},
		new boolean[][] {
			{true, false, true, false, false, true},
			{false, true, false, true, true, false},
			{false, false, true, false, true, false},
			{false, true, false, true, false, false},
			{false, false, false, false, true, false}
		}
	);

	public static final Maze MAZE_3 = new Maze(
		Set.of(new Cell(4, 4), new Cell(4, 6)),
		new boolean[][] {
			{false, false, true, true, false},
			{true, true, true, false, true},
			{false, true, true, false, true},
			{true, true, true, true, true},
			{true, false, true, true, true},
			{false, false, false, true, false}
		},
		new boolean[][] {
			{false, true, false, false, false, false},
			{true, false, false, true, true, false},
			{false, false, false, false, false, false},
			{false, false, false, false, false, false},
			{false, true, true, false, false, false}
		}
	);

	public static final Maze MAZE_4 = new Maze(
		Set.of(new Cell(1, 1), new Cell(4, 1)),
		new boolean[][] {
			{false, true, false, false, false},
			{true, true, false, false, false},
			{true, false, true, false, true},
			{true, false, false, false, false},
			{false, false, false, false, true},
			{false, false, true, false, true}
		},
		new boolean[][] {
			{false, false, true, true, true, false},
			{false, false, false, true, true, false},
			{false, true, true, false, true, false},
			{false, true, true, true, true, false},
			{false, true, true, true, false, false}
		}
	);

	public static final Maze MAZE_5 = new Maze(
		Set.of(new Cell(3, 5), new Cell(6, 4)),
		new boolean[][] {
			{false, false, false, false, false},
			{false, false, false, false, true},
			{false, true, false, true, false},
			{true, false, false, true, true},
			{true, false, false, false, true},
			{true, false, false, false, false}
		},
		new boolean[][] {
			{true, true, true, true, false, false},
			{false, true, true, false, true, true},
			{false, false, true, true, false, false},
			{false, true, true, false, true, false},
			{false, false, true, true, true, false}
		}
	);

	public static final Maze MAZE_6 = new Maze(
		Set.of(new Cell(1, 5), new Cell(5, 3)),
		new boolean[][] {
			{true, false, true, false, false},
			{true, true, true, false, true},
			{false, true, true, true, false},
			{false, true, false, true, true},
			{false, true, true, true, false},
			{false, false, false, true, false}
		},
		new boolean[][] {
			{false, false, false, true, false, false},
			{false, false, false, false, true, false},
			{false, true, true, false, false, true},
			{true, false, false, false, false, false},
			{false, true, true, false, true, false}
		}
	);

	public static final Maze MAZE_7 = new Maze(
		Set.of(new Cell(1, 2), new Cell(6, 2)),
		new boolean[][] {
			{false, false, false, true, false},
			{true, false, true, false, true},
			{false, true, false, true, false},
			{false, true, false, false, true},
			{true, true, false, false, true},
			{false, false, false, false, false}
		},
		new boolean[][] {
			{false, true, true, false, false, false},
			{false, false, true, true, true, false},
			{true, true, false, true, false, true},
			{false, false, false, true, true, false},
			{false, true, true, true, false, false}
		}
	);

	public static final Maze MAZE_8 = new Maze(
		Set.of(new Cell(1, 4), new Cell(4, 3)),
		new boolean[][] {
			{true, false, false, true, false},
			{false, false, true, false, true},
			{true, false, false, false, true},
			{true, false, true, false, false},
			{true, true, false, false, false},
			{false, false, false, false, false}
		},
		new boolean[][] {
			{false, false, true, false, false, false},
			{false, true, true, true, true, false},
			{false, false, true, true, false, false},
			{false, true, false, true, true, true},
			{false, false, true, true, true, true}
		}
	);

	public static final Maze MAZE_9 = new Maze(
		Set.of(new Cell(2, 3), new Cell(5, 1)),
		new boolean[][] {
			{true, false, false, false, false},
			{true, true, false, true, true},
			{false, false, true, false, true},
			{true, true, false, true, false},
			{true, true, true, false, true},
			{false, true, false, true, false}
		},
		new boolean[][] {
			{false, false, true, true, false, false},
			{false, false, false, true, false, false},
			{false, true, true, false, true, false},
			{false, false, false, true, true, false},
			{false, false, false, false, false, true}
		}
	);
}
