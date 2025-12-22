package ktanesolver.module.vanilla.regular.maze;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public final class MazeAsciiPrinter {

	private MazeAsciiPrinter() {}

	public static void main(String[] args) {
		List<Maze> mazes = MazeRegistry.MAZES;
		for(int i = 0; i < mazes.size(); i++) {
			System.out.println("Maze " + (i + 1));
			for(String line: render(mazes.get(i))) {
				System.out.println(line);
			}
			System.out.println();
		}
	}

	private static List<String> render(Maze maze) {
		int rows = maze.verticalWalls().length;
		int cols = maze.verticalWalls()[0].length + 1;

		char[][] grid = new char[rows * 2 + 1][cols * 2 + 1];
		for(char[] row: grid) {
			Arrays.fill(row, '#');
		}

		for(int r = 0; r < rows; r++) {
			for(int c = 0; c < cols; c++) {
				int ar = 2 * r + 1;
				int ac = 2 * c + 1;

				grid[ar][ac] = maze.markers().contains(new Cell(r + 1, c + 1)) ? 'O' : ' ';

				if(c < cols - 1 && !maze.verticalWalls()[r][c]) {
					grid[ar][ac + 1] = ' ';
				}

				if(r < rows - 1 && !maze.horizontalWalls()[r][c]) {
					grid[ar + 1][ac] = ' ';
				}
			}
		}

		List<String> lines = new ArrayList<>(grid.length);
		for(char[] row: grid) {
			StringBuilder builder = new StringBuilder(row.length * 2);
			for(char c: row) {
				builder.append(c).append(c);
			}
			lines.add(builder.toString());
		}
		return lines;
	}
}
