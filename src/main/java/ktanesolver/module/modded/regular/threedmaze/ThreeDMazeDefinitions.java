
package ktanesolver.module.modded.regular.threedmaze;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * Valid marker letters and known maze triples for the 10 mazes.
 * Goal direction is not tied to maze layout; it is provided by the user as input.
 */
public final class ThreeDMazeDefinitions {

	private static final Set<String> VALID_MARKERS = Set.of("A", "B", "C", "D", "H");
	private static final Set<String> VALID_DIRECTIONS = Set.of("N", "S", "E", "W");
	private static final int SIZE = 8;

	/** Known sorted triples (10 mazes). Used only to validate that the reported letters match a known maze. */
	private static final Set<String> KNOWN_MAZE_TRIPLES = Set.of("A,B,C", "A,B,D", "A,B,H", "A,C,D", "A,C,H", "A,D,H", "B,C,D", "B,C,H", "B,D,H", "C,D,H");

	private static final Map<String, ThreeDMazeMaze> TRIPLE_TO_MAZE = Map.ofEntries(
		Map.entry("A,B,C", abcMaze()), Map.entry("A,B,D", abdMaze()), Map.entry("A,B,H", abhMaze()), Map.entry("A,C,D", acdMaze()), Map.entry("A,C,H", achMaze()), Map.entry("A,D,H", adhMaze()),
		Map.entry("B,C,D", bcdMaze()), Map.entry("B,C,H", bchMaze()), Map.entry("B,D,H", bdhMaze()), Map.entry("C,D,H", cdhMaze()));

	// --- Wall helpers (0-based row/col 0..7). Use when building custom mazes. ---

	/** Returns a new 8×8 horizontal walls array (all false). */
	public static boolean[][] createHorizontalWalls() {
		return new boolean[SIZE][SIZE];
	}

	/** Returns a new 8×8 vertical walls array (all false). */
	public static boolean[][] createVerticalWalls() {
		return new boolean[SIZE][SIZE];
	}

	/**
	 * Wall between row and row+1 (mod 8) at each of the given columns.
	 * Row and each col in 0..7. E.g. wallBetweenRows(h, 0, 0, 2, 4, 6, 7).
	 */
	public static void wallBetweenRows(boolean[][] h, int row, int ... cols) {
		for(int c: cols) {
			if(row >= 0 && row < SIZE && c >= 0 && c < SIZE) {
				h[row][c] = true;
			}
		}
	}

	/**
	 * Wall between col and col+1 (mod 8) at each of the given rows.
	 * Col and each row in 0..7. E.g. wallBetweenCols(v, 0, 0, 1, 2, 3, 4, 5, 6, 7).
	 */
	public static void wallBetweenCols(boolean[][] v, int col, int ... rows) {
		for(int r: rows) {
			if(r >= 0 && r < SIZE && col >= 0 && col < SIZE) {
				v[r][col] = true;
			}
		}
	}

	// --- Letter and star helpers (0-based row/col 0..7) ---

	/** Returns a new empty 8×8 letter grid (all null). Use putLetters to set cells. */
	public static String[][] createLetterGrid() {
		return new String[SIZE][SIZE];
	}

	/**
	 * Sets the same letter at each (row, col) pair.
	 * rowColPairs must have even length: r0, c0, r1, c1, ... Indices in 0..7; out-of-bounds are skipped.
	 */
	public static void putLetters(String[][] letters, String letter, int ... rowColPairs) {
		for(int i = 0; i < rowColPairs.length; i += 2) {
			int r = rowColPairs[i], c = rowColPairs[i + 1];
			if(r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
				letters[r][c] = letter;
			}
		}
	}

	/** Returns the 3 star positions as int[][] {{r1,c1}, {r2,c2}, {r3,c3}}. */
	public static int[][] stars(int r1, int c1, int r2, int c2, int r3, int c3) {
		return new int[][] {{r1, c1}, {r2, c2}, {r3, c3}};
	}

