package ktanesolver.module.modded.regular.nonogram;

import java.util.ArrayList;
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
	type = ModuleType.NONOGRAM,
	id = "NonogramModule",
	name = "Nonogram",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Decode the ten color pairs and solve the 5×5 nonogram.",
	tags = { "5×5 grid", "colors", "logic", "submit" }
)
public class NonogramSolver extends AbstractModuleSolver<NonogramInput, NonogramOutput> {
	private static final int SIZE = 5;
	private static final Set<String> COLORS = Set.of("red", "blue", "green", "yellow", "orange", "purple");
	private static final Map<String, List<Integer>> ODD_CLUES = Map.ofEntries(
		clue("yellow", "orange", 1), clue("green", "purple", 2), clue("blue", "orange", 3),
		clue("blue", "yellow", 4), clue("red", "green", 5), clue("red", "orange", 1, 1),
		clue("blue", "green", 1, 2), clue("blue", "purple", 1, 3), clue("yellow", "purple", 2, 1),
		clue("green", "yellow", 2, 2), clue("red", "blue", 3, 1), clue("red", "yellow", 1, 1, 1));
	private static final Map<String, List<Integer>> EVEN_CLUES = Map.ofEntries(
		clue("blue", "orange", 1), clue("red", "blue", 2), clue("yellow", "orange", 3),
		clue("red", "green", 4), clue("green", "yellow", 5), clue("orange", "purple", 1, 1),
		clue("green", "orange", 1, 2), clue("green", "purple", 1, 3), clue("yellow", "purple", 2, 1),
		clue("blue", "purple", 2, 2), clue("red", "orange", 3, 1), clue("red", "purple", 1, 1, 1));

	@Override
	protected SolveResult<NonogramOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, NonogramInput input
	) {
		if(input == null || input.colorPairs() == null || input.colorPairs().size() != SIZE * 2) {
			return failure("Enter both colors for columns A–E and rows 1–5");
		}

		Map<String, List<Integer>> clueMap = bomb.isLastDigitOdd() ? ODD_CLUES : EVEN_CLUES;
		List<List<Integer>> clues = new ArrayList<>(SIZE * 2);
		for(List<String> pair : input.colorPairs()) {
			if(pair == null || pair.size() != 2 || pair.get(0) == null || pair.get(1) == null) {
				return failure("Each line must have exactly two colors");
			}
			String first = pair.get(0).strip().toLowerCase(Locale.ROOT);
			String second = pair.get(1).strip().toLowerCase(Locale.ROOT);
			if(!COLORS.contains(first) || !COLORS.contains(second) || first.equals(second)) {
				return failure("Each line must have two different red, blue, green, yellow, orange, or purple colors");
			}
			clues.add(clueMap.getOrDefault(pairKey(first, second), List.of()));
		}

		List<List<Integer>> columnClues = List.copyOf(clues.subList(0, SIZE));
		List<List<Integer>> rowClues = List.copyOf(clues.subList(SIZE, SIZE * 2));
		List<int[]> solutions = solve(rowClues, columnClues);
		if(solutions.isEmpty()) return failure("Those color pairs do not form a valid nonogram");
		if(solutions.size() > 1) return failure("Those color pairs do not identify a unique nonogram");

		int[] rows = solutions.get(0);
		List<String> filledCells = new ArrayList<>();
		for(int row = 0; row < SIZE; row++) for(int column = 0; column < SIZE; column++) {
			if(isFilled(rows[row], column)) filledCells.add("" + (char) ('A' + column) + (row + 1));
		}
		storeState(module, "columnClues", columnClues);
		storeState(module, "rowClues", rowClues);
		return success(new NonogramOutput(columnClues, rowClues, filledCells));
	}

	private static List<int[]> solve(List<List<Integer>> rowClues, List<List<Integer>> columnClues) {
		List<List<Integer>> rowPatterns = rowClues.stream().map(NonogramSolver::patterns).toList();
		List<List<Integer>> columnPatterns = columnClues.stream().map(NonogramSolver::patterns).toList();
		List<int[]> solutions = new ArrayList<>(2);
		search(0, new int[SIZE], rowPatterns, columnPatterns, solutions);
		return solutions;
	}

	private static void search(
		int row, int[] grid, List<List<Integer>> rowPatterns,
		List<List<Integer>> columnPatterns, List<int[]> solutions
	) {
		if(solutions.size() > 1) return;
		if(row == SIZE) {
			solutions.add(grid.clone());
			return;
		}
		for(int pattern : rowPatterns.get(row)) {
			grid[row] = pattern;
			boolean possible = true;
			for(int column = 0; column < SIZE && possible; column++) {
				final int currentColumn = column;
				final int assignedRows = row;
				possible = columnPatterns.get(column).stream().anyMatch(candidate -> {
					for(int assigned = 0; assigned <= assignedRows; assigned++) {
						if(isFilled(candidate, assigned) != isFilled(grid[assigned], currentColumn)) return false;
					}
					return true;
				});
			}
			if(possible) search(row + 1, grid, rowPatterns, columnPatterns, solutions);
		}
	}

	private static List<Integer> patterns(List<Integer> clue) {
		List<Integer> result = new ArrayList<>();
		for(int mask = 0; mask < 1 << SIZE; mask++) if(groups(mask).equals(clue)) result.add(mask);
		return result;
	}

	private static List<Integer> groups(int mask) {
		List<Integer> groups = new ArrayList<>();
		int length = 0;
		for(int position = 0; position < SIZE; position++) {
			if(isFilled(mask, position)) length++;
			else if(length > 0) { groups.add(length); length = 0; }
		}
		if(length > 0) groups.add(length);
		return groups;
	}

	private static boolean isFilled(int mask, int position) {
		return (mask & 1 << (SIZE - 1 - position)) != 0;
	}

	private static Map.Entry<String, List<Integer>> clue(String first, String second, Integer... groups) {
		return Map.entry(pairKey(first, second), List.of(groups));
	}

	private static String pairKey(String first, String second) {
		return first.compareTo(second) < 0 ? first + "+" + second : second + "+" + first;
	}
}
