package ktanesolver.module.modded.regular.backgrounds;

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
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
	type = ModuleType.BACKGROUNDS,
	id = "backgrounds",
	name = "Backgrounds",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Use the backing and button colors with bomb edgework to find the target counter value",
	tags = {"colors", "button", "edgework", "modded"}
)
public class BackgroundsSolver extends AbstractModuleSolver<BackgroundsInput, BackgroundsOutput> {
	// ponytail: default rule seed only; add a rule-set input if non-default seeds need support.
	private static final Set<String> COLORS = Set.of("RED", "ORANGE", "YELLOW", "GREEN", "BLUE", "PURPLE", "WHITE", "GRAY", "BLACK");
	private static final Set<String> PRIMARY = Set.of("RED", "YELLOW", "BLUE");
	private static final Set<String> SECONDARY = Set.of("ORANGE", "GREEN", "PURPLE");
	private static final Set<String> NEUTRAL = Set.of("WHITE", "BLACK");
	private static final int[] ROWS = {0, 3, 2, 3, 1, 5, 4, 1, 2, 4};
	private static final int[] COLUMNS = {2, 1, 4, 3, 5, 4, 1, 2, 3, 0};
	private static final int[][] TABLE = {
		{3, 2, 9, 1, 7, 4},
		{7, 9, 8, 8, 2, 3},
		{5, 1, 7, 4, 4, 6},
		{6, 4, 2, 6, 8, 5},
		{5, 1, 5, 3, 9, 9},
		{1, 2, 3, 6, 7, 8}
	};

	@Override
	protected SolveResult<BackgroundsOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, BackgroundsInput input
	) {
		if (input == null) return failure("Select the backing and button colors");
		String backing = normalize(input.backingColor());
		String button = normalize(input.buttonColor());
		if (!COLORS.contains(backing) || !COLORS.contains(button)) return failure("Invalid backing or button color");
		storeState(module, Map.of("backingColor", backing, "buttonColor", button));
		return success(solveColors(bomb, backing, button));
	}

	static BackgroundsOutput solveColors(BombEntity bomb, String backing, String button) {
		boolean[] rules = {
			backing.equals(button),
			NEUTRAL.contains(backing) ^ NEUTRAL.contains(button),
			bomb.getDBatteryCount() == 0,
			bomb.getAaBatteryCount() == 0,
			PRIMARY.contains(backing) && PRIMARY.contains(button),
			SECONDARY.contains(button),
			bomb.isIndicatorUnlit("SND"),
			bomb.hasPort(PortType.SERIAL),
			(backing.equals("RED") && button.equals("PURPLE"))
				|| (backing.equals("YELLOW") && button.equals("GREEN"))
		};
		int first = 9;
		int second = 9;
		for (int rule = 0; rule < rules.length; rule++) {
			if (!rules[rule]) continue;
			if (first == 9) first = rule;
			else { second = rule; break; }
		}

		int row = ROWS[first];
		int column = COLUMNS[second];
		String pair = "%c%c".formatted('A' + row, 'A' + column);
		return new BackgroundsOutput(TABLE[row][column], pair, first + 1, second + 1);
	}

	static boolean isColor(String value) {
		return COLORS.contains(value);
	}

	static String normalize(String value) {
		return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
	}
}