	private static ThreeDMazeMaze abcMaze() {
		boolean[][] horizontalWalls = createHorizontalWalls();
		boolean[][] verticalWalls = createVerticalWalls();

		//Walls looped around
		wallBetweenRows(horizontalWalls, 7, 0, 1, 5, 6);
		//Walls looped sideways
		wallBetweenCols(verticalWalls, 7, 0, 1);

		wallBetweenRows(horizontalWalls, 0, 4);
		wallBetweenRows(horizontalWalls, 1, 1, 3, 4, 5);
		wallBetweenRows(horizontalWalls, 2, 2, 6, 7);
		wallBetweenRows(horizontalWalls, 3, 0, 3, 4, 7);
		wallBetweenRows(horizontalWalls, 4, 5);
		wallBetweenRows(horizontalWalls, 5, 2, 3, 6);
		wallBetweenRows(horizontalWalls, 6, 0, 1, 7);

		wallBetweenCols(verticalWalls, 0, 3, 4, 5, 6);
		wallBetweenCols(verticalWalls, 1, 0, 1, 5, 7);
		wallBetweenCols(verticalWalls, 2, 2, 3, 4);
		wallBetweenCols(verticalWalls, 3, 0, 6, 7);
		wallBetweenCols(verticalWalls, 4, 1, 3, 5, 6, 7);
		wallBetweenCols(verticalWalls, 5, 3);
		wallBetweenCols(verticalWalls, 6, 0, 2, 4, 6);

		int[][] stars = stars(1, 1, 3, 4, 6, 0);
		String[][] letters = createLetterGrid();
		putLetters(letters, "A", 0, 5, 1, 2, 2, 0, 4, 4, 7, 4);
		putLetters(letters, "B", 1, 7, 2, 3, 2, 5, 3, 7, 5, 1, 5, 3, 5, 6, 6, 2);
		putLetters(letters, "C", 3, 1, 7, 6);

		return new ThreeDMazeMaze(horizontalWalls, verticalWalls, stars, letters);
	}

	private static ThreeDMazeMaze abdMaze() {
		int[][] stars = stars(0, 7, 4, 2, 7, 4);
		boolean[][] horizontalWalls = createHorizontalWalls();
		boolean[][] verticalWalls = createVerticalWalls();

		//Walls looped around
		wallBetweenRows(horizontalWalls, 7, 0, 2, 6, 7);
		//Walls looped sideways
		wallBetweenCols(verticalWalls, 7, 0, 1, 4);

		wallBetweenRows(horizontalWalls, 0, 1, 2, 5);
		wallBetweenRows(horizontalWalls, 1, 3, 4, 6);
		wallBetweenRows(horizontalWalls, 2, 2);
		wallBetweenRows(horizontalWalls, 3, 0, 1, 2, 5, 6);
		wallBetweenRows(horizontalWalls, 4, 3, 5);
		wallBetweenRows(horizontalWalls, 5, 0, 2, 7);
		wallBetweenRows(horizontalWalls, 6, 3, 4);

		wallBetweenCols(verticalWalls, 0, 1, 3, 6);
		wallBetweenCols(verticalWalls, 2, 2, 4, 5, 7);
		wallBetweenCols(verticalWalls, 4, 1, 3, 5, 6, 7);
		wallBetweenCols(verticalWalls, 5, 0);
		wallBetweenCols(verticalWalls, 6, 2, 4, 6);

		String[][] letters = createLetterGrid();
		putLetters(letters, "A", 0, 0, 0, 6, 3, 1, 4, 6, 5, 4);
		putLetters(letters, "B", 0, 3, 2, 7, 3, 3, 6, 2, 7, 7);
		putLetters(letters, "D", 1, 2, 2, 5, 5, 0, 6, 5, 7, 1);

		return new ThreeDMazeMaze(horizontalWalls, verticalWalls, stars, letters);
	}

