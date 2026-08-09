package ktanesolver.module.modded.regular.uncoloredsquares;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

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
	type = ModuleType.UNCOLORED_SQUARES,
	id = "UncoloredSquaresModule",
	name = "Uncolored Squares",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Find and place the pattern selected by the two least-common lit colors.",
	tags = {"colored squares", "patterns", "stages", "grid"}
)
public class UncoloredSquaresSolver extends AbstractModuleSolver<UncoloredSquaresInput, UncoloredSquaresOutput> {
	private static final List<UncoloredSquaresColor> COLORS = List.of(
		UncoloredSquaresColor.RED, UncoloredSquaresColor.GREEN, UncoloredSquaresColor.BLUE,
		UncoloredSquaresColor.YELLOW, UncoloredSquaresColor.MAGENTA
	);
	private static final String[][] TABLE = {
		{null, "##|#", " #|##", "#|##|#", "##| #"},
		{"#|#", null, "#|#|##", "##|##", " ##|##"},
		{"#|##| #", "#|##", null, "###| #", " #|###"},
		{" #|##|#", "##|#|#", " #| #|##", null, " #|##| #"},
		{"##| ##", "###|  #", "##", "###|#", null}
	};

	@Override
	protected SolveResult<UncoloredSquaresOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, UncoloredSquaresInput input
	) {
		if (input == null || input.grid() == null || input.grid().size() != 16
			|| input.grid().stream().anyMatch(Objects::isNull)) return failure("Enter all 16 square colors");

		Map<UncoloredSquaresColor, Integer> counts = new EnumMap<>(UncoloredSquaresColor.class);
		for (UncoloredSquaresColor color : input.grid()) if (color != UncoloredSquaresColor.BLACK) counts.merge(color, 1, Integer::sum);
		if (counts.size() < 2) return failure("At least two lit colors are required");
		int minimum = counts.values().stream().mapToInt(Integer::intValue).min().orElseThrow();
		List<UncoloredSquaresColor> least = COLORS.stream().filter(color -> counts.getOrDefault(color, 0) == minimum).toList();
		if (least.size() != 2) return failure("Exactly two appearing colors must tie for the fewest squares");

		UncoloredSquaresColor first = input.grid().stream().filter(least::contains).findFirst().orElseThrow();
		UncoloredSquaresColor other = least.get(0) == first ? least.get(1) : least.get(0);
		List<String> pattern = List.of(TABLE[other.ordinal()][first.ordinal()].split("\\|", -1));
		List<List<String>> placements = placements(input.grid(), pattern);
		if (placements.isEmpty()) return failure("The observed grid has no valid placement for its selected pattern");

		if (!input.grid().contains(UncoloredSquaresColor.BLACK)) storeState(module, Map.of(
			"firstStageColor1", title(first), "firstStageColor2", title(other)
		));
		storeState(module, "grid", input.grid());
		int lit = counts.values().stream().mapToInt(Integer::intValue).sum();
		boolean willSolve = lit - pattern.stream().mapToInt(row -> (int) row.chars().filter(c -> c == '#').count()).sum() <= 3;
		return success(new UncoloredSquaresOutput(first, other, pattern, placements, willSolve), willSolve);
	}

	static List<List<String>> placements(List<UncoloredSquaresColor> grid, List<String> pattern) {
		List<List<String>> result = new ArrayList<>();
		int width = pattern.stream().mapToInt(String::length).max().orElse(0);
		for (int row = 0; row <= 4 - pattern.size(); row++) for (int col = 0; col <= 4 - width; col++) {
			List<String> cells = new ArrayList<>();
			boolean valid = true;
			for (int y = 0; y < pattern.size(); y++) for (int x = 0; x < pattern.get(y).length(); x++) if (pattern.get(y).charAt(x) == '#') {
				int index = (row + y) * 4 + col + x;
				if (grid.get(index) == UncoloredSquaresColor.BLACK) valid = false;
				cells.add("ABCD".charAt(col + x) + Integer.toString(row + y + 1));
			}
			if (valid) result.add(List.copyOf(cells));
		}
		return result;
	}

	private static String title(UncoloredSquaresColor color) {
		String value = color.name().toLowerCase();
		return Character.toUpperCase(value.charAt(0)) + value.substring(1);
	}
}
