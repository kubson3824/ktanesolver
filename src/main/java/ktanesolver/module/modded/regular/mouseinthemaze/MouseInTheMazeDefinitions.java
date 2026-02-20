
package ktanesolver.module.modded.regular.mouseinthemaze;

import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import ktanesolver.module.vanilla.regular.maze.Cell;

/**
 * Six mazes (10×10 grid) and their torus→sphere tables.
 * <p>
 * To add walls, use 1-based row/column (1–10) in the helper methods:
 * <ul>
 *   <li>{@code wallBetweenRows(h, row, col)} — single wall between row and row+1 at column col</li>
 *   <li>{@code wallBetweenRows(h, row, colFrom, colTo)} — wall between row and row+1 from col colFrom to colTo (inclusive)</li>
 *   <li>{@code wallBetweenCols(v, row, col)} — single wall between column col and col+1 at row row</li>
 *   <li>{@code wallBetweenCols(v, rowFrom, rowTo, col)} — wall between col and col+1 from row rowFrom to rowTo (inclusive)</li>
 * </ul>
 * Example: wall between row 1 and 2 from col 1 to 6 is {@code wallBetweenRows(h, 1, 1, 6);}
 */
public final class MouseInTheMazeDefinitions {

	// --- Maze 1 (GBWY): sphere positions from manual ---
	private static Map<SphereColor, Cell> spherePositionsMaze1() {
		Map<SphereColor, Cell> m = new EnumMap<>(SphereColor.class);
		m.put(SphereColor.GREEN, new Cell(3, 3));
		m.put(SphereColor.BLUE, new Cell(3, 8));
		m.put(SphereColor.WHITE, new Cell(8, 3));
		m.put(SphereColor.YELLOW, new Cell(8, 8));
		return m;
	}

	// --- Maze 2 (WYBG) ---
	private static Map<SphereColor, Cell> spherePositionsMaze2() {
		Map<SphereColor, Cell> m = new EnumMap<>(SphereColor.class);
		m.put(SphereColor.WHITE, new Cell(3, 3));
		m.put(SphereColor.YELLOW, new Cell(3, 8));
		m.put(SphereColor.BLUE, new Cell(8, 3));
		m.put(SphereColor.GREEN, new Cell(8, 8));
		return m;
	}

	// --- Maze 3 (GBYW) ---
	private static Map<SphereColor, Cell> spherePositionsMaze3() {
		Map<SphereColor, Cell> m = new EnumMap<>(SphereColor.class);
		m.put(SphereColor.GREEN, new Cell(3, 3));
		m.put(SphereColor.BLUE, new Cell(3, 8));
		m.put(SphereColor.YELLOW, new Cell(8, 3));
		m.put(SphereColor.WHITE, new Cell(8, 8));
		return m;
	}

	// --- Maze 4 (YWGB) ---
	private static Map<SphereColor, Cell> spherePositionsMaze4() {
		Map<SphereColor, Cell> m = new EnumMap<>(SphereColor.class);
		m.put(SphereColor.YELLOW, new Cell(3, 3));
		m.put(SphereColor.WHITE, new Cell(3, 8));
		m.put(SphereColor.GREEN, new Cell(8, 3));
		m.put(SphereColor.BLUE, new Cell(8, 8));
		return m;
	}

	// --- Maze 5 (YGBW) ---
	private static Map<SphereColor, Cell> spherePositionsMaze5() {
		Map<SphereColor, Cell> m = new EnumMap<>(SphereColor.class);
		m.put(SphereColor.YELLOW, new Cell(3, 3));
		m.put(SphereColor.GREEN, new Cell(3, 8));
		m.put(SphereColor.BLUE, new Cell(8, 3));
		m.put(SphereColor.WHITE, new Cell(8, 8));
		return m;
	}

	// --- Maze 6 (BYGW) ---
	private static Map<SphereColor, Cell> spherePositionsMaze6() {
		Map<SphereColor, Cell> m = new EnumMap<>(SphereColor.class);
		m.put(SphereColor.BLUE, new Cell(3, 3));
		m.put(SphereColor.YELLOW, new Cell(3, 8));
		m.put(SphereColor.GREEN, new Cell(8, 3));
		m.put(SphereColor.WHITE, new Cell(8, 8));
		return m;
	}

	// --- Walls (all 1-based row/col 1–10). Use helpers below so you don't deal with 0-based indices. ---

