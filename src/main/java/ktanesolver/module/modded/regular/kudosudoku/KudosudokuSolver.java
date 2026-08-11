package ktanesolver.module.modded.regular.kudosudoku;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
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
	type = ModuleType.KUDOSUDOKU,
	id = "KudosudokuModule",
	name = "Kudosudoku",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Solve the encoded 4×4 Sudoku and translate each revealed cell's input code.",
	tags = {"sudoku", "codes", "grid", "staged"}
)
public class KudosudokuSolver extends AbstractModuleSolver<KudosudokuInput, KudosudokuOutput> {
	public enum Coding { LETTERS, DIGITS, MORSE_CODE, SEMAPHORES, BRAILLE, MARITIME_FLAGS, TAP_CODE, BINARY, SIMON_SAMPLES, ASTROLOGY, SNOOKER, ARROWS, CARD_SUITS, MAHJONG, ZONI, CHESS_PIECES }

	private static final String[] MORSE = {".-","-...","-.-.","-..",".","..-.","--.","....","..",".---","-.-",".-..","--","-.","---",".--.","--.-",".-.","...","-","..-","...-",".--","-..-","-.--","--.."};
	private static final String[] BRAILLE = "1,12,14,145,15,124,1245,125,24,245,13,123,134,1345,135,1234,12345,1235,234,2345,136,1236,2456,1346,13456,1356".split(",");
	private static final String[] TAP = "11,12,13,14,15,21,22,23,24,25,13,31,32,33,34,35,41,42,43,44,45,51,52,53,54,55".split(",");
	private static final int[] SEMAPHORE_LEFT = {135,90,45,0,180,180,180,90,135,0,135,135,135,135,90,90,90,90,90,45,45,0,-45,-45,45,225};
	private static final int[] SEMAPHORE_RIGHT = {-180,-180,-180,-180,-45,-90,-135,-225,45,-90,0,-45,-90,-135,45,0,-45,-90,-135,0,-45,-135,-90,-135,-90,-90};
	private static final String[] MARITIME = {
		"white-blue with cutout","red with cutout","blue-white-red-white-blue horizontal","yellow-blue-yellow horizontal","blue-red horizontal","red diamond on white","yellow-blue vertical stripes","white-red vertical","black dot on yellow","blue-white-blue horizontal","yellow-blue vertical","yellow-black checkerboard","white saltire on blue","blue-white checkerboard","yellow-red diagonal","white square on blue","yellow","yellow cross on red","blue square on white","red-white-blue vertical","red-white checkerboard","red saltire on white","red square on white square on blue","blue cross on white","yellow-red diagonal stripes","yellow-blue-red-black diagonal quadrants"
	};
	private static final String[] ZONI = {
		"3 dots triangle inside circle","filled circle inside outline with dots on top and bottom","filled circle inside left half-circle","2 dots vertical inside right half-circle","3 dots vertical inside circle","left half-circle with dots on each end","dot inside circle with gaps at N, E, S and W","3 dots horizontal inside circle with gaps at N and S","filled circle with dot above and below","filled circle with quarter-circles at NW and SE","3 dots triangle with half-circle on left","filled circle surrounded by 3 unequal arcs","3 dots horizontal below top half-circle","2 quarter-circles with dots below","filled circle","filled circle inside left half-circle with dots on top and bottom","three-quarter-circle with dot inside gap at SE","circle with gaps at NW, NE, SE and SW","circle with gaps at NW and SE","3 dots diagonal inside top-left half-circle","3 dots diagonal inside bottom-right half-circle","filled circle with dots at N, SE and SW","3 dots vertical inside circle with gaps at N and S","filled circle inside circle with gaps at N, E, S and W","filled circle inside circle","2 dots angled inside circle with gaps at E and W"
	};
	private static final List<String> STATE_KEYS = List.of("kudosudokuSolution", "kudosudokuPrefilledCoordinates", "kudosudokuCompletedCoordinates", "kudosudokuNumberNames");

