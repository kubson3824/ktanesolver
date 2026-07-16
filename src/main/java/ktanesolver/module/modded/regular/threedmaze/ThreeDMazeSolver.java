package ktanesolver.module.modded.regular.threedmaze;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.PriorityQueue;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
	type = ModuleType.THREE_D_MAZE,
	id = "3d-maze",
	name = "3D Maze",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Navigate the default-rule 3D maze from observed letters, walls, and goal direction.",
	tags = { "maze", "3d", "modded", "navigation" },
	hasInput = true,
	hasOutput = true
)
public class ThreeDMazeSolver extends AbstractModuleSolver<ThreeDMazeInput, ThreeDMazeOutput> {

	private static final String MAZE_GAMER = "MAZE GAMER";
	private static final String HELP_IM_LOST = "HELP IM LOST";
	private static final int SIZE = 8;

	@Override
	protected SolveResult<ThreeDMazeOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, ThreeDMazeInput input) {
		if (input.starLetters() == null || input.starLetters().size() != 3) {
			return failure("Exactly 3 maze letters (A/B/C/D/H) are required.");
		}

		String sortedTriple = ThreeDMazeDefinitions.toSortedTriple(input.starLetters());
		if (sortedTriple == null) {
			return failure("Each maze letter must be one of A, B, C, D, H.");
		}

		if (!ThreeDMazeDefinitions.isKnownMazeTriple(sortedTriple)) {
			return failure("Choose three distinct maze letters.");
		}
		storeState(module, "markings", sortedTriple);
		ThreeDMazeMaze maze = ThreeDMazeDefinitions.getMaze(sortedTriple);
		String goalDirection = normalizeDirection(input.goalDirection());
		if (goalDirection != null) storeState(module, "cardinalDirection", directionName(goalDirection));

		int originRow = computeRow(bomb);
		int originCol = computeColumn(bomb);
		if (originRow < 0 || originCol < 0) {
			return failure("Serial number must contain at least one digit to compute row and column.");
		}

		int startRow;
		int startCol;
		String startFacing;

		if (input.hasExactPosition()) {
			startRow = input.currentRow();
			startCol = input.currentCol();
			startFacing = normalizeDirection(input.currentFacing());
			if (startRow < 0 || startRow >= SIZE || startCol < 0 || startCol >= SIZE || startFacing == null) {
				return failure("Current row, column, and facing must describe a valid maze state.");
			}
		} else if (input.useDistanceIdentification()) {
			int[] steps = input.stepsToWall();
			for (int distance : steps) {
				if (distance < 0 || distance >= SIZE) return failure("Wall distances must be between 0 and 7.");
			}
			String givenFacing = normalizeDirection(input.currentFacing());
			if (givenFacing != null) {
				int[] cardinal = relativeToCardinalDistances(givenFacing, steps);
				List<int[]> matches = ThreeDMazeDefinitions.resolvePositionFromDistances(
					sortedTriple,
					input.letterAtPosition(),
					cardinal[0], cardinal[1], cardinal[2], cardinal[3]
				);
				if (matches.isEmpty()) {
					return failure("Cannot identify position; check the letter and the four distances to walls.");
				}
				if (matches.size() > 1) {
					return failure("Ambiguous position; multiple cells match. Re-check the four distances.");
				}
				startRow = matches.get(0)[0];
				startCol = matches.get(0)[1];
				startFacing = givenFacing;
			} else {
				List<Position> candidates = new ArrayList<>();
				for (String candidateFacing : new String[] { "N", "S", "E", "W" }) {
					int[] cardinal = relativeToCardinalDistances(candidateFacing, steps);
					for (int[] match : ThreeDMazeDefinitions.resolvePositionFromDistances(
						sortedTriple,
						input.letterAtPosition(),
						cardinal[0], cardinal[1], cardinal[2], cardinal[3]
					)) {
						candidates.add(new Position(match[0], match[1], candidateFacing));
					}
				}
				if (candidates.isEmpty()) return failure("Cannot identify position; check the symbol and wall distances.");
				if (candidates.size() > 1) return failure("Ambiguous position; add the current floor symbol or re-check the ordered distances.");
				Position position = candidates.get(0);
				startRow = position.row();
				startCol = position.col();
				startFacing = position.facing();
			}
		} else {
			if (goalDirection == null) {
				return failure("Provide the current observation to get guidance to a direction marker.");
			}
			GoalWall wall = findGoalWall(maze, originRow, originCol, goalDirection);
			return wall == null ? failure("Goal wall not found in this maze.") : success(new ThreeDMazeOutput(wall.row(), wall.col(), goalDirection));
		}

		if (goalDirection == null) {
			int[][] stars = ThreeDMazeDefinitions.getStarPositions(sortedTriple);
			List<ThreeDMazeMove> bestPath = null;
			for (int[] star : stars) {
				List<ThreeDMazeMove> path = findPathToCell(maze, startRow, startCol, startFacing, star[0], star[1]);
				if (path != null && (bestPath == null || path.size() < bestPath.size())) bestPath = path;
			}
			if (bestPath == null) return failure("No path from current position to any direction marker.");
			return success(new ThreeDMazeOutput(
				originRow, originCol, null,
				bestPath, startRow, startCol, startFacing,
				"go_to_star",
				"Report the direction (N/S/E/W) when you reach the star, then solve again with that direction.",
				maze
			), false);
		}

		GoalWall wall = findGoalWall(maze, originRow, originCol, goalDirection);
		if (wall == null) return failure("Goal wall not found in this maze.");
		int[] farSide = step(wall.row(), wall.col(), goalDirection);
		List<ThreeDMazeMove> nearPath = findPath(maze, startRow, startCol, startFacing, wall.row(), wall.col(), goalDirection);
		List<ThreeDMazeMove> farPath = findPath(maze, startRow, startCol, startFacing, farSide[0], farSide[1], opposite(goalDirection));
		List<ThreeDMazeMove> moves = nearPath == null || (farPath != null && farPath.size() < nearPath.size()) ? farPath : nearPath;
		if (moves == null) return failure("No path from current position to the goal wall.");
		moves = new ArrayList<>(moves);
		moves.add(ThreeDMazeMove.FORWARD);
		return success(new ThreeDMazeOutput(
			wall.row(), wall.col(), goalDirection, moves, startRow, startCol, startFacing,
			"go_to_goal",
			"Follow every move; the final Forward passes through the goal wall.",
			maze
		));
	}

	private record Position(int row, int col, String facing) {}
	private record GoalWall(int row, int col) {}

	/** A* from (startRow, startCol, startFacing) to (goalRow, goalCol) with any facing. Used for path to star. */
	private List<ThreeDMazeMove> findPathToCell(ThreeDMazeMaze maze, int startRow, int startCol, String startFacing, int goalRow, int goalCol) {
		List<ThreeDMazeMove> best = null;
		int bestLen = Integer.MAX_VALUE;
		for (String goalFacing : new String[] { "N", "S", "E", "W" }) {
			List<ThreeDMazeMove> path = findPath(maze, startRow, startCol, startFacing, goalRow, goalCol, goalFacing);
			if (path != null && path.size() < bestLen) {
				bestLen = path.size();
				best = path;
			}
		}
		return best;
	}

	/** A* from (startRow, startCol, startFacing) to (goalRow, goalCol, goalFacing). Cyclic 8×8. */
	private List<ThreeDMazeMove> findPath(ThreeDMazeMaze maze, int startRow, int startCol, String startFacing,
			int goalRow, int goalCol, String goalFacing) {
		record State(int r, int c, String dir) {}
		record ScoredState(int cost, State state) {}
		Map<State, Integer> bestCost = new HashMap<>();
		Map<State, State> prev = new HashMap<>();
		Map<State, ThreeDMazeMove> moveToReach = new HashMap<>();
		PriorityQueue<ScoredState> queue = new PriorityQueue<>(
			Comparator.comparingInt(sc -> sc.cost() + manhattanCyclic(sc.state().r(), sc.state().c(), goalRow, goalCol)));

		State initial = new State(startRow, startCol, startFacing);
		bestCost.put(initial, 0);
		prev.put(initial, null);
		moveToReach.put(initial, null);
		queue.add(new ScoredState(0, initial));

		while (!queue.isEmpty()) {
			ScoredState scored = queue.poll();
			int cost = scored.cost();
			State s = scored.state();
			if (cost > bestCost.getOrDefault(s, Integer.MAX_VALUE)) continue;
			if (s.r() == goalRow && s.c() == goalCol && (goalFacing == null || s.dir().equals(goalFacing))) {
				List<ThreeDMazeMove> path = new ArrayList<>();
				State cur = s;
				while (true) {
					ThreeDMazeMove m = moveToReach.get(cur);
					if (m == null) break;
					path.add(0, m);
					cur = prev.get(cur);
					Objects.requireNonNull(cur);
				}
				return path;
			}

			// FORWARD
			int[] nextF = step(s.r(), s.c(), s.dir());
			if (nextF != null && canGo(maze, s.r(), s.c(), s.dir())) {
				State fState = new State(nextF[0], nextF[1], s.dir());
				int newCost = cost + 1;
				if (newCost < bestCost.getOrDefault(fState, Integer.MAX_VALUE)) {
					bestCost.put(fState, newCost);
					prev.put(fState, s);
					moveToReach.put(fState, ThreeDMazeMove.FORWARD);
					queue.add(new ScoredState(newCost, fState));
				}
			}
			// TURN_LEFT
			String left = turnLeft(s.dir());
			State leftState = new State(s.r(), s.c(), left);
			if (cost + 1 < bestCost.getOrDefault(leftState, Integer.MAX_VALUE)) {
				bestCost.put(leftState, cost + 1);
				prev.put(leftState, s);
				moveToReach.put(leftState, ThreeDMazeMove.TURN_LEFT);
				queue.add(new ScoredState(cost + 1, leftState));
			}
			// TURN_RIGHT
			String right = turnRight(s.dir());
			State rightState = new State(s.r(), s.c(), right);
			if (cost + 1 < bestCost.getOrDefault(rightState, Integer.MAX_VALUE)) {
				bestCost.put(rightState, cost + 1);
				prev.put(rightState, s);
				moveToReach.put(rightState, ThreeDMazeMove.TURN_RIGHT);
				queue.add(new ScoredState(cost + 1, rightState));
			}
		}
		return null;
	}

	private static int manhattanCyclic(int r1, int c1, int r2, int c2) {
		int dr = Math.min(Math.abs(r1 - r2), SIZE - Math.abs(r1 - r2));
		int dc = Math.min(Math.abs(c1 - c2), SIZE - Math.abs(c1 - c2));
		return dr + dc;
	}

	private static String turnLeft(String d) {
		return switch (d) {
			case "N" -> "W";
			case "W" -> "S";
			case "S" -> "E";
			case "E" -> "N";
			default -> d;
		};
	}

	private static String turnRight(String d) {
		return switch (d) {
			case "N" -> "E";
			case "E" -> "S";
			case "S" -> "W";
			case "W" -> "N";
			default -> d;
		};
	}

	private static GoalWall findGoalWall(ThreeDMazeMaze maze, int row, int col, String direction) {
		for (int i = 0; i < SIZE; i++) {
			if (!canGo(maze, row, col, direction)) return new GoalWall(row, col);
			int[] next = step(row, col, direction);
			row = next[0];
			col = next[1];
		}
		return null;
	}

	/** Returns [nextRow, nextCol] with cyclic wrap, or null if invalid. */
	private static int[] step(int r, int c, String dir) {
		int dr = 0, dc = 0;
		switch (dir) {
			case "N" -> dr = -1;
			case "S" -> dr = 1;
			case "W" -> dc = -1;
			case "E" -> dc = 1;
			default -> { return null; }
		}
		return new int[] { (r + dr + SIZE) % SIZE, (c + dc + SIZE) % SIZE };
	}

	private static boolean canGo(ThreeDMazeMaze maze, int r, int c, String dir) {
		boolean[][] h = maze.horizontalWalls();
		boolean[][] v = maze.verticalWalls();
		return switch (dir) {
			case "N" -> !h[(r - 1 + SIZE) % SIZE][c];
			case "S" -> !h[r][c];
			case "W" -> !v[r][(c - 1 + SIZE) % SIZE];
			case "E" -> !v[r][c];
			default -> false;
		};
	}

	private static String normalizeDirection(String direction) {
		if (direction == null) return null;
		String u = direction.trim().toUpperCase();
		return ThreeDMazeDefinitions.isValidDirection(u) ? u : null;
	}

	private static String directionName(String direction) {
		return switch (direction) { case "N" -> "North"; case "S" -> "South"; case "E" -> "East"; default -> "West"; };
	}

	private static String opposite(String direction) {
		return switch (direction) { case "N" -> "S"; case "S" -> "N"; case "E" -> "W"; default -> "E"; };
	}

	/**
	 * Converts relative distances [front, right, behind, left] to cardinal [north, south, east, west]
	 * using the given facing direction. Returns null if facing is not N/S/E/W or steps length is not 4.
	 */
	private static int[] relativeToCardinalDistances(String facing, int[] steps) {
		if (facing == null || steps == null || steps.length != 4) return null;
		int f = steps[0], r = steps[1], b = steps[2], l = steps[3];
		return switch (facing) {
			case "N" -> new int[] { f, b, r, l }; // N, S, E, W
			case "S" -> new int[] { b, f, l, r };
			case "E" -> new int[] { l, r, f, b };
			case "W" -> new int[] { r, l, b, f };
			default -> null;
		};
	}

	private int computeRow(BombEntity bomb) {
		int row = firstNumericDigit(bomb.getSerialNumber());
		if (row < 0) return -1;
		for (var e : bomb.getIndicators().entrySet()) {
			if (Boolean.FALSE.equals(e.getValue()) && hasLetterFrom(e.getKey(), MAZE_GAMER)) {
				row++;
			}
		}
		return Math.floorMod(row, SIZE);
	}

	private int computeColumn(BombEntity bomb) {
		int col = lastNumericDigit(bomb.getSerialNumber());
		if (col < 0) return -1;
		for (var e : bomb.getIndicators().entrySet()) {
			if (Boolean.TRUE.equals(e.getValue()) && hasLetterFrom(e.getKey(), HELP_IM_LOST)) {
				col++;
			}
		}
		return Math.floorMod(col, SIZE);
	}

	/** Returns the first numeric digit (0-9), or -1 if none. */
	private static int firstNumericDigit(String serial) {
		if (serial == null) return -1;
		for (int i = 0; i < serial.length(); i++) {
			char c = serial.charAt(i);
			if (Character.isDigit(c)) return c - '0';
		}
		return -1;
	}

	/** Returns the last numeric digit (0-9), or -1 if none. */
	private static int lastNumericDigit(String serial) {
		if (serial == null) return -1;
		for (int i = serial.length() - 1; i >= 0; i--) {
			char c = serial.charAt(i);
			if (Character.isDigit(c)) return c - '0';
		}
		return -1;
	}

	private static boolean hasLetterFrom(String indicatorLabel, String allowedLetters) {
		if (indicatorLabel == null || allowedLetters == null) {
			return false;
		}
		String upper = indicatorLabel.toUpperCase();
		for (int i = 0; i < allowedLetters.length(); i++) {
			if (upper.indexOf(allowedLetters.charAt(i)) >= 0) {
				return true;
			}
		}
		return false;
	}
}
