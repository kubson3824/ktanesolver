package ktanesolver.module.modded.regular.threedmaze;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

/**
 * Standalone main to print all 10 3D mazes in ASCII (same idea as {@link ktanesolver.module.vanilla.regular.maze.MazeAsciiPrinter}).
 * Run this class to display each maze grid with walls and direction-marker (star) cells.
 */
public final class ThreeDMazeAsciiPrinter {

	private static final int SIZE = 8;

	private ThreeDMazeAsciiPrinter() {
	}

	public static void main(String[] args) {
		Set<String> triples = ThreeDMazeDefinitions.getKnownMazeTriples();
		List<String> ordered = new ArrayList<>(triples);
		ordered.sort(String::compareTo);
		for (String triple : ordered) {
			ThreeDMazeMaze maze = ThreeDMazeDefinitions.getMaze(triple);
			int[][] stars = maze != null ? maze.starPositions() : null;
			System.out.println("3D Maze " + triple);
			for (String line : render(maze, stars)) {
				System.out.println(line);
			}
			System.out.println();
		}
	}

	private static List<String> render(ThreeDMazeMaze maze, int[][] starPositions) {
		boolean[][] h = maze.horizontalWalls();
		boolean[][] v = maze.verticalWalls();
		String[][] letters = maze.letterGrid();
		int rows = SIZE;
		int cols = SIZE;
		char[][] grid = new char[rows * 2 + 1][cols * 2 + 1];
		for (char[] row : grid) {
			Arrays.fill(row, '#');
		}

		for (int r = 0; r < rows; r++) {
			for (int c = 0; c < cols; c++) {
				int ar = 2 * r + 1;
				int ac = 2 * c + 1;
				// Cell: letter if present, else star marker, else space
				if (letters != null && letters[r][c] != null && !letters[r][c].isEmpty()) {
					grid[ar][ac] = letters[r][c].charAt(0);
				} else if (isStarCell(starPositions, r, c)) {
					grid[ar][ac] = '*';
				} else {
					grid[ar][ac] = ' ';
				}

				// Opening to cell to the right (or wrap to column 0)
				if (c < cols - 1 && !v[r][c]) {
					grid[ar][ac + 1] = ' ';
				}
				if (c == cols - 1 && !v[r][c]) {
					grid[ar][ac + 1] = ' ';
					grid[ar][0] = ' ';
					grid[ar][cols * 2] = ' '; // wrap: opening at right edge
				}
				// Opening to cell below (or wrap to row 0)
				if (r < rows - 1 && !h[r][c]) {
					grid[ar + 1][ac] = ' ';
				}
				if (r == rows - 1 && !h[r][c]) {
					grid[ar + 1][ac] = ' ';
					grid[0][ac] = ' ';
					grid[rows * 2][ac] = ' '; // wrap: opening at bottom edge
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

	private static boolean isStarCell(int[][] starPositions, int row, int col) {
		if (starPositions == null) return false;
		for (int[] s : starPositions) {
			if (s[0] == row && s[1] == col) return true;
		}
		return false;
	}
}