	private static ThreeDMazeMaze abhMaze() {
		int[][] stars = stars(1, 0, 3, 4, 6, 5);

		boolean[][] horizontalWalls = createHorizontalWalls();
		boolean[][] verticalWalls = createVerticalWalls();

		//Walls looped around
		wallBetweenRows(horizontalWalls, 7, 0, 1, 2, 4, 6, 7);
		//Walls looped sideways
		wallBetweenCols(verticalWalls, 7, 0, 3, 4, 5);

		wallBetweenRows(horizontalWalls, 0, 1, 3, 4);
		wallBetweenRows(horizontalWalls, 1, 0, 4, 5, 7);
		wallBetweenRows(horizontalWalls, 2, 1, 3);
		wallBetweenRows(horizontalWalls, 3, 4);
		wallBetweenRows(horizontalWalls, 4, 2, 3, 5);
		wallBetweenRows(horizontalWalls, 5, 2, 4, 5, 6);
		wallBetweenRows(horizontalWalls, 6, 1, 2);

		wallBetweenCols(verticalWalls, 0, 1, 3, 4, 5);
		wallBetweenCols(verticalWalls, 1, 2, 5);
		wallBetweenCols(verticalWalls, 2, 0, 2, 3, 4, 6);
		wallBetweenCols(verticalWalls, 4, 3, 6);
		wallBetweenCols(verticalWalls, 5, 2, 4);
		wallBetweenCols(verticalWalls, 6, 1, 2, 3, 6, 7);

		String[][] letters = createLetterGrid();
		putLetters(letters, "A", 0, 5, 3, 7, 4, 1, 5, 4, 7, 0);
		putLetters(letters, "B", 0, 0, 2, 2, 2, 4, 5, 6, 6, 1);
		putLetters(letters, "H", 0, 7, 1, 2, 3, 6, 4, 3, 7, 3);

		return new ThreeDMazeMaze(horizontalWalls, verticalWalls, stars, letters);
	}

	//TODO: ACH, ADH, BCD, BCH, BDH, CDH
	private static ThreeDMazeMaze acdMaze() {
		int[][] stars = stars(1, 5, 2, 2, 5, 5);
		boolean[][] horizontalWalls = createHorizontalWalls();
		boolean[][] verticalWalls = createVerticalWalls();

		// Cyclic boundary (full outer border in image)
		wallBetweenRows(horizontalWalls, 7, 1, 2, 3, 5, 7);
		wallBetweenCols(verticalWalls, 7, 1, 3, 4, 7);

		// Internal horizontal walls (h[r][c] = wall south of cell (r,c))
		wallBetweenRows(horizontalWalls, 0, 1, 2, 5, 6);
		wallBetweenRows(horizontalWalls, 1, 5, 6, 7);
		wallBetweenRows(horizontalWalls, 2, 1);
		wallBetweenRows(horizontalWalls, 3, 0, 1, 2, 4, 5, 6);
		wallBetweenRows(horizontalWalls, 4, 1, 2, 5);
		wallBetweenRows(horizontalWalls, 5, 3, 5, 6);
		wallBetweenRows(horizontalWalls, 6, 1, 2, 4, 5);

		// Internal vertical walls (v[r][c] = wall east of cell (r,c))
		wallBetweenCols(verticalWalls, 0, 1, 2, 5, 6);
		wallBetweenCols(verticalWalls, 1, 2, 5);
		wallBetweenCols(verticalWalls, 2, 2, 3, 6);
		wallBetweenCols(verticalWalls, 3, 0, 1, 3, 4);
		wallBetweenCols(verticalWalls, 4, 1, 5);
		wallBetweenCols(verticalWalls, 5, 2, 7);
		wallBetweenCols(verticalWalls, 6, 3, 4, 5);

		String[][] letters = createLetterGrid();
		putLetters(letters, "A", 3, 1, 5, 2, 5, 7, 6, 3, 7, 0);
		putLetters(letters, "C", 1, 2, 1, 7, 2, 5, 4, 3, 7, 5);
		putLetters(letters, "D", 0, 0, 1, 4, 4, 0, 4, 5, 6, 6);

		return new ThreeDMazeMaze(horizontalWalls, verticalWalls, stars, letters);
	}

