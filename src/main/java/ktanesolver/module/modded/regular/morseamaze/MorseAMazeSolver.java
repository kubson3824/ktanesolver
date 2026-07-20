package ktanesolver.module.modded.regular.morseamaze;

import java.time.ZoneId;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Queue;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.shared.edgework.BombEdgeworkUtils;
import ktanesolver.module.shared.grid.Cell;
import ktanesolver.module.vanilla.regular.maze.Move;

@Service
@ModuleInfo(
	type = ModuleType.MORSE_A_MAZE,
	id = "morse-a-maze",
	name = "Morse-A-Maze",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Decode the transmitted word and navigate the status light through its invisible maze.",
	tags = {"morse", "maze", "navigation", "modded"}
)
public class MorseAMazeSolver extends AbstractModuleSolver<MorseAMazeInput, MorseAMazeOutput> {
	private static final List<String> MAZE_WORDS = List.of(
		"pulses", "pulse", "cousin", "brass", "spurs", "prove", "guards", "essays", "strobe",
		"stroke", "tactic", "counts", "artist", "opener", "award", "toast", "stayed", "prone"
	);
	private static final List<String> SPECIAL_WORDS = List.of(
		"assay", "mosaic", "rabbit", "stench", "submit", "salads", "tribes", "awards", "count",
		"sword", "apron", "county", "bought", "summit", "things", "music", "tacit", "thinks"
	);
	private static final String[][] HORIZONTAL_WALLS = {
		{"010011", "001110", "010010", "011110", "010010"}, {"101001", "010110", "001010", "010100", "000010"},
		{"010000", "100110", "000000", "000000", "011000"}, {"001110", "000110", "011010", "011110", "011100"},
		{"111100", "011011", "001100", "011010", "001110"}, {"000100", "000010", "011001", "100000", "011010"},
		{"011000", "001110", "110101", "000110", "011100"}, {"001000", "011110", "001100", "010111", "001111"},
		{"001100", "000100", "011010", "000110", "000001"}, {"011010", "000001", "111000", "000110", "011100"},
		{"110010", "000001", "001011", "010110", "011110"}, {"011110", "100110", "011000", "110001", "011010"},
		{"000011", "110110", "001010", "010100", "001010"}, {"010100", "001001", "010110", "101100", "000010"},
		{"011110", "011000", "001010", "110100", "011011"}, {"011100", "101001", "010000", "000010", "010100"},
		{"010000", "110110", "011011", "000001", "000100"}, {"001000", "110110", "001110", "011000", "000100"}
	};
	private static final String[][] VERTICAL_WALLS = {
		{"00100", "10100", "10100", "10010", "00101", "01010"}, {"00100", "01010", "10100", "01011", "11101", "10100"},
		{"00110", "11101", "01101", "11111", "10111", "00010"}, {"01000", "11000", "10101", "10000", "00001", "00101"},
		{"00000", "00001", "01010", "10011", "10001", "10000"}, {"10100", "11101", "01110", "01011", "01110", "00010"},
		{"00010", "10101", "01010", "01001", "11001", "00000"}, {"10010", "00101", "10001", "10100", "11000", "00000"},
		{"10000", "11011", "00101", "11010", "11101", "01010"}, {"00000", "10110", "01111", "01010", "10101", "00001"},
		{"00000", "01110", "11110", "10100", "10000", "00010"}, {"00000", "01001", "01010", "00111", "01010", "00001"},
		{"01000", "10100", "01100", "10011", "01101", "10010"}, {"00100", "11011", "10010", "01001", "11101", "01000"},
		{"00000", "10001", "10011", "01011", "01010", "00000"}, {"00000", "10011", "01110", "10111", "11101", "01000"},
		{"00010", "01101", "00100", "10110", "11111", "01000"}, {"01010", "10101", "01000", "10101", "01011", "10010"}
	};

