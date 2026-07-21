package ktanesolver.module.modded.regular.blindmaze;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.blindmaze.BlindMazeInput.ButtonColor;
import ktanesolver.module.modded.regular.blindmaze.BlindMazeOutput.Direction;

@Service
@ModuleInfo(
	type = ModuleType.BLIND_MAZE,
	id = "blind-maze",
	name = "Blind Maze",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Find the current default-rule maze and navigate from the colored-button starting position to its exit.",
	tags = { "maze", "colors", "navigation", "modded" }
)
public class BlindMazeSolver extends AbstractModuleSolver<BlindMazeInput, BlindMazeOutput> {
	private static final Direction[] DIRECTIONS = Direction.values();
	private static final int[] ROW_DELTA = { -1, 0, 1, 0 };
	private static final int[] COLUMN_DELTA = { 0, 1, 0, -1 };
	private static final char[] WALLS = { 'U', 'R', 'D', 'L' };
	private static final int[][] COLOR_VALUES = {
		{ 1, 5, 2, 2, 3 }, { 3, 1, 5, 5, 2 }, { 3, 2, 4, 3, 2 }, { 2, 5, 3, 1, 4 }
	};
	private static final String[][] MAZES = {
		maze("UL,U,NDR,LU,UR,LR,DL,U,DR,LR,LD,UR,LD,UR,LDR,LU,R,LUR,DL,UR,DLR,LD,DR,DUL,RD"),
		maze("UDL,UR,NRL,UL,UR,UL,D,RD,RL,RDL,L,U,UD,D,UR,RL,RDL,URL,UDL,R,DL,UD,RD,UDL,RD"),
		maze("UL,URD,GL,URD,LUR,LD,UD,D,UD,R,LUD,U,U,U,DR,LUR,RL,RL,LD,UR,DL,DR,LD,UDR,LRD"),
		maze("ULD,UR,GLD,U,UR,LU,D,DU,DR,LR,L,UR,UL,U,RD,LDR,LRD,RL,L,UR,DLU,DU,DR,LDR,LDR"),
		maze("UL,U,ND,UR,LUR,LDR,LR,LUR,LD,R,LU,D,DR,LU,DR,LR,UDL,RU,DL,RU,DL,UDR,DL,UD,RD"),
		maze("UL,UR,GLD,UD,UR,LR,L,URD,UL,DR,LR,L,UD,,UR,LRD,LR,UL,RD,LR,DLU,RD,DL,DUR,LRD"),
		maze("UL,U,GD,UD,UR,LR,LDR,LU,UR,LR,LR,UDL,DR,L,R,LD,UR,UDL,RD,LR,DLU,D,DRU,DLU,RD"),
		maze("ULD,UR,GRL,ULR,LUR,LU,R,RL,L,DR,LR,LD,R,LD,UR,LR,LRU,LD,UR,LR,DLR,LD,UD,D,RD"),
		maze("UL,UD,GR,UL,URD,LR,UL,D,D,UR,LR,LD,URD,ULD,R,LD,URD,UL,UR,LR,DLU,UD,DR,LD,RD"),
		maze("ULR,LUD,GR,LU,UR,LD,UR,LR,LR,LRD,LUR,DL,D,,DR,L,UR,UL,,UDR,DLR,DL,DR,D,URD")
	};