	/** Wall between row and row+1 at column col. row 1–9, col 1–10. */
	private static void wallBetweenRows(boolean[][] h, int row, int col) {
		if(row >= 1 && row <= 9 && col >= 1 && col <= 10)
			h[row - 1][col - 1] = true;
	}

	/** Wall between row and row+1 from column colFrom to colTo (inclusive). row 1–9, cols 1–10. */
	private static void wallBetweenRows(boolean[][] h, int row, int colFrom, int colTo) {
		for(int c = colFrom; c <= colTo; c++)
			wallBetweenRows(h, row, c);
	}

	/** Wall between column col and col+1 at row row. row 1–10, col 1–9. */
	private static void wallBetweenCols(boolean[][] v, int col, int row) {
		if (row >= 1 && row <= 10 && col >= 1 && col <= 9) v[row - 1][col - 1] = true;
	}

	/** Wall between column col and col+1 from row rowFrom to rowTo (inclusive). rows 1–10, col 1–9. */
	private static void wallBetweenCols(boolean[][] v, int col, int rowFrom, int rowTo) {
		for(int r = rowFrom; r <= rowTo; r++)
			wallBetweenCols(v, col, r);
	}

	private static boolean[][] createHorizontalWalls() {
		boolean[][] h = new boolean[9][10];
		for(int r = 0; r < h.length; r++) {
			Arrays.fill(h[r], false);
		}
		return h;
	}

	private static boolean[][] createVerticalWalls() {
		boolean[][] v = new boolean[10][9];
		for(int r = 0; r < v.length; r++) {
			Arrays.fill(v[r], false);
		}
		return v;
	}

	private static boolean[][] horizontalWalls1() {
		boolean[][] h = createHorizontalWalls();
		wallBetweenRows(h, 1, 1, 2);   // row 1–2: cols 1–2
		wallBetweenRows(h, 1, 4);   // row 1–2: col 4
		wallBetweenRows(h, 1, 6);   // row 1–2: col 6
		wallBetweenRows(h, 1, 8, 9);   // row 1–2: cols 8–9
		wallBetweenRows(h, 2, 3);   // row 2–3: col 3
		wallBetweenRows(h, 2, 5, 6);   // row 2–3: col 3
		wallBetweenRows(h, 2, 9, 10);  // row 2–3: cols 9–10
		wallBetweenRows(h, 3, 4, 7); // row 3–4: col 10
		wallBetweenRows(h, 3, 9); // row 3–4: col 10
		wallBetweenRows(h, 4, 4, 5); // row 3–4: col 10
		wallBetweenRows(h, 5, 1, 2); // row 3–4: col 10
		wallBetweenRows(h, 5, 9, 10); // row 3–4: col 10
		wallBetweenRows(h, 6, 2, 3); // row 3–4: col 10
		wallBetweenRows(h, 6, 6, 9); // row 3–4: col 10
		wallBetweenRows(h, 7, 4, 6); // row 3–4: col 10
		wallBetweenRows(h, 7, 9, 10); // row 3–4: col 10
		wallBetweenRows(h, 8, 4, 5); // row 3–4: col 10
		wallBetweenRows(h, 8, 7, 9); // row 3–4: col 10
		wallBetweenRows(h, 9, 2); // row 3–4: col 10
		wallBetweenRows(h, 9, 5, 6); // row 3–4: col 10
		wallBetweenRows(h, 9, 8, 10); // row 3–4: col 10
		return h;
	}

	private static boolean[][] verticalWalls1() {
		boolean[][] v = createVerticalWalls();
		wallBetweenCols(v,1,2,4);
		wallBetweenCols(v,1,7,9);
		wallBetweenCols(v,2,2,2);
		wallBetweenCols(v,2,4,5);
		wallBetweenCols(v,2,8,9);
		wallBetweenCols(v,3,3,3);
		wallBetweenCols(v,3,5,6);
		wallBetweenCols(v,3,9,10);
		wallBetweenCols(v,4,2,2);
		wallBetweenCols(v,4,6,7);
		wallBetweenCols(v,4,9,9);
		wallBetweenCols(v,5,1,1);
		wallBetweenCols(v,5,5,5);
		wallBetweenCols(v,6,2,2);
		wallBetweenCols(v,6,4,5);
		wallBetweenCols(v,6,8,9);
		wallBetweenCols(v,7,2,3);
		wallBetweenCols(v,7,5,7);
		wallBetweenCols(v,8,4,5);
		wallBetweenCols(v,9,4,4);
		// wallBetweenCols(v, row, col) = wall between col and col+1 at row row
		// e.g. wallBetweenCols(v, 1, 1);  // between col 1 and 2 at row 1
		return v;
	}

