package ktanesolver.module.modded.regular.threedmaze;

/**
 * 8×8 maze grid with cyclic wrap (row/col 0–7). Player can cross edges and reappear on the opposite side
 * unless a wall is defined on that boundary.
 * <p>
 * Convention: {@code false} = no wall (passable), {@code true} = wall (blocked).
 * <p>
 * horizontalWalls[r][c] = wall between cell (r, c) and (r+1 mod 8, c). Dimensions 8×8.
 * verticalWalls[r][c] = wall between cell (r, c) and (r, c+1 mod 8). Dimensions 8×8.
 * <p>
 * starPositions: 3 cells where direction markers (stars) appear; each int[] is {row, col} 0-based. May be null.
 * letterGrid: 8×8 floor letter at each cell (A/B/C/D/H). May be null.
 */
public record ThreeDMazeMaze(
	boolean[][] horizontalWalls,
	boolean[][] verticalWalls,
	int[][] starPositions,
	String[][] letterGrid
) {

	private static final int SIZE = 8;

	public ThreeDMazeMaze {
		if (horizontalWalls == null || horizontalWalls.length != SIZE || horizontalWalls[0].length != SIZE) {
			throw new IllegalArgumentException("horizontalWalls must be 8×8");
		}
		if (verticalWalls == null || verticalWalls.length != SIZE || verticalWalls[0].length != SIZE) {
			throw new IllegalArgumentException("verticalWalls must be 8×8");
		}
		if (starPositions != null && starPositions.length != 3) {
			throw new IllegalArgumentException("starPositions must be null or length 3");
		}
		if (letterGrid != null && (letterGrid.length != SIZE || letterGrid[0].length != SIZE)) {
			throw new IllegalArgumentException("letterGrid must be null or 8×8");
		}
	}

	/** Creates an empty maze (no walls, no stars, no letters). */
	public static ThreeDMazeMaze empty() {
		return new ThreeDMazeMaze(new boolean[SIZE][SIZE], new boolean[SIZE][SIZE], null, null);
	}
}