	@Override
	protected SolveResult<BlindMazeOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, BlindMazeInput input) {
		if (input == null || input.north() == null || input.east() == null || input.south() == null || input.west() == null) {
			return failure("Select a color for all four buttons.");
		}

		ButtonColor[] colors = { input.north(), input.east(), input.south(), input.west() };
		int redButtons = count(colors, ButtonColor.RED);
		int yellowButtons = count(colors, ButtonColor.YELLOW);
		int mazeModules = (int) bomb.getModules().stream()
			.filter(candidate -> candidate.getType() != ModuleType.BLIND_MAZE && candidate.getType().name().contains("MAZE"))
			.count();
		int portTypes = (int) bomb.getPortPlates().stream().flatMap(plate -> plate.getPorts().stream()).distinct().count();

		int rule;
		int rotation;
		boolean calculateBeforeRotation;
		if (redButtons >= 2) { rule = 1; rotation = 1; calculateBeforeRotation = false; }
		else if (bomb.getBatteryCount() >= 5) { rule = 2; rotation = 1; calculateBeforeRotation = true; }
		else if (bomb.hasIndicator("IND")) { rule = 3; rotation = 2; calculateBeforeRotation = false; }
		else if (yellowButtons == 0 && redButtons >= 1) { rule = 4; rotation = 3; calculateBeforeRotation = false; }
		else if (mazeModules >= 1) { rule = 5; rotation = 2; calculateBeforeRotation = true; }
		else if (portTypes <= 1) { rule = 6; rotation = 3; calculateBeforeRotation = true; }
		else { rule = 7; rotation = 0; calculateBeforeRotation = false; }

		int column = (value(0, input.north()) + value(2, input.south()) - 1) % 5;
		int row = (value(1, input.east()) + value(3, input.west()) - 1) % 5;
		int[] canonicalStart = rotate(row, column, calculateBeforeRotation ? 0 : (4 - rotation) % 4);
		int mazeNumber = (bomb.getLastDigit() + (int) bomb.getModules().stream().filter(ModuleEntity::isSolved).count()) % 10;
		List<Direction> moves = path(MAZES[mazeNumber], canonicalStart[0], canonicalStart[1]).stream()
			.map(direction -> DIRECTIONS[(direction.ordinal() + rotation) % 4])
			.toList();
		int[] displayedStart = rotate(canonicalStart[0], canonicalStart[1], rotation);

		storeState(module, "colors", input);
		storeState(module, "buttonColors", Map.of(
			"north", display(input.north()), "east", display(input.east()),
			"south", display(input.south()), "west", display(input.west())
		));
		return success(new BlindMazeOutput(
			mazeNumber, rule, rotationName(rotation), displayedStart[0] + 1, displayedStart[1] + 1, moves
		));
	}

	private static int count(ButtonColor[] colors, ButtonColor color) {
		int count = 0;
		for (ButtonColor candidate : colors) if (candidate == color) count++;
		return count;
	}

	private static int value(int direction, ButtonColor color) {
		return COLOR_VALUES[direction][color.ordinal()];
	}

	private static int[] rotate(int row, int column, int clockwiseQuarters) {
		return switch (clockwiseQuarters) {
			case 1 -> new int[] { column, 4 - row };
			case 2 -> new int[] { 4 - row, 4 - column };
			case 3 -> new int[] { 4 - column, row };
			default -> new int[] { row, column };
		};
	}

	private static List<Direction> path(String[] maze, int startRow, int startColumn) {
		record Cell(int row, int column) {}
		Cell start = new Cell(startRow, startColumn);
		Cell target = new Cell(0, 2);
		ArrayDeque<Cell> queue = new ArrayDeque<>();
		Map<Cell, Cell> previous = new HashMap<>();
		Map<Cell, Direction> move = new HashMap<>();
		queue.add(start);
		previous.put(start, null);

		while (!queue.isEmpty()) {
			Cell current = queue.removeFirst();
			if (current.equals(target)) break;
			for (Direction direction : DIRECTIONS) {
				int nextRow = current.row() + ROW_DELTA[direction.ordinal()];
				int nextColumn = current.column() + COLUMN_DELTA[direction.ordinal()];
				Cell next = new Cell(nextRow, nextColumn);
				if (nextRow < 0 || nextRow >= 5 || nextColumn < 0 || nextColumn >= 5
					|| maze[current.row() * 5 + current.column()].indexOf(WALLS[direction.ordinal()]) >= 0
					|| previous.containsKey(next)) continue;
				previous.put(next, current);
				move.put(next, direction);
				queue.addLast(next);
			}
		}

		List<Direction> result = new ArrayList<>();
		for (Cell current = target; !current.equals(start); current = previous.get(current)) result.add(0, move.get(current));
		result.add(Direction.NORTH);
		return result;
	}

	private static String[] maze(String cells) {
		return cells.split(",", -1);
	}

	private static String display(ButtonColor color) {
		String name = color.name().toLowerCase();
		return Character.toUpperCase(name.charAt(0)) + name.substring(1);
	}

	private static String rotationName(int rotation) {
		return switch (rotation) {
			case 1 -> "90° clockwise";
			case 2 -> "180°";
			case 3 -> "90° counter-clockwise";
			default -> "none";
		};
	}
}
