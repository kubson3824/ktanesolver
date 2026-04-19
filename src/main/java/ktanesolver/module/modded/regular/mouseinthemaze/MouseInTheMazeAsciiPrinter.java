package ktanesolver.module.modded.regular.mouseinthemaze;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import ktanesolver.module.shared.grid.Cell;

public final class MouseInTheMazeAsciiPrinter {

	private static final int ROWS = 10;
	private static final int COLS = 10;

	private MouseInTheMazeAsciiPrinter() {
	}

	public static void main(String[] args) {
		for (int i = 1; i <= 6; i++) {
			System.out.println("Maze " + i);
			MouseInTheMazeMaze maze = MouseInTheMazeDefinitions.getMaze(i);
			for (String line : render(maze)) {
				System.out.println(line);
			}
			System.out.println();
		}
	}

	public static List<String> render(MouseInTheMazeMaze maze) {
		char[][] grid = new char[ROWS * 2 + 1][COLS * 2 + 1];
		for (char[] row : grid) {
			Arrays.fill(row, '#');
		}

		boolean[][] h = maze.horizontalWalls();
		boolean[][] v = maze.verticalWalls();
		Map<SphereColor, Cell> spherePositions = maze.spherePositions();

		for (int r = 0; r < ROWS; r++) {
			for (int c = 0; c < COLS; c++) {
				int ar = 2 * r + 1;
				int ac = 2 * c + 1;
				Cell cell1Based = new Cell(r + 1, c + 1);
				grid[ar][ac] = sphereCharAt(spherePositions, cell1Based);

				if (c < COLS - 1 && !v[r][c]) {
					grid[ar][ac + 1] = ' ';
				}
				if (r < ROWS - 1 && !h[r][c]) {
					grid[ar + 1][ac] = ' ';
				}
			}
		}

		List<String> lines = new ArrayList<>(grid.length);
		for (char[] row : grid) {
			StringBuilder builder = new StringBuilder(row.length * 2);
			for (char ch : row) {
				builder.append(ch).append(ch);
			}
			lines.add(builder.toString());
		}
		return lines;
	}

	private static char sphereCharAt(Map<SphereColor, Cell> spherePositions, Cell cell) {
		for (Map.Entry<SphereColor, Cell> e : spherePositions.entrySet()) {
			if (e.getValue().equals(cell)) {
				return e.getKey().name().charAt(0);
			}
		}
		return ' ';
	}
}
