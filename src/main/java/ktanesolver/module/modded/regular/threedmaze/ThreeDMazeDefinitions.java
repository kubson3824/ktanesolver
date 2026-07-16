package ktanesolver.module.modded.regular.threedmaze;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** Canonical default-rule 3D Maze layouts and position lookup. */
public final class ThreeDMazeDefinitions {

	private static final int SIZE = 8;
	private static final Set<String> VALID_MARKERS = Set.of("A", "B", "C", "D", "H");
	private static final Set<String> VALID_DIRECTIONS = Set.of("N", "S", "E", "W");

	private record Definition(String triple, String[] labels, String[] northWalls, String[] westWalls) {}
	private record DistanceKey(String triple, int north, int south, int east, int west) {}

	// Kept in the same compact format as the official module source to avoid coordinate transcription errors.
	private static final List<Definition> DEFINITIONS = List.of(
		definition("A,B,C",
			rows("     A  ", " *A    B", "A  B C  ", " C  *  B", "    A   ", " B C  B ", "* C     ", "    A C "),
			rows("11000110", "00001000", "01011100", "00100011", "10011001", "00000100", "00110010", "11000001"),
			rows("10101001", "10100100", "00010001", "01010110", "01010001", "01100100", "01001101", "00101100")),
		definition("A,B,D",
			rows("A  B  A*", "  D     ", "     D B", " A B    ", "  *   A ", "D   A   ", "  B  D  ", " D  *  B"),
			rows("10100011", "01100100", "00011010", "00100000", "11100110", "00010100", "10100001", "00011000"),
			rows("10000010", "11000100", "00010001", "01000100", "10010001", "00010100", "01000101", "00010100")),
		definition("A,B,H",
			rows("B    A H", "* H     ", "B   B   ", "    * HA", " A H    ", "    A B ", " B   *  ", "A  H    "),
			rows("11101011", "01011000", "10001101", "01010000", "00001000", "00110100", "00101110", "01100000"),
			rows("10010000", "01000001", "00110011", "11010101", "11010010", "11100000", "00010101", "00000001")),
		definition("A,C,D",
			rows("D       ", "  C D* C", " *   C  ", " A      ", "D  C D  ", "  A  * A", "   A  D ", "A    C  "),
			rows("10111011", "01100110", "00000111", "01000000", "11101110", "01100100", "00010110", "01101100"),
			rows("00001000", "11001100", "01110010", "10011001", "10001001", "01100101", "01010000", "10000010")),
		definition("A,C,H",
			rows("H C   A ", "*   H   ", "      *C", " A   H  ", "C H C A ", " *     A", "   C H  ", "  A     "),
			rows("00111100", "11010000", "01100110", "00000000", "01000100", "00000001", "11100010", "01011011"),
			rows("10000110", "10010001", "01010101", "10000001", "11000000", "01010101", "10010000", "01000010")),
		definition("A,D,H",
			rows("D D  *  ", "    H  A", " *H   A ", "A  D    ", "    HD  ", "* H    A", "D       ", "   A H  "),
			rows("01110101", "00001110", "00000111", "01001100", "00110101", "11100000", "01100000", "11001000"),
			rows("10100100", "11110000", "11011000", "01110000", "10000101", "10001110", "00011111", "10000101")),
		definition("B,C,D",
			rows("     B  ", "C D   * ", " * B  C ", " C    B ", "    C  D", "B    D  ", " C  * D ", "D  B    "),
			rows("01011110", "01101011", "01100100", "10000111", "10110011", "10011001", "01100010", "10111001"),
			rows("10010000", "00001010", "11101000", "00001000", "00100010", "00010001", "00000110", "00100001")),
		definition("B,C,H",
			rows("C   H   ", "  C    H", "  * B   ", "B  H*   ", " H   B C", "   *    ", "  B C   ", " C   H B"),
			rows("10110011", "01010111", "10101100", "00000110", "01111110", "00100010", "10010100", "00000110"),
			rows("10000100", "01001000", "01111001", "10001000", "10001000", "01101101", "01101001", "00010010")),
		definition("B,D,H",
			rows("  D B  H", "   *  D ", "  H *  B", "D    B  ", "    D  H", "  B     ", "   H  H*", "D    B  "),
			rows("00100001", "00010001", "11011000", "11011011", "00010011", "10000000", "01101100", "01001111"),
			rows("01101000", "11010111", "00000110", "00100000", "00110100", "10001110", "11000000", "00011010")),
		definition("C,D,H",
			rows("  H  D  ", "    C*  ", "   H   D", "H    D  ", "  C     ", "C  D C H", "*D  H * ", "       C"),
			rows("01011010", "00100100", "00000000", "01000010", "01000010", "01100110", "01011010", "10100101"),
			rows("11001001", "11110111", "00100010", "00011100", "10011100", "10001000", "11000001", "00101010"))
	);

	private static final Map<String, ThreeDMazeMaze> TRIPLE_TO_MAZE = buildMazes();
	private static final Map<DistanceKey, List<int[]>> DISTANCE_LOOKUP = buildDistanceLookup();

	private ThreeDMazeDefinitions() {}

	private static Definition definition(String triple, String[] labels, String[] northWalls, String[] westWalls) {
		return new Definition(triple, labels, northWalls, westWalls);
	}

	private static String[] rows(String... rows) {
		return rows;
	}

	private static Map<String, ThreeDMazeMaze> buildMazes() {
		Map<String, ThreeDMazeMaze> mazes = new LinkedHashMap<>();
		for (Definition definition : DEFINITIONS) {
			mazes.put(definition.triple(), createMaze(definition));
		}
		return Collections.unmodifiableMap(mazes);
	}

