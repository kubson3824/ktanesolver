package ktanesolver.module.modded.regular.gridlock;

import java.util.ArrayList;
import java.util.HashSet;
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
	type = ModuleType.GRIDLOCK,
	id = "gridlock",
	name = "Gridlock",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Follow the changing 4×4 grids until every move in a direction is blocked.",
	tags = {"grid", "navigation", "colors", "symbols", "Souvenir"}
)
public class GridlockSolver extends AbstractModuleSolver<GridlockInput, GridlockOutput> {
	private static final Set<String> COLORS = Set.of("BLUE", "GREEN", "YELLOW", "RED");
	private static final Set<String> SYMBOLS = Set.of("TRIANGLE", "DIAMOND", "HEXAGON", "STAR");
	private static final Map<String, int[]> ARROWS = Map.of(
		"ARROW_N", new int[] {0, -1}, "ARROW_NE", new int[] {1, -1},
		"ARROW_E", new int[] {1, 0}, "ARROW_SE", new int[] {1, 1},
		"ARROW_S", new int[] {0, 1}, "ARROW_SW", new int[] {-1, 1},
		"ARROW_W", new int[] {-1, 0}, "ARROW_NW", new int[] {-1, -1}
	);
	private static final Map<String, int[]> SYMBOL_MOVES = Map.ofEntries(
		Map.entry("TRIANGLE_BLUE", move(-1, 1)), Map.entry("TRIANGLE_GREEN", move(1, -1)),
		Map.entry("TRIANGLE_YELLOW", move(0, 1)), Map.entry("TRIANGLE_RED", move(1, 0)),
		Map.entry("DIAMOND_BLUE", move(-1, 1)), Map.entry("DIAMOND_GREEN", move(0, -1)),
		Map.entry("DIAMOND_YELLOW", move(-1, 0)), Map.entry("DIAMOND_RED", move(-1, -1)),
		Map.entry("HEXAGON_BLUE", move(0, -1)), Map.entry("HEXAGON_GREEN", move(-1, -1)),
		Map.entry("HEXAGON_YELLOW", move(0, 1)), Map.entry("HEXAGON_RED", move(-1, 0)),
		Map.entry("STAR_BLUE", move(1, -1)), Map.entry("STAR_GREEN", move(1, 1)),
		Map.entry("STAR_YELLOW", move(1, 1)), Map.entry("STAR_RED", move(1, 0))
	);
	private static final Map<String, int[][]> BLANK_MOVES = Map.of(
		"BLUE", moves("W SW N NW N S NW W SE E NE SE E S NE SW"),
		"GREEN", moves("E S NE SW W SW N NW N S NW W SE E NE SE"),
		"YELLOW", moves("W N S NW SE SE E NE SW E S NE NW W SW N"),
		"RED", moves("N NW W SW NW W N S NE SE SE E NE SW E S")
	);

	@Override
	protected SolveResult<GridlockOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, GridlockInput input
	) {
		if (input == null || input.pages() == null || input.pages().size() < 5 || input.pages().size() > 10) {
			return failure("Enter all 5 to 10 Gridlock pages");
		}

		List<List<String>> pages = new ArrayList<>();
		for (List<String> page : input.pages()) {
			if (page == null || page.size() != 16) return failure("Each Gridlock page must contain 16 cells");
			List<String> normalized = page.stream().map(GridlockSolver::normalize).toList();
			if (normalized.stream().anyMatch(cell -> !validCell(cell))) return failure("Every cell must be blank, an arrow, or a colored symbol");
			pages.add(normalized);
		}

		List<Integer> stars = new ArrayList<>();
		for (int i = 0; i < 16; i++) if (pages.get(0).get(i).startsWith("STAR_")) stars.add(i);
		if (stars.size() != 1) return failure("Page 1 must contain exactly one colored star");
		int position = stars.get(0);
		int page = 0;
		String lastColor = null;
		Set<Integer> visited = new HashSet<>();
		List<String> path = new ArrayList<>();
		visited.add(position);
		path.add(coordinate(position));

		while (true) {
			String cell = pages.get(page).get(position);
			int[] direction;
			if (cell.equals("BLANK")) {
				direction = BLANK_MOVES.get(lastColor)[position];
			} else if (cell.startsWith("ARROW_")) {
				direction = ARROWS.get(cell);
			} else {
				direction = SYMBOL_MOVES.get(cell);
				lastColor = cell.substring(cell.indexOf('_') + 1);
				page = (page + 1) % pages.size();
			}

			int next = position;
			do {
				next = Math.floorMod(next % 4 + direction[0], 4)
					+ 4 * Math.floorMod(next / 4 + direction[1], 4);
			} while (next != position && visited.contains(next));
			if (next == position) break;
			position = next;
			visited.add(position);
			path.add(coordinate(position));
		}

		String startCell = pages.get(0).get(stars.get(0));
		String startingColor = title(startCell.substring(startCell.indexOf('_') + 1));
		storeState(module, Map.of(
			"startingColor", startingColor,
			"startingLocation", coordinate(stars.get(0))
		));
		return success(new GridlockOutput(coordinate(position), path));
	}

	private static boolean validCell(String cell) {
		if (cell.equals("BLANK") || ARROWS.containsKey(cell)) return true;
		int separator = cell.indexOf('_');
		return separator > 0 && SYMBOLS.contains(cell.substring(0, separator)) && COLORS.contains(cell.substring(separator + 1));
	}

	private static String normalize(String value) {
		return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
	}

	private static String title(String value) {
		return value.charAt(0) + value.substring(1).toLowerCase(Locale.ROOT);
	}

	private static String coordinate(int position) {
		return "" + (char) ('A' + position % 4) + (position / 4 + 1);
	}

	private static int[] move(int x, int y) {
		return new int[] {x, y};
	}

	private static int[][] moves(String directions) {
		Map<String, int[]> values = Map.of(
			"N", move(0, -1), "NE", move(1, -1), "E", move(1, 0), "SE", move(1, 1),
			"S", move(0, 1), "SW", move(-1, 1), "W", move(-1, 0), "NW", move(-1, -1)
		);
		return java.util.Arrays.stream(directions.split(" ")).map(values::get).toArray(int[][]::new);
	}
}