	private static ThreeDMazeMaze achMaze() {
		boolean[][] horizontalWalls = createHorizontalWalls();
		boolean[][] verticalWalls = createVerticalWalls();

		wallBetweenRows(horizontalWalls, 0, 0, 1, 3);
		wallBetweenRows(horizontalWalls, 1, 1, 2, 5, 6);
		wallBetweenRows(horizontalWalls, 3, 1, 5);
		wallBetweenRows(horizontalWalls, 4, 7);
		wallBetweenRows(horizontalWalls, 5, 0, 1, 2, 6);
		wallBetweenRows(horizontalWalls, 6, 1, 3, 4, 6, 7);
		wallBetweenRows(horizontalWalls, 7, 2, 3, 4, 5);

		wallBetweenCols(verticalWalls, 0, 2, 4, 5, 7);
		wallBetweenCols(verticalWalls, 2, 1, 2, 5, 6);
		wallBetweenCols(verticalWalls, 4, 0, 2, 5);
		wallBetweenCols(verticalWalls, 5, 0, 7);
		wallBetweenCols(verticalWalls, 6, 1, 2, 3, 5);
		wallBetweenCols(verticalWalls, 7, 0, 1, 3, 4, 6);

		int[][] stars = stars(1, 0, 2, 6, 5, 1);
		String[][] letters = createLetterGrid();
		putLetters(letters, "A", 0, 6, 3, 1, 4, 6, 5, 7, 7, 2);
		putLetters(letters, "C", 0, 2, 2, 7, 4, 0, 4, 4, 6, 3);
		putLetters(letters, "H", 0, 0, 1, 4, 3, 5, 4, 2, 6, 5);

		return new ThreeDMazeMaze(horizontalWalls, verticalWalls, stars, letters);
	}

	private static ThreeDMazeMaze adhMaze() {
		boolean[][] horizontalWalls = createHorizontalWalls();
		boolean[][] verticalWalls = createVerticalWalls();

		wallBetweenRows(horizontalWalls, 0, 4, 5, 6);
		wallBetweenRows(horizontalWalls, 1, 5, 6, 7);
		wallBetweenRows(horizontalWalls, 2, 1, 4, 5);
		wallBetweenRows(horizontalWalls, 3, 2, 3, 5, 7);
		wallBetweenRows(horizontalWalls, 4, 0, 1, 2);
		wallBetweenRows(horizontalWalls, 5, 1, 2);
		wallBetweenRows(horizontalWalls, 6, 0, 1, 4);
		wallBetweenRows(horizontalWalls, 7, 1, 2, 3, 5, 7);

		wallBetweenCols(verticalWalls, 0, 1, 2, 3);
		wallBetweenCols(verticalWalls, 1, 0, 1, 3);
		wallBetweenCols(verticalWalls, 2, 1, 2, 3, 6);
		wallBetweenCols(verticalWalls, 3, 2, 5, 6);
		wallBetweenCols(verticalWalls, 4, 0, 4, 5, 6, 7);
		wallBetweenCols(verticalWalls, 5, 5, 6);
		wallBetweenCols(verticalWalls, 6, 4, 6, 7);
		wallBetweenCols(verticalWalls, 7, 0, 1, 2, 4, 5, 7);

		int[][] stars = stars(0, 5, 2, 1, 5, 0);
		String[][] letters = createLetterGrid();
		putLetters(letters, "A", 1, 7, 2, 6, 3, 0, 5, 7, 7, 3);
		putLetters(letters, "D", 0, 0, 0, 2, 3, 3, 4, 5, 6, 0);
		putLetters(letters, "H", 1, 4, 2, 2, 4, 4, 5, 2, 7, 5);
		return new ThreeDMazeMaze(horizontalWalls, verticalWalls, stars, letters);
	}

