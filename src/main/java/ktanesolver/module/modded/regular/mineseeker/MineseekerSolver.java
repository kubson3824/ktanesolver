package ktanesolver.module.modded.regular.mineseeker;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Queue;
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
	type = ModuleType.MINESEEKER,
	id = "mineseeker",
	name = "Mineseeker",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Use bomb edgework and the colored starting image to navigate a fixed maze.",
	tags = {"bomb-image", "colors", "maze", "edgework"}
)
public class MineseekerSolver extends AbstractModuleSolver<MineseekerInput, MineseekerOutput> {
	private static final List<String> IMAGES = List.of("6", "6o", "10", "11", "85", "100", "63214");
	private static final List<String> COLORS = List.of(
		"WHITE", "GRAY", "PINK", "RED", "BRICK_RED", "BROWN", "ORANGE",
		"YELLOW", "LIME", "FOREST_GREEN", "CYAN", "BLUE", "LAVENDER", "PURPLE"
	);
	private static final int[][] TABLE = {
		{6, 3, 0, 1, 2, 6, 0}, {0, 4, 4, 1, 1, 2, 3}, {1, 5, 3, 2, 3, 6, 5},
		{4, 2, 2, 1, 6, 1, 4}, {1, 5, 6, 3, 0, 3, 2}, {2, 0, 4, 6, 4, 2, 5},
		{0, 3, 2, 0, 5, 5, 6}, {5, 6, 3, 2, 2, 5, 4}, {3, 2, 6, 1, 4, 3, 1},
		{0, 0, 1, 3, 2, 6, 6}, {5, 4, 4, 0, 5, 6, 4}, {0, 5, 6, 3, 5, 0, 4},
		{4, 1, 3, 5, 2, 3, 0}, {5, 6, 1, 1, 4, 1, 0}
	};
	private static final int[][] IMAGE_GRID = {
		{5,4,7,7,7,3,7,7,0,1,2,6}, {6,5,7,3,7,1,4,7,7,2,7,0},
		{7,1,7,7,2,0,6,7,7,3,4,5}, {7,7,4,2,1,6,7,0,3,5,7,7},
		{4,2,7,0,3,7,1,7,5,6,7,7}, {7,0,6,7,7,5,7,2,1,7,3,4},
		{2,3,1,5,7,7,0,6,4,7,7,7}, {0,7,5,2,6,7,3,4,7,7,1,7},
		{7,5,7,7,0,4,2,1,7,7,6,3}, {1,7,3,6,4,7,5,7,2,0,7,7},
		{3,6,0,4,7,7,2,3,7,7,5,1}, {3,7,7,1,7,7,7,5,6,4,0,2}
	};
	private static final int[][] COLOR_GRID = {
		{3,7,14,14,14,11,14,14,12,13,6,2}, {4,6,14,11,14,3,0,14,14,5,14,9},
		{14,1,14,14,4,13,8,14,14,7,2,10}, {14,14,7,12,0,1,14,6,3,1,14,14},
		{1,8,14,6,5,14,10,14,1,0,14,14}, {14,9,0,14,14,13,14,8,9,14,4,1},
		{12,13,1,3,14,14,2,11,4,14,14,14}, {10,14,11,13,9,14,8,5,14,14,3,14},
		{14,9,14,14,1,5,3,9,14,14,7,8}, {11,14,5,10,8,14,7,14,0,2,14,14},
		{14,2,10,3,14,14,13,7,14,14,4,12}, {0,14,14,4,14,14,14,12,9,10,5,6}
	};
	private static final String[][] DIRECTIONS = {
		{"R","LR","LR","LR","LR","LDR","LR","L","D","R","LR","LD"},
		{"D","DR","LDR","LDR","L","DU","DR","LR","LDRU","LDR","L","DU"},
		{"DU","DRU","LDRU","LU","R","LDU","DU","D","RU","LDU","D","DU"},
		{"DU","DRU","LU","R","LD","U","DU","DRU","LD","U","DU","DU"},
		{"DU","DU","R","LD","RU","LD","U","DRU","LDRU","LR","LU","DU"},
		{"DU","RU","L","DRU","LD","DU","R","LRU","LU","R","LDR","LDU"},
		{"DRU","LDR","LD","RU","LDU","RU","LR","LD","R","LD","RU","LU"},
		{"DRU","LRU","LU","D","RU","LDR","LD","RU","LD","RU","LDR","LD"},
		{"U","DR","LR","LU","D","RU","LRU","L","RU","L","DRU","LDU"},
		{"DR","LDU","R","LR","LDU","DR","LR","LD","R","LR","LDRU","LU"},
		{"DRU","LDRU","LR","L","DU","U","D","RU","LDR","LD","U","D"},
		{"RU","LU","R","LR","LRU","LR","LRU","L","RU","LRU","LR","LU"}
	};