	@Override
	protected SolveResult<MorseAMazeOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, MorseAMazeInput input) {
		if (input == null || input.word() == null || input.word().isBlank()) return failure("Enter the transmitted word");
		if (!inBounds(input.start()) || !inBounds(input.target())) return failure("Start and target must be coordinates A1–F6");
		if (input.start().equals(input.target())) return failure("Start and target must be different coordinates");
		if (input.mazeValueOverride() != null && input.mazeValueOverride() < 0) return failure("Maze lookup value cannot be negative");

		String word = input.word().trim().toLowerCase(Locale.ROOT);
		int directIndex = MAZE_WORDS.indexOf(word);
		int specialIndex = SPECIAL_WORDS.indexOf(word);
		if (directIndex < 0 && specialIndex < 0) return failure("Word is not in the default Morse-A-Maze manual");

		Integer lookupValue = input.mazeValueOverride();
		if (lookupValue == null && specialIndex >= 0) lookupValue = edgeworkValue(specialIndex, round, bomb);
		if (specialIndex >= 0 && lookupValue == null) return failure("Enter the starting time in minutes as the maze lookup value");
		int mazeIndex = directIndex >= 0 ? directIndex : lookupValue % 18;
		List<Move> moves = findPath(mazeIndex, input.start(), input.target());
		if (moves == null) return failure("No path exists between those coordinates");

		storeState(module, Map.of(
			"input", input,
			"startingLocation", coordinate(input.start()),
			"endingLocation", coordinate(input.target()),
			"morseWord", word,
			"mazeIndex", mazeIndex,
			"mazeWord", MAZE_WORDS.get(mazeIndex),
			"moves", moves
		));
		return success(new MorseAMazeOutput(mazeIndex, MAZE_WORDS.get(mazeIndex), moves));
	}

	private static Integer edgeworkValue(int rule, RoundEntity round, BombEntity bomb) {
		return switch (rule) {
			case 0 -> (int) bomb.getModules().stream()
				.filter(ModuleEntity::isSolved)
				.filter(module -> !module.getType().isNeedy())
				.count();
			case 1 -> bomb.getBatteryCount();
			case 2 -> bomb.getBatteryHolders();
			case 3 -> BombEdgeworkUtils.getDistinctPortTypeCount(bomb);
			case 4 -> BombEdgeworkUtils.getTotalPortCount(bomb);
			case 5 -> (int) BombEdgeworkUtils.getLitIndicatorCount(bomb);
			case 6 -> (int) BombEdgeworkUtils.getUnlitIndicatorCount(bomb);
			case 7 -> bomb.getIndicators().size();
			case 8 -> BombEdgeworkUtils.countUnsolvedRegularModules(bomb);
			case 9 -> bomb.getPortPlates().size();
			case 10 -> bomb.getLastDigit();
			case 11 -> BombEdgeworkUtils.getSerialDigitSum(bomb);
			case 12 -> bomb.getStrikes();
			case 13 -> BombEdgeworkUtils.getFirstSerialDigit(bomb);
			case 14 -> null;
			case 15 -> round.getStartTime() == null ? null
				: round.getStartTime().atZone(ZoneId.systemDefault()).getDayOfWeek().getValue() % 7;
			case 16 -> (int) bomb.getPortPlates().stream().filter(plate -> plate.getPorts().isEmpty()).count();
			case 17 -> firstSerialLetterIndex(bomb.getSerialNumber());
			default -> throw new IllegalArgumentException("Unknown Morse-A-Maze rule");
		};
	}

	private static int firstSerialLetterIndex(String serial) {
		if (serial == null) return 0;
		return serial.toUpperCase(Locale.ROOT).chars().filter(Character::isLetter).map(c -> c - 'A').findFirst().orElse(0);
	}

	private static List<Move> findPath(int maze, Cell start, Cell target) {
		Queue<Cell> queue = new ArrayDeque<>();
		Map<Cell, Cell> previous = new HashMap<>();
		Map<Cell, Move> moveUsed = new HashMap<>();
		queue.add(start);
		previous.put(start, null);

		while (!queue.isEmpty()) {
			Cell current = queue.remove();
			if (current.equals(target)) break;
			for (Move move : Move.values()) {
				Cell next = move(current, move);
				if (next == null || previous.containsKey(next) || !canMove(maze, current, move)) continue;
				previous.put(next, current);
				moveUsed.put(next, move);
				queue.add(next);
			}
		}
		if (!previous.containsKey(target)) return null;

		List<Move> path = new ArrayList<>();
		for (Cell current = target; !current.equals(start); current = previous.get(current)) path.add(moveUsed.get(current));
		Collections.reverse(path);
		return path;
	}

	private static boolean canMove(int maze, Cell cell, Move move) {
		int row = cell.row() - 1;
		int col = cell.col() - 1;
		return switch (move) {
			case UP -> row > 0 && HORIZONTAL_WALLS[maze][row - 1].charAt(col) == '0';
			case DOWN -> row < 5 && HORIZONTAL_WALLS[maze][row].charAt(col) == '0';
			case LEFT -> col > 0 && VERTICAL_WALLS[maze][row].charAt(col - 1) == '0';
			case RIGHT -> col < 5 && VERTICAL_WALLS[maze][row].charAt(col) == '0';
		};
	}

	private static Cell move(Cell cell, Move move) {
		return switch (move) {
			case UP -> cell.row() > 1 ? new Cell(cell.row() - 1, cell.col()) : null;
			case DOWN -> cell.row() < 6 ? new Cell(cell.row() + 1, cell.col()) : null;
			case LEFT -> cell.col() > 1 ? new Cell(cell.row(), cell.col() - 1) : null;
			case RIGHT -> cell.col() < 6 ? new Cell(cell.row(), cell.col() + 1) : null;
		};
	}

	private static boolean inBounds(Cell cell) {
		return cell != null && cell.row() >= 1 && cell.row() <= 6 && cell.col() >= 1 && cell.col() <= 6;
	}

	private static String coordinate(Cell cell) {
		return String.valueOf((char) ('A' + cell.col() - 1)) + cell.row();
	}
}