	private static ThreeDMazeMaze bcdMaze() {
		boolean[][] horizontalWalls = createHorizontalWalls();
		boolean[][] verticalWalls = createVerticalWalls();

		wallBetweenRows(horizontalWalls, 0, 1, 2, 4, 6, 7);
		wallBetweenRows(horizontalWalls, 1, 1, 2, 5);
		wallBetweenRows(horizontalWalls, 2, 0, 5, 6, 7);
		wallBetweenRows(horizontalWalls, 3, 0, 2, 3, 6, 7);
		wallBetweenRows(horizontalWalls, 4, 0, 3, 4, 7);
		wallBetweenRows(horizontalWalls, 5, 1, 2, 6);
		wallBetweenRows(horizontalWalls, 6, 0, 2, 3, 4, 7);
		wallBetweenRows(horizontalWalls, 7, 1, 3, 4, 5, 6);

		wallBetweenCols(verticalWalls, 0, 2);
		wallBetweenCols(verticalWalls, 1, 2, 4 ,7);
		wallBetweenCols(verticalWalls, 2, 0, 5);
		wallBetweenCols(verticalWalls, 3, 1, 2, 3);
		wallBetweenCols(verticalWalls, 4, 6);
		wallBetweenCols(verticalWalls, 5, 1, 4, 6);
		wallBetweenCols(verticalWalls, 6, 5, 7);
		wallBetweenCols(verticalWalls, 7, 0, 2, 4, 5, 7);

		int[][] stars = stars(2, 1, 1, 6, 6, 4);
		String[][] letters = createLetterGrid();
		putLetters(letters, "B", 0, 5, 2, 3, 3, 6, 5, 0, 7, 3);
		putLetters(letters, "C", 1, 0, 3, 1, 2, 6, 4, 4, 6, 1);
		putLetters(letters, "D", 1, 2, 4, 7, 5, 5, 6, 6, 7, 0);
		return new ThreeDMazeMaze(horizontalWalls, verticalWalls, stars, letters);
	}

	private static ThreeDMazeMaze bchMaze() {
		boolean[][] horizontalWalls = createHorizontalWalls();
		boolean[][] verticalWalls = createVerticalWalls();

		wallBetweenRows(horizontalWalls, 0, 1, 3, 5, 6, 7);
		wallBetweenRows(horizontalWalls, 1, 0, 2, 4, 5);
		wallBetweenRows(horizontalWalls, 2, 5, 6);
		wallBetweenRows(horizontalWalls, 3, 1, 2, 3, 4, 5, 6);
		wallBetweenRows(horizontalWalls, 4, 2, 6);
		wallBetweenRows(horizontalWalls, 5, 0, 3, 5);
		wallBetweenRows(horizontalWalls, 6, 5, 6);
		wallBetweenRows(horizontalWalls, 7, 0, 2, 3, 6, 7);

		wallBetweenCols(verticalWalls, 0, 1, 2, 5, 6);
		wallBetweenCols(verticalWalls, 1, 2, 5, 6);
		wallBetweenCols(verticalWalls, 2, 2, 7);
		wallBetweenCols(verticalWalls, 3, 1, 2, 3, 4, 5, 6);
		wallBetweenCols(verticalWalls, 4, 0, 5);
		wallBetweenCols(verticalWalls, 5, 7);
		wallBetweenCols(verticalWalls, 6, 2, 5, 6);
		wallBetweenCols(verticalWalls, 7, 0, 3, 4);

		int[][] stars = stars(2, 2, 3, 4, 5, 3);
		String[][] letters = createLetterGrid();
		putLetters(letters, "B", 2, 4, 3, 0, 4, 5, 6, 2, 7, 7);
		putLetters(letters, "C", 0, 0, 1, 2, 4, 7, 6, 4, 7, 1);
		putLetters(letters, "H", 0, 4, 1, 7, 3, 3, 4, 1, 7, 5);
		return new ThreeDMazeMaze(horizontalWalls, verticalWalls, stars, letters);
	}

