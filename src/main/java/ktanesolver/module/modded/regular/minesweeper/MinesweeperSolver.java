package ktanesolver.module.modded.regular.minesweeper;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

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
	type = ModuleType.MINESWEEPER,
	id = "MinesweeperModule",
	name = "Minesweeper",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Find the colored starting cell, then identify forced mines and safe cells on the 8×10 grid.",
	tags = { "8×10 grid", "colors", "deduction", "mines" }
)
public class MinesweeperSolver extends AbstractModuleSolver<MinesweeperInput, MinesweeperOutput> {
	private static final int WIDTH = 8;
	private static final int HEIGHT = 10;
	private static final int MINE_COUNT = 12;
	private static final Set<String> COLORS = Set.of("red", "orange", "yellow", "green", "blue", "purple", "black");
	private static final Map<String, Integer> COLOR_VALUES = Map.of(
		"red", 5, "orange", 2, "yellow", 3, "green", 1, "blue", 6, "purple", 4);

	@Override
	protected SolveResult<MinesweeperOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, MinesweeperInput input) {
		if(input == null || input.colors() == null || input.colors().size() != WIDTH * HEIGHT) {
			return failure("Enter the colors of all 80 cells");
		}

		List<ColoredCell> coloredCells = new ArrayList<>();
		Set<String> seenColors = new HashSet<>();
		for(int index = 0; index < input.colors().size(); index++) {
			String rawColor = input.colors().get(index);
			if(rawColor == null || rawColor.isBlank()) continue;
			String color = rawColor.strip().toLowerCase(Locale.ROOT);
			if(!COLORS.contains(color)) return failure("Cell colors must be red, orange, yellow, green, blue, purple, or black");
			if(!seenColors.add(color)) return failure("Each colored cell must have a different color");
			coloredCells.add(new ColoredCell(index, color));
		}
		if(coloredCells.size() < 5 || coloredCells.size() > 7) return failure("Mark the 5 to 7 colored cells shown on the module");

		String serial = bomb.getSerialNumber();
		List<Integer> digits = serial.chars().filter(Character::isDigit).map(ch -> ch - '0').boxed().toList();
		int firstLetter = serial.chars().filter(Character::isLetter).map(Character::toUpperCase).findFirst().orElse('A') - 'A' + 1;
		if(digits.size() < 2) return failure("The bomb serial number must contain at least two digits");

		int firstCount = digits.get(1) == 0 ? 10 : digits.get(1);
		ColoredCell selected = coloredCells.get((firstCount - 1) % coloredCells.size());
		Integer colorValue = COLOR_VALUES.get(selected.color());
		if(colorValue == null) return failure("The serial-number count cannot land on the black cell; recheck the colors");
		int reverseIndex = (colorValue + firstLetter - 1) % coloredCells.size();
		ColoredCell starting = coloredCells.get(coloredCells.size() - 1 - reverseIndex);
		storeState(module, "input", input);

		if(input.board() == null) {
			return success(new MinesweeperOutput(coordinate(starting.index()), starting.color(), List.of(), List.of()), false);
		}

		String validation = validateBoard(input.board());
		if(validation != null) return failure(validation);
		char[] board = String.join("", input.board()).toUpperCase(Locale.ROOT).toCharArray();
		LinkedHashSet<Integer> mines = new LinkedHashSet<>();
		LinkedHashSet<Integer> safe = new LinkedHashSet<>();
		boolean changed;
		do {
			changed = false;
			for(int index = 0; index < board.length; index++) {
				if(board[index] != '.' && (board[index] < '0' || board[index] > '8')) continue;
				int clue = board[index] == '.' ? 0 : board[index] - '0';
				int knownMines = 0;
				List<Integer> candidates = new ArrayList<>();
				for(int neighbor : neighbors(index)) {
					if(board[neighbor] == 'F' || mines.contains(neighbor)) knownMines++;
					else if(board[neighbor] == '?' && !safe.contains(neighbor)) candidates.add(neighbor);
				}
				int remaining = clue - knownMines;
				if(remaining < 0 || remaining > candidates.size()) return failure("The entered board contradicts the clue at " + coordinate(index));
				if(remaining == 0) changed |= safe.addAll(candidates);
				else if(remaining == candidates.size()) changed |= mines.addAll(candidates);
				if(!java.util.Collections.disjoint(mines, safe)) return failure("The entered clues contradict each other");
			}
		} while(changed);

		int flagged = 0;
		for(char cell : board) if(cell == 'F') flagged++;
		if(flagged + mines.size() > MINE_COUNT) return failure("The entered board implies more than 12 mines");
		if(mines.isEmpty() && safe.isEmpty()) return failure("No forced move was found; recheck the revealed cells and flags");

		boolean solved = flagged + mines.size() == MINE_COUNT;
		if(solved) safe.clear();
		return success(new MinesweeperOutput(
			coordinate(starting.index()), starting.color(), coordinates(mines), coordinates(safe)), solved);
	}

	private static String validateBoard(List<String> board) {
		if(board.size() != HEIGHT) return "Enter all 10 rows of the board";
		for(String row : board) {
			if(row == null || !row.toUpperCase(Locale.ROOT).matches("[.?F0-8]{8}")) {
				return "Each board row must contain 8 covered, revealed, or flagged cells";
			}
		}
		return null;
	}

	private static List<Integer> neighbors(int index) {
		int x = index % WIDTH;
		int y = index / WIDTH;
		List<Integer> result = new ArrayList<>(8);
		for(int dy = -1; dy <= 1; dy++) for(int dx = -1; dx <= 1; dx++) {
			if(dx == 0 && dy == 0) continue;
			int nx = x + dx;
			int ny = y + dy;
			if(nx >= 0 && nx < WIDTH && ny >= 0 && ny < HEIGHT) result.add(ny * WIDTH + nx);
		}
		return result;
	}

	private static List<String> coordinates(Set<Integer> cells) {
		return cells.stream().sorted().map(MinesweeperSolver::coordinate).toList();
	}

	private static String coordinate(int index) {
		return "" + (char)('A' + index % WIDTH) + (index / WIDTH + 1);
	}

	private record ColoredCell(int index, String color) {}
}