	@Override
	protected SolveResult<KudosudokuOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, KudosudokuInput input) {
		if (input == null) return failure("Enter the decoded 4×4 grid");
		String coordinate = input.coordinate() == null ? "" : input.coordinate().trim().toUpperCase(Locale.ROOT);
		if (coordinate.isEmpty()) return initialize(bomb, module, input.grid());
		if (!coordinate.matches("[A-D][1-4]")) return failure("Coordinate must be A1 through D4");
		List<Integer> solution = integers(module.getState().get("kudosudokuSolution"));
		List<String> names = strings(module.getState().get("kudosudokuNumberNames"));
		if (solution.size() != 16 || names.size() != 4) return failure("Solve the decoded grid before translating a revealed square");
		Set<String> completed = new LinkedHashSet<>(strings(module.getState().get("kudosudokuCompletedCoordinates")));
		if (completed.contains(coordinate)) return failure(coordinate + " was pre-filled or has already been submitted");
		Coding coding;
		try { coding = Coding.valueOf(input.coding() == null ? "" : input.coding().trim().toUpperCase(Locale.ROOT).replace(' ', '_').replace('-', '_')); }
		catch (IllegalArgumentException exception) { return failure("Select the coding revealed in " + coordinate); }
		int index = coordinate.charAt(0) - 'A' + 4 * (coordinate.charAt(1) - '1');
		int value = solution.get(index);
		char name = names.get(value - 1).charAt(0);
		String submission = submission(coding, value, name);
		completed.add(coordinate);
		storeState(module, "kudosudokuCompletedCoordinates", List.copyOf(completed));
		return success(new KudosudokuOutput(solution, names, coordinate, value, coding.name(), submission, 16 - completed.size()), completed.size() == 16);
	}

	private SolveResult<KudosudokuOutput> initialize(BombEntity bomb, ModuleEntity module, List<Integer> grid) {
		if (grid == null || grid.size() != 16 || grid.stream().anyMatch(value -> value == null || value < 0 || value > 4)) return failure("Enter exactly 16 values from 0 through 4; use 0 for an unfilled square");
		if (grid.stream().noneMatch(value -> value == 0)) return failure("At least one square must be unfilled");
		int[] working = grid.stream().mapToInt(Integer::intValue).toArray();
		if (!valid(working)) return failure("The givens conflict within a row, column, or 2×2 box");
		List<int[]> solutions = new ArrayList<>();
		solve(working, solutions);
		if (solutions.isEmpty()) return failure("The givens have no valid Sudoku solution");
		if (solutions.size() > 1) return failure("The givens do not determine a unique Sudoku solution");
		List<String> names;
		try { names = numberNames(bomb); }
		catch (IllegalArgumentException exception) { return failure(exception.getMessage()); }
		List<Integer> solution = java.util.Arrays.stream(solutions.getFirst()).boxed().toList();
		List<String> prefilled = new ArrayList<>();
		for (int i = 0; i < 16; i++) if (grid.get(i) != 0) prefilled.add(coordinate(i));
		module.getState().keySet().removeAll(STATE_KEYS);
		storeState(module, "kudosudokuSolution", solution);
		storeState(module, "kudosudokuPrefilledCoordinates", List.copyOf(prefilled));
		storeState(module, "kudosudokuCompletedCoordinates", List.copyOf(prefilled));
		storeState(module, "kudosudokuNumberNames", names);
		return success(new KudosudokuOutput(solution, names, null, null, null, null, 16 - prefilled.size()), false);
	}

	static List<String> numberNames(BombEntity bomb) {
		String serial = bomb == null ? null : bomb.getSerialNumber();
		if (serial == null || serial.length() != 6) throw new IllegalArgumentException("Enter the six-character serial number");
		Character firstLetter = null; Integer firstDigit = null;
		for (char ch : serial.toUpperCase(Locale.ROOT).toCharArray()) { if (firstLetter == null && ch >= 'A' && ch <= 'Z') firstLetter = ch; if (firstDigit == null && Character.isDigit(ch)) firstDigit = ch - '0'; }
		if (firstLetter == null || firstDigit == null) throw new IllegalArgumentException("The serial number must contain a letter and a digit");
		int distance = firstDigit == 0 ? 10 : firstDigit;
		List<String> result = new ArrayList<>();
		for (int i = 0; i < 4; i++) result.add(String.valueOf((char) ((firstLetter - 'A' + i * distance) % 26 + 'A')));
		return List.copyOf(result);
	}

	static String submission(Coding coding, int value, char name) {
		int letter = name - 'A';
		return switch (coding) {
			case LETTERS -> String.valueOf(name);
			case DIGITS -> String.valueOf(value);
			case MORSE_CODE -> MORSE[letter];
			case SEMAPHORES -> semaphore(SEMAPHORE_LEFT[letter], true) + "." + semaphore(SEMAPHORE_RIGHT[letter], false);
			case BRAILLE -> BRAILLE[letter];
			case MARITIME_FLAGS -> MARITIME[letter];
			case TAP_CODE -> TAP[letter];
			case BINARY -> String.format("%5s", Integer.toBinaryString(letter + 1)).replace(' ', '0');
			case SIMON_SAMPLES -> List.of("Kick", "Snare", "HiHat", "OpenHiHat").get(value - 1);
			case ASTROLOGY -> List.of("fire", "water", "earth", "air").get(value - 1);
			case SNOOKER -> List.of("red", "yellow", "green", "brown").get(value - 1);
			case ARROWS -> List.of("down", "left", "up", "right").get(value - 1);
			case CARD_SUITS -> List.of("spades", "hearts", "clubs", "diamonds").get(value - 1);
			case MAHJONG -> List.of("plum", "orchid", "chrysanthemum", "bamboo").get(value - 1);
			case ZONI -> ZONI[letter];
			case CHESS_PIECES -> List.of("rook", "knight", "bishop", "queen").get(value - 1);
		};
	}

	private static String semaphore(int degrees, boolean left) {
		if (left) return switch (degrees) { case 0 -> "N"; case -45 -> "NE"; case 225 -> "SE"; case 180 -> "S"; case 135 -> "SW"; case 90 -> "W"; case 45 -> "NW"; default -> throw new IllegalArgumentException("Bad semaphore"); };
		return switch (degrees) { case 0 -> "N"; case -45 -> "NE"; case -90 -> "E"; case -135 -> "SE"; case -180 -> "S"; case -225 -> "SW"; case 45 -> "NW"; default -> throw new IllegalArgumentException("Bad semaphore"); };
	}

	private static boolean valid(int[] grid) {
		for (int i = 0; i < 16; i++) if (grid[i] != 0) { int value = grid[i]; grid[i] = 0; boolean ok = allowed(grid, i, value); grid[i] = value; if (!ok) return false; }
		return true;
	}

	private static void solve(int[] grid, List<int[]> solutions) {
		if (solutions.size() > 1) return;
		int cell = -1;
		for (int i = 0; i < 16; i++) if (grid[i] == 0) { cell = i; break; }
		if (cell < 0) { solutions.add(grid.clone()); return; }
		for (int value = 1; value <= 4; value++) if (allowed(grid, cell, value)) { grid[cell] = value; solve(grid, solutions); grid[cell] = 0; }
	}

	private static boolean allowed(int[] grid, int cell, int value) {
		int row = cell / 4, column = cell % 4;
		for (int i = 0; i < 4; i++) if (grid[4 * row + i] == value || grid[4 * i + column] == value) return false;
		int boxRow = row / 2 * 2, boxColumn = column / 2 * 2;
		for (int r = boxRow; r < boxRow + 2; r++) for (int c = boxColumn; c < boxColumn + 2; c++) if (grid[4 * r + c] == value) return false;
		return true;
	}

	private static String coordinate(int index) { return "" + (char) ('A' + index % 4) + (char) ('1' + index / 4); }
	private static List<Integer> integers(Object raw) { if (!(raw instanceof List<?> list)) return List.of(); List<Integer> out = new ArrayList<>(); for (Object value : list) if (value instanceof Number number) out.add(number.intValue()); else return List.of(); return out; }
	private static List<String> strings(Object raw) { if (!(raw instanceof List<?> list)) return List.of(); return list.stream().map(String::valueOf).toList(); }
}
