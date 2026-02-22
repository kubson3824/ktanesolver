
package ktanesolver.module.modded.regular.threedmaze;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Random;
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
	 * Wall between row and row+1 (mod 8) at column col.
	 * Row and col in 0..7. No-op if out of bounds.
	 */
	public static void wallBetweenRows(boolean[][] h, int row, int col) {
		if(row >= 0 && row < SIZE && col >= 0 && col < SIZE) {
			h[row][col] = true;
		}
	}

	/**
	 * Wall between row and row+1 (mod 8) spanning columns colFrom to colTo (inclusive).
	 * Row and columns in 0..7. Useful for a full horizontal barrier across multiple columns.
	 */
	public static void wallBetweenRows(boolean[][] h, int row, int colFrom, int colTo) {
		for(int c = colFrom; c <= colTo; c++) {
			wallBetweenRows(h, row, c);
		}
	}

	/**
	 * Wall between col and col+1 (mod 8) at row row.
	 * Row and col in 0..7. No-op if out of bounds.
	 */
	public static void wallBetweenCols(boolean[][] v, int col, int row) {
		if(row >= 0 && row < SIZE && col >= 0 && col < SIZE) {
			v[row][col] = true;
		}
	}

	/**
	 * Wall between col and col+1 (mod 8) spanning rows rowFrom to rowTo (inclusive).
	 * Rows and col in 0..7. Useful for a full vertical barrier across multiple rows.
	 */
	public static void wallBetweenCols(boolean[][] v, int col, int rowFrom, int rowTo) {
		for(int r = rowFrom; r <= rowTo; r++) {
			wallBetweenCols(v, col, r);
		}
	}

	/**
	 * Builds a default 8×8 letter grid: (r+c)%5 pattern, with the three star cells set to the triple's letters (A,B,C etc.).
	 * Use for mazes that only need stars to have the marker letters; replace with full data per maze as needed.
	 */
	private static String[][] createDefaultLetterGrid(String triple, int[][] starPositions) {
		String[] markers = { "A", "B", "C", "D", "H" };
		String[][] grid = new String[SIZE][SIZE];
		for (int r = 0; r < SIZE; r++) {
			for (int c = 0; c < SIZE; c++) {
				grid[r][c] = markers[(r + c) % markers.length];
			}
		}
		if (starPositions != null && starPositions.length == 3) {
			String[] letters = triple.split(",");
			for (int i = 0; i < 3 && i < letters.length; i++) {
				int r = starPositions[i][0], c = starPositions[i][1];
				if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
					grid[r][c] = letters[i].trim();
				}
			}
		}
		return grid;
	}

	/**
	 * Builds a random 8×8 maze from a fixed seed (reproducible).
	 * Each cell edge (including wrap boundaries) has wall probability 0.35.
	 */
	private static ThreeDMazeMaze randomMaze(long seed, int[][] starPositions, String[][] letterGrid) {
		Random rng = new Random(seed);
		boolean[][] h = new boolean[SIZE][SIZE];
		boolean[][] v = new boolean[SIZE][SIZE];
		for (int row = 0; row < SIZE; row++) {
			for (int col = 0; col < SIZE; col++) {
				h[row][col] = rng.nextDouble() < 0.35;
				v[row][col] = rng.nextDouble() < 0.35;
			}
		}
		return new ThreeDMazeMaze(h, v, starPositions, letterGrid);
	}

	private static ThreeDMazeMaze abcMaze() {
		boolean[][] horizontalWalls = createHorizontalWalls();
		boolean[][] verticalWalls = createVerticalWalls();

		//Walls looped around
		wallBetweenRows(horizontalWalls, 7, 0, 1);
		wallBetweenRows(horizontalWalls, 7, 5, 6);
		//Walls looped sideways
		wallBetweenCols(verticalWalls, 7, 0, 1);

		wallBetweenRows(horizontalWalls, 0, 4);

		wallBetweenRows(horizontalWalls, 1, 1);
		wallBetweenRows(horizontalWalls, 1, 3, 5);

		wallBetweenRows(horizontalWalls, 2, 2);
		wallBetweenRows(horizontalWalls, 2, 6, 7);

		wallBetweenRows(horizontalWalls, 3, 0);
		wallBetweenRows(horizontalWalls, 3, 3, 4);
		wallBetweenRows(horizontalWalls, 3, 7);

		wallBetweenRows(horizontalWalls, 4, 5);

		wallBetweenRows(horizontalWalls, 5, 2, 3);
		wallBetweenRows(horizontalWalls, 5, 6);
		wallBetweenRows(horizontalWalls, 6, 0, 1);
		wallBetweenRows(horizontalWalls, 6, 7);

		wallBetweenCols(verticalWalls, 0, 3, 6);
		wallBetweenCols(verticalWalls, 1, 0, 1);
		wallBetweenCols(verticalWalls, 1, 5);
		wallBetweenCols(verticalWalls, 1, 7);
		wallBetweenCols(verticalWalls, 2, 2, 4);
		wallBetweenCols(verticalWalls, 3, 0);
		wallBetweenCols(verticalWalls, 3, 6, 7);
		wallBetweenCols(verticalWalls, 4, 1);
		wallBetweenCols(verticalWalls, 4, 3);
		wallBetweenCols(verticalWalls, 4, 5, 7);
		wallBetweenCols(verticalWalls, 5, 3);
		wallBetweenCols(verticalWalls, 6, 0);
		wallBetweenCols(verticalWalls, 6, 2);
		wallBetweenCols(verticalWalls, 6, 4);
		wallBetweenCols(verticalWalls, 6, 6);

		// Stars (direction markers) and floor letters for this maze (full grid so position-from-distances works)
		int[][] stars = new int[][] {{1, 1}, {3, 4}, {6, 0}};
		String[][] letters = new String[SIZE][SIZE];
		// Override cells that differ from the default in the module's letter layout (if any are documented)
		letters[0][5] = "A";
		letters[1][2] = "A";
		letters[2][0] = "A";
		letters[2][3] = "B";
		letters[4][4] = "A";
		// (5,1) and (7,4) share the same distance signature as (2,3); use different letters so B at (2,3) is unique
		letters[5][1] = "A";
		letters[7][4] = "C";

		return new ThreeDMazeMaze(horizontalWalls, verticalWalls, stars, letters);
	}

	private static ThreeDMazeMaze abdMaze() {
		int[][] stars = new int[][] {{0, 5}, {4, 3}, {7, 4}};
		return randomMaze(0xABD, stars, createDefaultLetterGrid("A,B,D", stars));
	}

	private static ThreeDMazeMaze abhMaze() {
		int[][] stars = new int[][] {{1, 1}, {3, 3}, {6, 4}};
		return randomMaze(0xABA, stars, createDefaultLetterGrid("A,B,H", stars));
	}

	private static ThreeDMazeMaze acdMaze() {
		int[][] stars = new int[][] {{1, 4}, {2, 1}, {5, 5}};
		return randomMaze(0xACD, stars, createDefaultLetterGrid("A,C,D", stars));
	}

	private static ThreeDMazeMaze achMaze() {
		int[][] stars = new int[][] {{1, 1}, {2, 5}, {5, 1}};
		return randomMaze(0xACA, stars, createDefaultLetterGrid("A,C,H", stars));
	}

	private static ThreeDMazeMaze adhMaze() {
		int[][] stars = new int[][] {{0, 5}, {2, 1}, {5, 0}};
		return randomMaze(0xADA, stars, createDefaultLetterGrid("A,D,H", stars));
	}

	private static ThreeDMazeMaze bcdMaze() {
		int[][] stars = new int[][] {{2, 2}, {1, 5}, {5, 4}};
		return randomMaze(0xBCD, stars, createDefaultLetterGrid("B,C,D", stars));
	}

	private static ThreeDMazeMaze bchMaze() {
		int[][] stars = new int[][] {{2, 3}, {3, 4}, {5, 3}};
		return randomMaze(0xBCA, stars, createDefaultLetterGrid("B,C,H", stars));
	}

	private static ThreeDMazeMaze bdhMaze() {
		int[][] stars = new int[][] {{1, 3}, {2, 4}, {6, 6}};
		return randomMaze(0xBDA, stars, createDefaultLetterGrid("B,D,H", stars));
	}

	private static ThreeDMazeMaze cdhMaze() {
		int[][] stars = new int[][] {{1, 4}, {6, 0}, {6, 6}};
		return randomMaze(0xCDA, stars, createDefaultLetterGrid("C,D,H", stars));
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
		if (sortedTriple == null || row < 0 || row >= SIZE || col < 0 || col >= SIZE) {
			return null;
		}
		ThreeDMazeMaze maze = getMaze(sortedTriple);
		String[][] grid = maze == null ? null : maze.letterGrid();
		return grid == null ? null : grid[row][col];
	}

	/** Returns the letter shown at the i-th star (0..2) for the given maze triple, or null. */
	public static String getLetterAtStar(String sortedTriple, int starIndex) {
		int[][] stars = getStarPositions(sortedTriple);
		if (stars == null || starIndex < 0 || starIndex >= stars.length) return null;
		int r = stars[starIndex][0], c = stars[starIndex][1];
		return getLetterAt(sortedTriple, r, c);
	}

	/** Returns true if (row, col) is one of the 3 star cells in this maze. */
	public static boolean isStarCell(String sortedTriple, int row, int col) {
		int[][] stars = getStarPositions(sortedTriple);
		if (stars == null) return false;
		for (int[] s : stars) {
			if (s[0] == row && s[1] == col) return true;
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
		for (int i = 1; i <= SIZE; i++) {
			int r = (row - i + SIZE) % SIZE;
			if (h[r][col]) break;
			distN++;
		}
		int distS = 0;
		for (int i = 1; i <= SIZE; i++) {
			int wallR = (row + i - 1) % SIZE;
			if (h[wallR][col]) break;
			distS++;
		}
		int distE = 0;
		for (int i = 1; i <= SIZE; i++) {
			int wallC = (col + i - 1) % SIZE;
			if (v[row][wallC]) break;
			distE++;
		}
		int distW = 0;
		for (int i = 1; i <= SIZE; i++) {
			int c = (col - i + SIZE) % SIZE;
			if (v[row][c]) break;
			distW++;
		}
		return new int[] { distN, distS, distE, distW };
	}

	private static final int[][] PERMUTATIONS_4 = buildPermutations4();

	private static int[][] buildPermutations4() {
		List<int[]> list = new ArrayList<>();
		permute(new int[] { 0, 1, 2, 3 }, 0, list);
		return list.toArray(new int[0][]);
	}

	private static void permute(int[] a, int start, List<int[]> out) {
		if (start == a.length) {
			out.add(a.clone());
			return;
		}
		for (int i = start; i < a.length; i++) {
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
			if (this == o) return true;
			if (o == null || getClass() != o.getClass()) return false;
			DistanceKey that = (DistanceKey) o;
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
		for (String triple : KNOWN_MAZE_TRIPLES) {
			ThreeDMazeMaze maze = TRIPLE_TO_MAZE.get(triple);
			if (maze == null) continue;
			for (int r = 0; r < SIZE; r++) {
				for (int c = 0; c < SIZE; c++) {
					int[] steps = stepsToWallInEachDirection(maze, r, c);
					DistanceKey key = new DistanceKey(triple, steps[0], steps[1], steps[2], steps[3]);
					map.computeIfAbsent(key, k -> new ArrayList<>()).add(new int[] { r, c });
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
		if (sortedTriple == null) return List.of();
		String letterNorm = letterAtPosition == null ? null : letterAtPosition.trim().toUpperCase();
		boolean starsOnly = letterNorm != null && VALID_DIRECTIONS.contains(letterNorm);
		boolean filterByLetter = letterNorm != null && VALID_MARKERS.contains(letterNorm);
		int[] dist = { d0, d1, d2, d3 };
		Map<String, int[]> seen = new LinkedHashMap<>();
		for (int[] perm : PERMUTATIONS_4) {
			DistanceKey key = new DistanceKey(
				sortedTriple,
				dist[perm[0]],
				dist[perm[1]],
				dist[perm[2]],
				dist[perm[3]]
			);
			List<int[]> cells = DISTANCE_LOOKUP.get(key);
			if (cells != null) {
				for (int[] cell : cells) {
					if (starsOnly && !isStarCell(sortedTriple, cell[0], cell[1])) continue;
					if (filterByLetter) {
						String atCell = getLetterAt(sortedTriple, cell[0], cell[1]);
						if (atCell == null || !atCell.equals(letterNorm)) continue;
					}
					String k = cell[0] + "," + cell[1];
					seen.putIfAbsent(k, new int[] { cell[0], cell[1] });
				}
			}
		}
		return new ArrayList<>(seen.values());
	}
}