	private static ThreeDMazeMaze createMaze(Definition definition) {
		boolean[][] horizontalWalls = new boolean[SIZE][SIZE];
		boolean[][] verticalWalls = new boolean[SIZE][SIZE];
		String[][] letters = new String[SIZE][SIZE];
		List<int[]> stars = new ArrayList<>(3);

		for (int row = 0; row < SIZE; row++) {
			validateRow(definition.labels()[row]);
			validateRow(definition.northWalls()[row]);
			validateRow(definition.westWalls()[row]);
			for (int col = 0; col < SIZE; col++) {
				horizontalWalls[row][col] = definition.northWalls()[(row + 1) % SIZE].charAt(col) == '1';
				verticalWalls[row][col] = definition.westWalls()[row].charAt((col + 1) % SIZE) == '1';
				char label = definition.labels()[row].charAt(col);
				if (label == '*') stars.add(new int[] { row, col });
				else if (VALID_MARKERS.contains(String.valueOf(label))) letters[row][col] = String.valueOf(label);
			}
		}
		if (stars.size() != 3) throw new IllegalStateException("3D Maze must contain exactly three stars: " + definition.triple());
		return new ThreeDMazeMaze(horizontalWalls, verticalWalls, stars.toArray(new int[0][]), letters);
	}

	private static void validateRow(String row) {
		if (row == null || row.length() != SIZE) throw new IllegalStateException("3D Maze rows must be 8 characters");
	}

	public static boolean isValidMarker(String letter) {
		return letter != null && VALID_MARKERS.contains(letter.toUpperCase());
	}

	public static boolean isValidDirection(String direction) {
		return direction != null && VALID_DIRECTIONS.contains(direction.toUpperCase());
	}

	public static String toSortedTriple(List<String> letters) {
		if (letters == null || letters.size() != 3) return null;
		List<String> normalized = letters.stream()
			.map(letter -> letter == null ? null : letter.trim().toUpperCase())
			.filter(ThreeDMazeDefinitions::isValidMarker)
			.sorted()
			.toList();
		return normalized.size() == 3 ? String.join(",", normalized) : null;
	}

	public static boolean isKnownMazeTriple(String triple) {
		return triple != null && TRIPLE_TO_MAZE.containsKey(triple);
	}

	public static ThreeDMazeMaze getMaze(String triple) {
		return triple == null ? null : TRIPLE_TO_MAZE.get(triple);
	}

	public static Set<String> getKnownMazeTriples() {
		return TRIPLE_TO_MAZE.keySet();
	}

	public static int[][] getStarPositions(String triple) {
		ThreeDMazeMaze maze = getMaze(triple);
		return maze == null ? null : maze.starPositions();
	}

	public static String getLetterAt(String triple, int row, int col) {
		ThreeDMazeMaze maze = getMaze(triple);
		return maze == null || row < 0 || row >= SIZE || col < 0 || col >= SIZE ? null : maze.letterGrid()[row][col];
	}

	public static boolean isStarCell(String triple, int row, int col) {
		int[][] stars = getStarPositions(triple);
		if (stars == null) return false;
		for (int[] star : stars) if (star[0] == row && star[1] == col) return true;
		return false;
	}

	/** Returns distances in cardinal order: north, south, east, west. */
	public static int[] stepsToWallInEachDirection(ThreeDMazeMaze maze, int row, int col) {
		boolean[][] h = maze.horizontalWalls();
		boolean[][] v = maze.verticalWalls();
		int north = 0;
		for (int i = 1; i <= SIZE && !h[(row - i + SIZE) % SIZE][col]; i++) north++;
		int south = 0;
		for (int i = 1; i <= SIZE && !h[(row + i - 1) % SIZE][col]; i++) south++;
		int east = 0;
		for (int i = 1; i <= SIZE && !v[row][(col + i - 1) % SIZE]; i++) east++;
		int west = 0;
		for (int i = 1; i <= SIZE && !v[row][(col - i + SIZE) % SIZE]; i++) west++;
		return new int[] { north, south, east, west };
	}

	private static Map<DistanceKey, List<int[]>> buildDistanceLookup() {
		Map<DistanceKey, List<int[]>> lookup = new LinkedHashMap<>();
		for (var entry : TRIPLE_TO_MAZE.entrySet()) {
			for (int row = 0; row < SIZE; row++) {
				for (int col = 0; col < SIZE; col++) {
					int[] d = stepsToWallInEachDirection(entry.getValue(), row, col);
					lookup.computeIfAbsent(new DistanceKey(entry.getKey(), d[0], d[1], d[2], d[3]), ignored -> new ArrayList<>())
						.add(new int[] { row, col });
				}
			}
		}
		return lookup;
	}

	/** Resolves cells using exact cardinal distances; direction symbols may be true markers or random decoys. */
	public static List<int[]> resolvePositionFromDistances(String triple, String letterAtPosition, int north, int south, int east, int west) {
		if (triple == null) return List.of();
		String letter = letterAtPosition == null || letterAtPosition.isBlank() ? null : letterAtPosition.trim().toUpperCase();
		if (letter != null && !isValidMarker(letter) && !isValidDirection(letter)) return List.of();

		List<int[]> cells = DISTANCE_LOOKUP.getOrDefault(new DistanceKey(triple, north, south, east, west), List.of());
		List<int[]> matches = new ArrayList<>();
		for (int[] cell : cells) {
			String mazeLetter = getLetterAt(triple, cell[0], cell[1]);
			if (isValidMarker(letter) && !letter.equals(mazeLetter)) continue;
			if (isValidDirection(letter) && mazeLetter != null && !isStarCell(triple, cell[0], cell[1])) continue;
			matches.add(new int[] { cell[0], cell[1] });
		}
		return matches;
	}
}