	private static ThreeDMazeMaze bdhMaze() {
		boolean[][] horizontalWalls = createHorizontalWalls();
		boolean[][] verticalWalls = createVerticalWalls();

		wallBetweenRows(horizontalWalls, 0, 3, 7);
		wallBetweenRows(horizontalWalls, 1, 0, 1, 3, 4);
		wallBetweenRows(horizontalWalls, 2, 0, 1, 3, 4, 6, 7);
		wallBetweenRows(horizontalWalls, 3, 3, 6, 7);
		wallBetweenRows(horizontalWalls, 4, 0);
		wallBetweenRows(horizontalWalls, 5, 1, 2, 4, 5);
		wallBetweenRows(horizontalWalls, 6, 1, 4, 5, 6, 7);
		wallBetweenRows(horizontalWalls, 7, 2, 7);

		wallBetweenCols(verticalWalls, 0, 0, 1, 6);
		wallBetweenCols(verticalWalls, 1, 0, 3, 4);
		wallBetweenCols(verticalWalls, 2, 1, 4, 7);
		wallBetweenCols(verticalWalls, 3, 0, 5, 7);
		wallBetweenCols(verticalWalls, 4, 1, 2, 4, 5);
		wallBetweenCols(verticalWalls, 5, 1, 2, 5, 7);
		wallBetweenCols(verticalWalls, 6, 1);
		wallBetweenCols(verticalWalls, 7, 1, 5, 6);

		int[][] stars = stars(1, 3, 2, 4, 6, 7);
		String[][] letters = createLetterGrid();
		putLetters(letters, "B", 0, 4, 2, 7, 3, 5, 5, 2, 7, 5);
		putLetters(letters, "D", 0, 2, 1, 6, 3, 0, 4, 4, 7, 0);
		putLetters(letters, "H", 0, 7, 2, 2, 4, 7, 6, 3, 6, 6);
		return new ThreeDMazeMaze(horizontalWalls, verticalWalls, stars, letters);
	}

	private static ThreeDMazeMaze cdhMaze() {
		boolean[][] horizontalWalls = createHorizontalWalls();
		boolean[][] verticalWalls = createVerticalWalls();

		wallBetweenRows(horizontalWalls, 0, 2, 5);
		wallBetweenRows(horizontalWalls, 2, 1, 6);
		wallBetweenRows(horizontalWalls, 3, 1, 6);
		wallBetweenRows(horizontalWalls, 4, 2, 6);
		wallBetweenRows(horizontalWalls, 5, 0, 3, 5);
		wallBetweenRows(horizontalWalls, 6, 5, 6);
		wallBetweenRows(horizontalWalls, 7, 0, 2, 3, 6, 7);

		wallBetweenCols(verticalWalls, 0, 0, 1, 6);
		wallBetweenCols(verticalWalls, 1, 1, 2, 7);
		wallBetweenCols(verticalWalls, 2, 1, 3, 4);
		wallBetweenCols(verticalWalls, 3, 0, 3, 4, 5, 7);
		wallBetweenCols(verticalWalls, 4, 1, 3, 4);
		wallBetweenCols(verticalWalls, 5, 1, 2, 7);
		wallBetweenCols(verticalWalls, 6, 0, 1, 6);
		wallBetweenCols(verticalWalls, 7, 0, 1, 4, 5, 6);

		int[][] stars = stars(1, 5, 6, 0, 6, 6);
		String[][] letters = createLetterGrid();
		putLetters(letters, "C", 1, 4, 4, 2, 5, 0, 5, 5, 7, 7);
		putLetters(letters, "D", 0, 5, 2, 7, 3, 5, 5, 3, 6, 1);
		putLetters(letters, "H", 0, 2, 2, 3, 3, 0, 5, 7, 6, 4);
		return new ThreeDMazeMaze(horizontalWalls, verticalWalls, stars, letters);
	}

	public static boolean isValidMarker(String letter) {
		return letter != null && VALID_MARKERS.contains(letter.toUpperCase());
	}

	public static boolean isValidDirection(String direction) {
		return direction != null && VALID_DIRECTIONS.contains(direction.toUpperCase());
	}