	private static boolean[][] horizontalWalls2() {
		boolean[][] h = createHorizontalWalls();
		wallBetweenRows(h, 1, 2);
		wallBetweenRows(h, 1, 5, 7);
		wallBetweenRows(h, 1, 9);
		wallBetweenRows(h, 2, 1);
		wallBetweenRows(h, 2, 4);
		wallBetweenRows(h, 2, 7, 8);
		wallBetweenRows(h, 2, 10);
		wallBetweenRows(h, 3, 3, 4);
		wallBetweenRows(h, 3, 8, 9);
		wallBetweenRows(h, 4, 2);
		wallBetweenRows(h, 4, 4, 6);
		wallBetweenRows(h, 4, 10);
		wallBetweenRows(h, 5, 1);
		wallBetweenRows(h, 5, 3, 4);
		wallBetweenRows(h, 5, 6);
		wallBetweenRows(h, 5, 9);
		wallBetweenRows(h, 6, 2);
		wallBetweenRows(h, 6, 5);
		wallBetweenRows(h, 6, 7);
		wallBetweenRows(h, 6, 9);
		wallBetweenRows(h, 7, 1, 2);
		wallBetweenRows(h, 7, 4, 5);
		wallBetweenRows(h, 7, 7, 8);
		wallBetweenRows(h, 8, 3, 5);
		wallBetweenRows(h, 8, 9, 10);
		wallBetweenRows(h, 9, 2, 6);
		wallBetweenRows(h, 9, 9);
		return h;
	}

	private static boolean[][] verticalWalls2() {
		boolean[][] v = createVerticalWalls();
		wallBetweenCols(v, 1, 3, 4);
		wallBetweenCols(v, 1, 9);
		wallBetweenCols(v, 2, 2, 3);
		wallBetweenCols(v, 2, 5, 6);
		wallBetweenCols(v, 2, 8);
		wallBetweenCols(v, 3, 1, 2);
		wallBetweenCols(v, 3, 7);
		wallBetweenCols(v, 5, 3, 4);
		wallBetweenCols(v, 5, 6);
		wallBetweenCols(v, 5, 8);
		wallBetweenCols(v, 6, 4, 5);
		wallBetweenCols(v, 6, 7, 9);
		wallBetweenCols(v, 7, 1);
		wallBetweenCols(v, 7, 3);
		wallBetweenCols(v, 7, 5, 6);
		wallBetweenCols(v, 7, 9, 10);
		wallBetweenCols(v, 8, 2);
		wallBetweenCols(v, 8, 4, 5);
		wallBetweenCols(v, 8, 9);
		wallBetweenCols(v, 9, 7, 8);
		return v;
	}

	private static boolean[][] horizontalWalls3() {
		boolean[][] h = createHorizontalWalls();
		wallBetweenRows(h, 1, 2, 3);
		wallBetweenRows(h, 1, 7);
		wallBetweenRows(h, 1, 10);
		wallBetweenRows(h, 2, 1, 3);
		wallBetweenRows(h, 2, 8, 9);
		wallBetweenRows(h, 3, 2, 3);
		wallBetweenRows(h, 3, 5);
		wallBetweenRows(h, 3, 7);
		wallBetweenRows(h, 3, 10);
		wallBetweenRows(h, 4, 3, 4);
		wallBetweenRows(h, 4, 6, 9);
		wallBetweenRows(h, 5, 2, 4);
		wallBetweenRows(h, 5, 6, 7);
		wallBetweenRows(h, 5, 9, 10);
		wallBetweenRows(h, 6, 1, 3);
		wallBetweenRows(h, 6, 10);
		wallBetweenRows(h, 7, 2, 3);
		wallBetweenRows(h, 7, 6);
		wallBetweenRows(h, 7, 9);
		wallBetweenRows(h, 8, 5, 8);
		wallBetweenRows(h, 9, 2);
		wallBetweenRows(h, 9, 9);
		return h;
	}

