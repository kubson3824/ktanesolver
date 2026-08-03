package ktanesolver.module.modded.regular.simonshrieks;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

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
	type = ModuleType.SIMON_SHRIEKS,
	id = "SimonShrieksModule",
	name = "Simon Shrieks",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Three-stage color-counting puzzle using flashes relative to the arrow",
	tags = {"simon", "colors", "flashing", "arrow", "stages", "modded"}
)
public class SimonShrieksSolver extends AbstractModuleSolver<SimonShrieksInput, SimonShrieksOutput> {
	private static final String COLORS = "RYGCBWM";
	private static final List<String> COLOR_NAMES = List.of("RED", "YELLOW", "GREEN", "CYAN", "BLUE", "WHITE", "MAGENTA");
	private static final int[] CENTER_X = {2, 8, 2, 8, 2, 8, 5};
	private static final int[] CENTER_Y = {2, 2, 8, 8, 5, 5, 5};
	private static final String[] GRID = {
		"GMCBYRCYBWR",
		"GWCWMYRWWRC",
		"YBWGGCWBRWM",
		"BRMYCRYGMBR",
		"WCYBGBRWGYC",
		"GYRCMRMGWRB",
		"YMGCMMGBCMW",
		"MBRYGYBWYRW",
		"RCYBCBGRCBM",
		"YYMGBMCYWCW",
		"WCGMRGCMGBB"
	};

	@Override
	protected SolveResult<SimonShrieksOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, SimonShrieksInput input
	) {
		if (input == null || input.stage() < 1 || input.stage() > 3) return failure("Stage must be between 1 and 3");
		int expectedFlashes = input.stage() * 2 + 2;
		if (input.flashes() == null || input.flashes().size() != expectedFlashes) {
			return failure("Stage " + input.stage() + " requires exactly " + expectedFlashes + " flashes");
		}
		if (input.flashes().stream().anyMatch(position -> position == null || position < 0 || position > 6)) {
			return failure("Each flash must be 0 to 6 spaces clockwise from the arrow");
		}
		String serial = bomb.getSerialNumber() == null ? "" : bomb.getSerialNumber().trim().toUpperCase(Locale.ROOT);
		if (serial.isEmpty()) return failure("Bomb serial number is required");

		SimonShrieksState state = module.getStateAs(
			SimonShrieksState.class,
			() -> new SimonShrieksState(List.of(), new ArrayList<>())
		);
		if (input.stage() != state.pressHistory().size() + 1) return failure("Invalid stage order");
		if (!input.flashes().subList(0, state.flashes().size()).equals(state.flashes())) {
			return failure("The flashing sequence must keep the previous stage's prefix");
		}

		boolean hasVowel = serial.chars().anyMatch(character -> "AEIOU".indexOf(character) >= 0);
		List<String> presses = presses(input.flashes(), hasVowel);
		List<List<String>> pressHistory = new ArrayList<>(state.pressHistory());
		pressHistory.add(presses);
		module.setState(new SimonShrieksState(List.copyOf(input.flashes()), pressHistory));
		return success(new SimonShrieksOutput(presses), input.stage() == 3);
	}

	private static List<String> presses(List<Integer> flashes, boolean hasVowel) {
		int x = CENTER_X[flashes.getFirst()];
		int y = CENTER_Y[flashes.getFirst()];
		for (int i = 1; i < flashes.size(); i++) {
			int targetX = CENTER_X[flashes.get(i)];
			int targetY = CENTER_Y[flashes.get(i)];
			int deltaX = Math.abs(x - targetX);
			int deltaY = Math.abs(y - targetY);
			if (deltaX >= deltaY) x += Integer.signum(targetX - x);
			if (deltaX <= deltaY) y += Integer.signum(targetY - y);
		}

		int[] counts = new int[COLORS.length()];
		int[] firstOccurrence = new int[COLORS.length()];
		java.util.Arrays.fill(firstOccurrence, Integer.MAX_VALUE);
		int position = 0;
		for (int row = y - 2; row <= y + 2; row++) {
			for (int column = x - 2; column <= x + 2; column++) {
				int color = COLORS.indexOf(GRID[row].charAt(column));
				counts[color]++;
				firstOccurrence[color] = Math.min(firstOccurrence[color], position++);
			}
		}

		List<Integer> colorIndexes = new ArrayList<>();
		for (int color = 0; color < COLORS.length(); color++) {
			if (counts[color] % 2 == (hasVowel ? 0 : 1)) colorIndexes.add(color);
		}
		colorIndexes.sort(Comparator.<Integer>comparingInt(color -> counts[color])
			.thenComparingInt(color -> firstOccurrence[color]));
		return colorIndexes.stream().map(COLOR_NAMES::get).toList();
	}

	private record SimonShrieksState(List<Integer> flashes, List<List<String>> pressHistory) {}
}