	/**
	 * Normalizes the three marker letters to a sorted triple key (e.g. ["C","A","A"] → "A,A,C").
	 * Returns null if any letter is invalid or list size is not 3.
	 */
	public static String toSortedTriple(List<String> starLetters) {
		if(starLetters == null || starLetters.size() != 3) {
			return null;
		}
		List<String> normalized = starLetters.stream().map(s -> s == null ? null : s.trim().toUpperCase()).filter(ThreeDMazeDefinitions::isValidMarker).sorted().toList();
		if(normalized.size() != 3) {
			return null;
		}
		return String.join(",", normalized);
	}

	/** Returns true if the sorted triple corresponds to one of the 10 known mazes. */
	public static boolean isKnownMazeTriple(String sortedTriple) {
		return sortedTriple != null && KNOWN_MAZE_TRIPLES.contains(sortedTriple);
	}

	/** Returns the maze layout for the given sorted triple, or null if unknown. */
	public static ThreeDMazeMaze getMaze(String sortedTriple) {
		return sortedTriple == null ? null : TRIPLE_TO_MAZE.get(sortedTriple);
	}

	/** Returns the set of known maze triple keys (e.g. "A,B,C") for iteration or display. */
	public static Set<String> getKnownMazeTriples() {
		return Set.copyOf(KNOWN_MAZE_TRIPLES);
	}

	/** Returns the 3 star (direction marker) positions for the maze: each int[] is {row, col} 0-based. */
	public static int[][] getStarPositions(String sortedTriple) {
		ThreeDMazeMaze maze = getMaze(sortedTriple);
		return maze == null ? null : maze.starPositions();
	}

	/** Returns the floor letter at (row, col) for the given maze triple, or null if unknown. */
	public static String getLetterAt(String sortedTriple, int row, int col) {
		if(sortedTriple == null || row < 0 || row >= SIZE || col < 0 || col >= SIZE) {
			return null;
		}
		ThreeDMazeMaze maze = getMaze(sortedTriple);
		String[][] grid = maze == null ? null : maze.letterGrid();
		return grid == null ? null : grid[row][col];
	}

	/** Returns the letter shown at the i-th star (0..2) for the given maze triple, or null. */
	public static String getLetterAtStar(String sortedTriple, int starIndex) {
		int[][] stars = getStarPositions(sortedTriple);
		if(stars == null || starIndex < 0 || starIndex >= stars.length)
			return null;
		int r = stars[starIndex][0], c = stars[starIndex][1];
		return getLetterAt(sortedTriple, r, c);
	}

	/** Returns true if (row, col) is one of the 3 star cells in this maze. */
	public static boolean isStarCell(String sortedTriple, int row, int col) {
		int[][] stars = getStarPositions(sortedTriple);
		if(stars == null)
			return false;
		for(int[] s: stars) {
			if(s[0] == row && s[1] == col)
				return true;
		}
		return false;
	}

	/**
	 * Steps to wall in each cardinal direction (N, S, E, W) from (row, col).
	 * Returns int[4] = { distN, distS, distE, distW }. Cyclic 8×8.
	 */
	public static int[] stepsToWallInEachDirection(ThreeDMazeMaze maze, int row, int col) {
		boolean[][] h = maze.horizontalWalls();
		boolean[][] v = maze.verticalWalls();
		int distN = 0;
		for(int i = 1; i <= SIZE; i++) {
			int r = (row - i + SIZE) % SIZE;
			if(h[r][col])
				break;
			distN++;
		}
		int distS = 0;
		for(int i = 1; i <= SIZE; i++) {
			int wallR = (row + i - 1) % SIZE;
			if(h[wallR][col])
				break;
			distS++;
		}
		int distE = 0;
		for(int i = 1; i <= SIZE; i++) {
			int wallC = (col + i - 1) % SIZE;
			if(v[row][wallC])
				break;
			distE++;
		}
		int distW = 0;
		for(int i = 1; i <= SIZE; i++) {
			int c = (col - i + SIZE) % SIZE;
			if(v[row][c])
				break;
			distW++;
		}
		return new int[] {distN, distS, distE, distW};
	}

	private static final int[][] PERMUTATIONS_4 = buildPermutations4();