	private static boolean[][] verticalWalls3() {
		boolean[][] v = createVerticalWalls();
		wallBetweenCols(v, 1, 4, 5);
		wallBetweenCols(v, 1, 8, 9);
		wallBetweenCols(v, 2, 9);
		wallBetweenCols(v, 3, 2);
		wallBetweenCols(v, 3, 8, 10);
		wallBetweenCols(v, 4, 1);
		wallBetweenCols(v, 4, 3, 4);
		wallBetweenCols(v, 4, 6, 9);
		wallBetweenCols(v, 5, 2, 3);
		wallBetweenCols(v, 5, 6, 7);
		wallBetweenCols(v, 5, 10);
		wallBetweenCols(v, 6, 2, 3);
		wallBetweenCols(v, 6, 7);
		wallBetweenCols(v, 6, 9);
		wallBetweenCols(v, 7, 3);
		wallBetweenCols(v, 7, 6, 8);
		wallBetweenCols(v, 7, 10);
		wallBetweenCols(v, 8, 1, 4);
		wallBetweenCols(v, 8, 6, 7);
		wallBetweenCols(v, 8, 9);
		wallBetweenCols(v, 9, 8);
		return v;
	}

	private static boolean[][] horizontalWalls4() {
		boolean[][] h = createHorizontalWalls();
		wallBetweenRows(h, 1, 2, 3);
		wallBetweenRows(h, 1, 6, 7);
		wallBetweenRows(h, 1, 9);
		wallBetweenRows(h, 2, 3);
		wallBetweenRows(h, 2, 7, 8);
		wallBetweenRows(h, 3, 2, 5);
		wallBetweenRows(h, 3, 10);
		wallBetweenRows(h, 4, 1, 4);
		wallBetweenRows(h, 4, 8, 9);
		wallBetweenRows(h, 5, 2, 3);
		wallBetweenRows(h, 5, 7, 9);
		wallBetweenRows(h, 6, 3, 4);
		wallBetweenRows(h, 6, 6, 8);
		wallBetweenRows(h, 7, 1);
		wallBetweenRows(h, 7, 3, 5);
		wallBetweenRows(h, 7, 7);
		wallBetweenRows(h, 7, 9);
		wallBetweenRows(h, 8, 2, 3);
		wallBetweenRows(h, 8, 6, 9);
		wallBetweenRows(h, 9, 9, 10);
		return h;
	}

	private static boolean[][] verticalWalls4() {
		boolean[][] v = createVerticalWalls();
		wallBetweenCols(v, 1, 2, 3);
		wallBetweenCols(v, 1, 6);
		wallBetweenCols(v, 1, 9);
		wallBetweenCols(v, 2, 5);
		wallBetweenCols(v, 2, 10);
		wallBetweenCols(v, 3, 3);
		wallBetweenCols(v, 3, 9);
		wallBetweenCols(v, 4, 1, 2);
		wallBetweenCols(v, 4, 5, 6);
		wallBetweenCols(v, 4, 9, 10);
		wallBetweenCols(v, 5, 2, 9);
		wallBetweenCols(v, 6, 4, 5);
		wallBetweenCols(v, 6, 10);
		wallBetweenCols(v, 7, 4);
		wallBetweenCols(v, 7, 7);
		wallBetweenCols(v, 7, 9);
		wallBetweenCols(v, 8, 2, 3);
		wallBetweenCols(v, 9, 2);
		wallBetweenCols(v, 9, 4);
		wallBetweenCols(v, 9, 6, 7);
		return v;
	}

	private static boolean[][] horizontalWalls5() {
		boolean[][] h = createHorizontalWalls();
		wallBetweenRows(h, 1, 2, 4);
		wallBetweenRows(h, 1, 8, 9);
		wallBetweenRows(h, 2, 2, 3);
		wallBetweenRows(h, 2, 5, 6);
		wallBetweenRows(h, 2, 8);
		wallBetweenRows(h, 3, 1, 2);
		wallBetweenRows(h, 3, 4, 7);
		wallBetweenRows(h, 3, 10);
		wallBetweenRows(h, 4, 3);
		wallBetweenRows(h, 4, 5, 8);
		wallBetweenRows(h, 5, 3, 5);
		wallBetweenRows(h, 5, 8);
		wallBetweenRows(h, 6, 4);
		wallBetweenRows(h, 6, 9);
		wallBetweenRows(h, 7, 3);
		wallBetweenRows(h, 7, 7);
		wallBetweenRows(h, 7, 9, 10);
		wallBetweenRows(h, 8, 2, 4);
		wallBetweenRows(h, 9, 2, 5);
		return h;
	}

