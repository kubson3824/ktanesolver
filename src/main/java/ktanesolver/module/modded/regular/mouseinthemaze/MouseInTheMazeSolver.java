
package ktanesolver.module.modded.regular.mouseinthemaze;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
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
import ktanesolver.module.vanilla.regular.maze.Cell;

@Service
@ModuleInfo(
	type = ModuleType.MOUSE_IN_THE_MAZE,
	id = "mouse-in-the-maze",
	name = "Mouse In The Maze",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Navigate the mouse to the accepting colored sphere and press the button. Target sphere depends on torus color.",
	tags = { "mouse", "maze", "modded", "navigation" },
	hasInput = true,
	hasOutput = true
)
public class MouseInTheMazeSolver extends AbstractModuleSolver<MouseInTheMazeInput, MouseInTheMazeOutput> {

	private static final int SIZE = 10;
	/** Cost for BACKWARD moves; FORWARD/TURN_LEFT/TURN_RIGHT cost 1. Higher value = prefer fewer backward steps. */
	private static final int BACKWARD_COST = 100;

	@Override
	protected SolveResult<MouseInTheMazeOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, MouseInTheMazeInput input) {
		int mazeIndex;
		Cell start;

		if (input.useSphereIdentification()) {
			int[] d = input.stepsToWall();
			List<MouseInTheMazeDefinitions.SphereIdentificationResult> matches = new ArrayList<>(
				new LinkedHashSet<>(MouseInTheMazeDefinitions.resolveFromSphereAndDistances(
					input.sphereColorAtPosition(), d[0], d[1], d[2], d[3])));
			if (matches.isEmpty()) {
				return failure("Cannot identify maze; check sphere colour and the four distances.");
			}
			if (matches.size() > 1) {
				return failure("Ambiguous; multiple mazes match. Re-check the four distances.");
			}
			mazeIndex = matches.get(0).mazeIndex();
			start = matches.get(0).cell();
		} else {
			if (input.mazeIndex() == null || input.mazeIndex() < 1 || input.mazeIndex() > 6) {
				return failure("mazeIndex must be 1–6");
			}
			mazeIndex = input.mazeIndex();
			start = input.start();
			if (start == null || !inBounds(start)) {
				return failure("Start position must be row and column 1–10");
			}
		}

		Direction startDir = input.startDirection() != null ? input.startDirection() : Direction.UP;

		MouseInTheMazeMaze maze = MouseInTheMazeDefinitions.getMaze(mazeIndex);
		SphereColor targetSphere = MouseInTheMazeDefinitions.getTargetSphere(mazeIndex, input.torusColor());
		Cell targetCell = maze.spherePositions().get(targetSphere);
		if (targetCell == null || !inBounds(targetCell)) {
			return failure("Target sphere position is not defined for this maze");
		}

		List<MouseMove> path = findPath(maze, start, startDir, targetCell);
		if (path == null) {
			return failure("No path from start to target sphere");
		}

		storeState(module, "input", input);
		return success(new MouseInTheMazeOutput(targetSphere, targetCell, path, maze, start));
	}

	private boolean inBounds(Cell c) {
		return c.row() >= 1 && c.row() <= SIZE && c.col() >= 1 && c.col() <= SIZE;
	}

	/** Admissible heuristic: minimum number of steps (at cost 1) needed to reach target in the absence of walls. */
	private static int manhattan(Cell from, Cell to) {
		return Math.abs(from.row() - to.row()) + Math.abs(from.col() - to.col());
	}

	/** A* from (start, startDir) to targetCell. Prefers FORWARD/turns (cost 1) over BACKWARD (cost BACKWARD_COST). Heuristic: Manhattan distance to goal. Returns list of moves or null. */
	private List<MouseMove> findPath(MouseInTheMazeMaze maze, Cell start, Direction startDir, Cell targetCell) {
		record State(Cell cell, Direction dir) {}
		record ScoredState(int cost, State state) {}
		Map<State, Integer> bestCost = new HashMap<>();
		Map<State, State> prev = new HashMap<>();
		Map<State, MouseMove> moveToReach = new HashMap<>();
		PriorityQueue<ScoredState> queue = new PriorityQueue<>(
			Comparator.comparingInt(sc -> sc.cost() + manhattan(sc.state().cell(), targetCell)));

		State initial = new State(start, startDir);
		bestCost.put(initial, 0);
		prev.put(initial, null);
		moveToReach.put(initial, null);
		queue.add(new ScoredState(0, initial));

		while (!queue.isEmpty()) {
			ScoredState scored = queue.poll();
			int cost = scored.cost();
			State s = scored.state();
			if (cost > bestCost.getOrDefault(s, Integer.MAX_VALUE)) {
				continue;
			}
			if (s.cell().equals(targetCell)) {
				List<MouseMove> path = new ArrayList<>();
				State cur = s;
				while (true) {
					MouseMove m = moveToReach.get(cur);
					if (m == null) break;
					path.add(0, m);
					cur = prev.get(cur);
					Objects.requireNonNull(cur);
				}
				return path;
			}

			int moveCost;
			// FORWARD
			Cell nextF = step(s.cell(), s.dir(), true);
			if (nextF != null && canGo(maze, s.cell(), s.dir(), true)) {
				State fState = new State(nextF, s.dir());
				moveCost = 1;
				int newCost = cost + moveCost;
				if (newCost < bestCost.getOrDefault(fState, Integer.MAX_VALUE)) {
					bestCost.put(fState, newCost);
					prev.put(fState, s);
					moveToReach.put(fState, MouseMove.FORWARD);
					queue.add(new ScoredState(newCost, fState));
				}
			}

			// TURN_RIGHT
			Direction right = turnRight(s.dir());
			State rightState = new State(s.cell(), right);
			moveCost = 1;
			int newCostRight = cost + moveCost;
			if (newCostRight < bestCost.getOrDefault(rightState, Integer.MAX_VALUE)) {
				bestCost.put(rightState, newCostRight);
				prev.put(rightState, s);
				moveToReach.put(rightState, MouseMove.TURN_RIGHT);
				queue.add(new ScoredState(newCostRight, rightState));
			}

			// TURN_LEFT
			Direction left = turnLeft(s.dir());
			State leftState = new State(s.cell(), left);
			moveCost = 1;
			int newCostLeft = cost + moveCost;
			if (newCostLeft < bestCost.getOrDefault(leftState, Integer.MAX_VALUE)) {
				bestCost.put(leftState, newCostLeft);
				prev.put(leftState, s);
				moveToReach.put(leftState, MouseMove.TURN_LEFT);
				queue.add(new ScoredState(newCostLeft, leftState));
			}

			// BACKWARD (high cost so used only when necessary)
			Cell nextB = step(s.cell(), s.dir(), false);
			if (nextB != null && canGo(maze, s.cell(), s.dir(), false)) {
				State bState = new State(nextB, s.dir());
				moveCost = BACKWARD_COST;
				int newCostBack = cost + moveCost;
				if (newCostBack < bestCost.getOrDefault(bState, Integer.MAX_VALUE)) {
					bestCost.put(bState, newCostBack);
					prev.put(bState, s);
					moveToReach.put(bState, MouseMove.BACKWARD);
					queue.add(new ScoredState(newCostBack, bState));
				}
			}
		}
		return null;
	}

	private Direction turnLeft(Direction d) {
		return switch (d) {
			case UP -> Direction.LEFT;
			case LEFT -> Direction.DOWN;
			case DOWN -> Direction.RIGHT;
			case RIGHT -> Direction.UP;
		};
	}

	private Direction turnRight(Direction d) {
		return switch (d) {
			case UP -> Direction.RIGHT;
			case RIGHT -> Direction.DOWN;
			case DOWN -> Direction.LEFT;
			case LEFT -> Direction.UP;
		};
	}

	/** One cell in the given direction; forward=true means move in dir, false means opposite. */
	private Cell step(Cell c, Direction dir, boolean forward) {
		int dr = 0, dc = 0;
		switch (dir) {
			case UP -> dr = -1;
			case DOWN -> dr = 1;
			case LEFT -> dc = -1;
			case RIGHT -> dc = 1;
		}
		if (!forward) {
			dr = -dr;
			dc = -dc;
		}
		int nr = c.row() + dr;
		int nc = c.col() + dc;
		if (nr < 1 || nr > SIZE || nc < 1 || nc > SIZE) return null;
		return new Cell(nr, nc);
	}

	/** Can we move from cell in direction? forward=true means step in dir, false means step backward. */
	private boolean canGo(MouseInTheMazeMaze maze, Cell c, Direction dir, boolean forward) {
		int r = c.row() - 1;
		int col = c.col() - 1;
		boolean[][] h = maze.horizontalWalls();
		boolean[][] v = maze.verticalWalls();

		if (forward) {
			return switch (dir) {
				case UP -> r > 0 && !h[r - 1][col];
				case DOWN -> r < SIZE - 1 && !h[r][col];
				case LEFT -> col > 0 && !v[r][col - 1];
				case RIGHT -> col < SIZE - 1 && !v[r][col];
			};
		} else {
			return switch (dir) {
				case UP -> r < SIZE - 1 && !h[r][col];   // going down from c
				case DOWN -> r > 0 && !h[r - 1][col];
				case LEFT -> col < SIZE - 1 && !v[r][col];
				case RIGHT -> col > 0 && !v[r][col - 1];
			};
		}
	}
}