	private static int[][] buildPermutations4() {
		List<int[]> list = new ArrayList<>();
		permute(new int[] {0, 1, 2, 3}, 0, list);
		return list.toArray(new int[0][]);
	}

	private static void permute(int[] a, int start, List<int[]> out) {
		if(start == a.length) {
			out.add(a.clone());
			return;
		}
		for(int i = start; i < a.length; i++) {
			swap(a, start, i);
			permute(a, start + 1, out);
			swap(a, start, i);
		}
	}

	private static void swap(int[] a, int i, int j) {
		int t = a[i];
		a[i] = a[j];
		a[j] = t;
	}

	/** Key for position lookup: (triple, distN, distS, distE, distW). */
	private static final class DistanceKey {
		final String triple;
		final int d0, d1, d2, d3;

		DistanceKey(String triple, int d0, int d1, int d2, int d3) {
			this.triple = triple;
			this.d0 = d0;
			this.d1 = d1;
			this.d2 = d2;
			this.d3 = d3;
		}

		@Override
		public boolean equals(Object o) {
			if(this == o)
				return true;
			if(o == null || getClass() != o.getClass())
				return false;
			DistanceKey that = (DistanceKey)o;
			return d0 == that.d0 && d1 == that.d1 && d2 == that.d2 && d3 == that.d3 && Objects.equals(triple, that.triple);
		}

		@Override
		public int hashCode() {
			return Objects.hash(triple, d0, d1, d2, d3);
		}
	}

	private static final Map<DistanceKey, List<int[]>> DISTANCE_LOOKUP = buildDistanceLookup();

	private static Map<DistanceKey, List<int[]>> buildDistanceLookup() {
		Map<DistanceKey, List<int[]>> map = new LinkedHashMap<>();
		for(String triple: KNOWN_MAZE_TRIPLES) {
			ThreeDMazeMaze maze = TRIPLE_TO_MAZE.get(triple);
			if(maze == null)
				continue;
			for(int r = 0; r < SIZE; r++) {
				for(int c = 0; c < SIZE; c++) {
					int[] steps = stepsToWallInEachDirection(maze, r, c);
					DistanceKey key = new DistanceKey(triple, steps[0], steps[1], steps[2], steps[3]);
					map.computeIfAbsent(key, k -> new ArrayList<>()).add(new int[] {r, c});
				}
			}
		}
		return map;
	}

	/**
	 * Resolve (row, col) from maze triple + four distances (order unknown; tries all 24 permutations).
	 * If letterAtPosition is N/S/E/W, only positions that are star cells are considered.
	 * Returns list of matching (row, col); empty if none, multiple if ambiguous.
	 */
	public static List<int[]> resolvePositionFromDistances(String sortedTriple, String letterAtPosition, int d0, int d1, int d2, int d3) {
		if(sortedTriple == null)
			return List.of();
		String letterNorm = letterAtPosition == null ? null : letterAtPosition.trim().toUpperCase();
		boolean starsOnly = letterNorm != null && VALID_DIRECTIONS.contains(letterNorm);
		boolean filterByLetter = letterNorm != null && VALID_MARKERS.contains(letterNorm);
		int[] dist = {d0, d1, d2, d3};
		Map<String, int[]> seen = new LinkedHashMap<>();
		for(int[] perm: PERMUTATIONS_4) {
			DistanceKey key = new DistanceKey(sortedTriple, dist[perm[0]], dist[perm[1]], dist[perm[2]], dist[perm[3]]);
			List<int[]> cells = DISTANCE_LOOKUP.get(key);
			if(cells != null) {
				for(int[] cell: cells) {
					if(starsOnly && !isStarCell(sortedTriple, cell[0], cell[1]))
						continue;
					if(filterByLetter) {
						String atCell = getLetterAt(sortedTriple, cell[0], cell[1]);
						if(atCell == null || !atCell.equals(letterNorm))
							continue;
					}
					String k = cell[0] + "," + cell[1];
					seen.putIfAbsent(k, new int[] {cell[0], cell[1]});
				}
			}
		}
		return new ArrayList<>(seen.values());
	}
}