	private static boolean[][] verticalWalls5() {
		boolean[][] v = createVerticalWalls();
		wallBetweenCols(v, 1, 5, 8);
		wallBetweenCols(v, 2, 6, 7);
		wallBetweenCols(v, 3, 3, 4);
		wallBetweenCols(v, 4, 2);
		wallBetweenCols(v, 4, 5);
		wallBetweenCols(v, 4, 7, 8);
		wallBetweenCols(v, 5, 1);
		wallBetweenCols(v, 5, 6, 9);
		wallBetweenCols(v, 6, 1, 2);
		wallBetweenCols(v, 6, 5, 6);
		wallBetweenCols(v, 6, 8, 9);
		wallBetweenCols(v, 7, 3);
		wallBetweenCols(v, 7, 6, 7);
		wallBetweenCols(v, 7, 9, 10);
		wallBetweenCols(v, 8, 3, 5);
		wallBetweenCols(v, 8, 7, 9);
		wallBetweenCols(v, 9, 2, 3);
		wallBetweenCols(v, 9, 5, 6);
		wallBetweenCols(v, 9, 9, 10);
		return v;
	}

	private static boolean[][] horizontalWalls6() {
		boolean[][] h = createHorizontalWalls();
		wallBetweenRows(h, 1, 3);
		wallBetweenRows(h, 1, 5);
		wallBetweenRows(h, 1, 8, 9);
		wallBetweenRows(h, 2, 4);
		wallBetweenRows(h, 2, 6, 7);
		wallBetweenRows(h, 3, 2, 3);
		wallBetweenRows(h, 3, 5, 6);
		wallBetweenRows(h, 3, 8);
		wallBetweenRows(h, 4, 3, 4);
		wallBetweenRows(h, 4, 7);
		wallBetweenRows(h, 4, 9);
		wallBetweenRows(h, 5, 1);
		wallBetweenRows(h, 5, 7, 8);
		wallBetweenRows(h, 5, 10);
		wallBetweenRows(h, 6, 3);
		wallBetweenRows(h, 6, 6);
		wallBetweenRows(h, 6, 8, 9);
		wallBetweenRows(h, 7, 2, 5);
		wallBetweenRows(h, 7, 7);
		wallBetweenRows(h, 8, 3);
		wallBetweenRows(h, 8, 5, 6);
		wallBetweenRows(h, 8, 9);
		wallBetweenRows(h, 9, 2);
		wallBetweenRows(h, 9, 4, 5);
		wallBetweenRows(h, 9, 8, 9);
		return h;
	}

	private static boolean[][] verticalWalls6() {
		boolean[][] v = createVerticalWalls();
		wallBetweenCols(v, 1, 2, 3);
		wallBetweenCols(v, 1, 5);
		wallBetweenCols(v, 1, 7, 9);
		wallBetweenCols(v, 2, 1, 2);
		wallBetweenCols(v, 2, 4, 6);
		wallBetweenCols(v, 3, 3);
		wallBetweenCols(v, 3, 6);
		wallBetweenCols(v, 3, 8, 9);
		wallBetweenCols(v, 4, 2);
		wallBetweenCols(v, 4, 6, 7);
		wallBetweenCols(v, 5, 4, 6);
		wallBetweenCols(v, 6, 1, 2);
		wallBetweenCols(v, 6, 7);
		wallBetweenCols(v, 6, 9, 10);
		wallBetweenCols(v, 7, 4);
		wallBetweenCols(v, 7, 6);
		wallBetweenCols(v, 7, 8, 9);
		wallBetweenCols(v, 8, 2, 3);
		wallBetweenCols(v, 8, 5);
		wallBetweenCols(v, 8, 7, 8);
		wallBetweenCols(v, 9, 3, 4);
		wallBetweenCols(v, 9, 6, 7);
		return v;
	}

	private static MouseInTheMazeMaze maze1() {
		return new MouseInTheMazeMaze(horizontalWalls1(), verticalWalls1(), spherePositionsMaze1());
	}

	private static MouseInTheMazeMaze maze2() {
		return new MouseInTheMazeMaze(horizontalWalls2(), verticalWalls2(), spherePositionsMaze2());
	}