	@Override
	protected SolveResult<MineseekerOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, MineseekerInput input
	) {
		if (input == null || input.startImage() == null || input.backgroundColor() == null) {
			return failure("Select the starting bomb image and background color");
		}
		String image = input.startImage().trim();
		String color = input.backgroundColor().trim().toUpperCase(Locale.ROOT).replace(' ', '_');
		int imageIndex = IMAGES.indexOf(image), colorIndex = COLORS.indexOf(color);
		if (imageIndex < 0 || colorIndex < 0) return failure("Unknown starting image or background color");
		int[] start = locate(imageIndex, colorIndex);
		if (start == null) return failure("That image and color do not occur together on the Mineseeker grid");

		List<Integer> twoFactors = input.twoFactorCodes() == null ? List.of() : input.twoFactorCodes();
		if (twoFactors.stream().anyMatch(code -> code == null || code < 0 || code > 999999)) {
			return failure("Two-Factor codes must be six-digit values from 000000 to 999999");
		}
		List<Integer> serialDigits = bomb.getSerialNumber() == null ? List.of() : bomb.getSerialNumber().chars()
			.filter(Character::isDigit).map(character -> character - '0').boxed().toList();
		if (serialDigits.isEmpty()) return failure("Bomb serial number must contain a digit");

		int calculated = bomb.getBatteryHolders() + bomb.getPortPlates().size();
		for (String indicator : bomb.getIndicators().keySet()) {
			for (char character : indicator.toUpperCase(Locale.ROOT).toCharArray()) {
				if (Character.isLetter(character)) calculated += "AEIOU".indexOf(character) >= 0 ? -1 : 1;
			}
		}
		calculated -= twoFactors.stream().mapToInt(code -> code % 10).sum();
		while (serialDigits.contains(calculated)) calculated--;
		if (calculated < 0) calculated = serialDigits.getFirst();
		while (calculated > 6) calculated -= 7;

		int destinationImage = TABLE[colorIndex][calculated];
		List<String> moves = route(start, destinationImage);
		if (moves == null) return failure("No destination image is reachable from this starting square");
		storeState(module, "input", new MineseekerInput(image, color, List.copyOf(twoFactors)));
		return success(new MineseekerOutput(calculated, IMAGES.get(destinationImage), moves));
	}

	private static int[] locate(int image, int color) {
		for (int row = 0; row < IMAGE_GRID.length; row++) {
			for (int column = 0; column < IMAGE_GRID[row].length; column++) {
				if (IMAGE_GRID[row][column] == image && COLOR_GRID[row][column] == color) return new int[] {row, column};
			}
		}
		return null;
	}

	private static List<String> route(int[] start, int destinationImage) {
		Queue<Path> queue = new ArrayDeque<>();
		Set<String> visited = new HashSet<>();
		queue.add(new Path(start[0], start[1], List.of()));
		visited.add(start[0] + "," + start[1]);
		for (Path path; (path = queue.poll()) != null;) {
			if (IMAGE_GRID[path.row()][path.column()] == destinationImage) return path.moves();
			for (char move : new char[] {'U', 'R', 'D', 'L'}) {
				if (DIRECTIONS[path.row()][path.column()].indexOf(move) < 0) continue;
				int row = path.row() + (move == 'U' ? -1 : move == 'D' ? 1 : 0);
				int column = path.column() + (move == 'L' ? -1 : move == 'R' ? 1 : 0);
				String key = row + "," + column;
				if (!visited.add(key)) continue;
				List<String> moves = new ArrayList<>(path.moves());
				moves.add(String.valueOf(move));
				queue.add(new Path(row, column, List.copyOf(moves)));
			}
		}
		return null;
	}

	private record Path(int row, int column, List<String> moves) {}
}
