package ktanesolver.module.modded.regular.rhythms;

import java.util.List;
import java.util.Locale;
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
import ktanesolver.module.modded.regular.rhythms.RhythmsOutput.Action;

@Service
@ModuleInfo(
	type = ModuleType.RHYTHMS,
	id = "MusicRhythms",
	name = "Rhythms",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Identify the flashing rhythm and determine the two button actions.",
	tags = {"rhythm", "music", "colors", "audio"}
)
public class RhythmsSolver extends AbstractModuleSolver<RhythmsInput, RhythmsOutput> {
	private static final List<String> COLORS = List.of("BLUE", "RED", "GREEN", "YELLOW");
	private static final String[] BUTTONS = {"♩", "♪", "♫", "♬"};
	private static final int[][] FIRST = {
		{8, -2, 11, 10}, {4, 1, 2, 6}, {6, 5, 0, 3}, {1, 7, 7, 6},
		{5, 3, 4, 3}, {4, 1, 2, 2}, {0, 2, 3, 1}
	};
	private static final int[][] SECOND = {
		{1, -1, 1, 1}, {3, 0, 5, 7}, {1, 6, 3, 7}, {2, 0, 3, 1},
		{2, 2, 1, 6}, {7, 5, 1, 4}, {5, 6, 7, 1}
	};

	@Override
	protected SolveResult<RhythmsOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, RhythmsInput input
	) {
		if (input == null || input.rhythm() < 0 || input.rhythm() >= FIRST.length) {
			return failure("Select one of the seven Rhythms patterns");
		}
		String color = input.color() == null ? "" : input.color().toUpperCase(Locale.ROOT);
		int colorIndex = COLORS.indexOf(color);
		if (colorIndex < 0) return failure("Select a blue, red, green, or yellow light");

		storeState(module, Map.of(
			"input", new RhythmsInput(input.rhythm(), color),
			"lastSuccessfulColor", color
		));
		if (FIRST[input.rhythm()][colorIndex] == -2) return success(new RhythmsOutput(true, List.of()));

		int first = FIRST[input.rhythm()][colorIndex];
		int second = input.rhythm() == 6 && bomb.getBatteryCount() > 1
			? first : SECOND[input.rhythm()][colorIndex];
		int extraBeeps = colorIndex == 3
			? (int) bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count()
			: 0;
		return success(new RhythmsOutput(false, List.of(action(first, extraBeeps), action(second, extraBeeps))));
	}

	private static Action action(int encoded, int extraBeeps) {
		return new Action(BUTTONS[encoded % 4], encoded / 4 + extraBeeps);
	}
}