	private static MouseInTheMazeMaze maze3() {
		return new MouseInTheMazeMaze(horizontalWalls3(), verticalWalls3(), spherePositionsMaze3());
	}

	private static MouseInTheMazeMaze maze4() {
		return new MouseInTheMazeMaze(horizontalWalls4(), verticalWalls4(), spherePositionsMaze4());
	}

	private static MouseInTheMazeMaze maze5() {
		return new MouseInTheMazeMaze(horizontalWalls5(), verticalWalls5(), spherePositionsMaze5());
	}

	private static MouseInTheMazeMaze maze6() {
		return new MouseInTheMazeMaze(horizontalWalls6(), verticalWalls6(), spherePositionsMaze6());
	}

	/** Torus color → target sphere color for each maze (1–6). */
	private static Map<SphereColor, SphereColor> table1() {
		Map<SphereColor, SphereColor> m = new EnumMap<>(SphereColor.class);
		m.put(SphereColor.BLUE, SphereColor.WHITE);
		m.put(SphereColor.YELLOW, SphereColor.YELLOW);
		m.put(SphereColor.WHITE, SphereColor.GREEN);
		m.put(SphereColor.GREEN, SphereColor.BLUE);
		return m;
	}

	private static Map<SphereColor, SphereColor> table2() {
		Map<SphereColor, SphereColor> m = new EnumMap<>(SphereColor.class);
		m.put(SphereColor.YELLOW, SphereColor.BLUE);
		m.put(SphereColor.WHITE, SphereColor.YELLOW);
		m.put(SphereColor.BLUE, SphereColor.WHITE);
		m.put(SphereColor.GREEN, SphereColor.GREEN);
		return m;
	}

	private static Map<SphereColor, SphereColor> table3() {
		Map<SphereColor, SphereColor> m = new EnumMap<>(SphereColor.class);
		m.put(SphereColor.WHITE, SphereColor.GREEN);
		m.put(SphereColor.BLUE, SphereColor.YELLOW);
		m.put(SphereColor.GREEN, SphereColor.BLUE);
		m.put(SphereColor.YELLOW, SphereColor.WHITE);
		return m;
	}

	private static Map<SphereColor, SphereColor> table4() {
		Map<SphereColor, SphereColor> m = new EnumMap<>(SphereColor.class);
		m.put(SphereColor.WHITE, SphereColor.BLUE);
		m.put(SphereColor.YELLOW, SphereColor.YELLOW);
		m.put(SphereColor.BLUE, SphereColor.GREEN);
		m.put(SphereColor.GREEN, SphereColor.WHITE);
		return m;
	}

	private static Map<SphereColor, SphereColor> table5() {
		Map<SphereColor, SphereColor> m = new EnumMap<>(SphereColor.class);
		m.put(SphereColor.WHITE, SphereColor.YELLOW);
		m.put(SphereColor.GREEN, SphereColor.WHITE);
		m.put(SphereColor.YELLOW, SphereColor.BLUE);
		m.put(SphereColor.BLUE, SphereColor.GREEN);
		return m;
	}

	private static Map<SphereColor, SphereColor> table6() {
		Map<SphereColor, SphereColor> m = new EnumMap<>(SphereColor.class);
		m.put(SphereColor.WHITE, SphereColor.BLUE);
		m.put(SphereColor.BLUE, SphereColor.GREEN);
		m.put(SphereColor.GREEN, SphereColor.YELLOW);
		m.put(SphereColor.YELLOW, SphereColor.WHITE);
		return m;
	}

	public static final List<MouseInTheMazeMaze> MAZES = List.of(maze1(), maze2(), maze3(), maze4(), maze5(), maze6());

	public static final List<Map<SphereColor, SphereColor>> TORUS_TO_SPHERE = List.of(table1(), table2(), table3(), table4(), table5(), table6());

	public static MouseInTheMazeMaze getMaze(int mazeIndex) {
		if(mazeIndex < 1 || mazeIndex > 6) {
			throw new IllegalArgumentException("mazeIndex must be 1–6, got " + mazeIndex);
		}
		return MAZES.get(mazeIndex - 1);
	}

	public static SphereColor getTargetSphere(int mazeIndex, SphereColor torusColor) {
		return TORUS_TO_SPHERE.get(mazeIndex - 1).get(torusColor);
	}

	private MouseInTheMazeDefinitions() {
	}
}
