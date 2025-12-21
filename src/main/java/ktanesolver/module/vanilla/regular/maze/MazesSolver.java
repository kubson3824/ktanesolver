
package ktanesolver.module.vanilla.regular.maze;

import java.util.*;

import org.springframework.stereotype.Service;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.ModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

@Service
public class MazesSolver implements ModuleSolver<MazesInput, MazesOutput> {

	@Override
	public ModuleType getType() {
		return ModuleType.MAZES;
	}

	@Override
	public Class<MazesInput> inputType() {
		return MazesInput.class;
	}

	@Override
	public SolveResult<MazesOutput> solve(RoundEntity round, BombEntity bomb, ModuleEntity module, MazesInput input) {
		Maze maze = MazeRegistry.find(input.marker1(), input.marker2());

		List<Move> path = solveMaze(maze, input.start(), input.target());

		module.setSolved(true);

		return new SolveSuccess<>(new MazesOutput(path), true);
	}

	private List<Move> solveMaze(Maze maze, Cell start, Cell target) {
		Queue<Cell> queue = new ArrayDeque<>();
		Map<Cell, Cell> prev = new HashMap<>();
		Map<Cell, Move> moveUsed = new HashMap<>();

		queue.add(start);
		prev.put(start, null);

		while( !queue.isEmpty()) {
			Cell cur = queue.poll();
			if(cur.equals(target))
				break;

			for(Move m: Move.values()) {
				Cell next = move(cur, m);
				if(next == null)
					continue;
				if(prev.containsKey(next))
					continue;
				if( !canMove(maze, cur, m))
					continue;

				prev.put(next, cur);
				moveUsed.put(next, m);
				queue.add(next);
			}
		}

		// Reconstruct path
		List<Move> path = new ArrayList<>();
		Cell cur = target;
		while( !cur.equals(start)) {
			Move m = moveUsed.get(cur);
			path.add(m);
			cur = prev.get(cur);
		}

		Collections.reverse(path);
		return path;
	}

	private boolean canMove(Maze maze, Cell c, Move m) {
		int r = c.row() - 1;
		int col = c.col() - 1;

		return switch(m) {
			case UP -> r > 0 && !maze.horizontalWalls()[r - 1][col];
			case DOWN -> r < 5 && !maze.horizontalWalls()[r][col];
			case LEFT -> col > 0 && !maze.verticalWalls()[r][col - 1];
			case RIGHT -> col < 5 && !maze.verticalWalls()[r][col];
		};
	}

	private Cell move(Cell c, Move m) {
		return switch(m) {
			case UP -> c.row() > 1 ? new Cell(c.row() - 1, c.col()) : null;
			case DOWN -> c.row() < 6 ? new Cell(c.row() + 1, c.col()) : null;
			case LEFT -> c.col() > 1 ? new Cell(c.row(), c.col() - 1) : null;
			case RIGHT -> c.col() < 6 ? new Cell(c.row(), c.col() + 1) : null;
		};
	}

}
