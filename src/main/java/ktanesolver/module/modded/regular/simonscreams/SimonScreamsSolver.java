package ktanesolver.module.modded.regular.simonscreams;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.function.BiPredicate;

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
	type = ModuleType.SIMON_SCREAMS,
	id = "simon_screams",
	name = "Simon Screams",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Use the first applicable sequence rule and bomb edgework to solve three growing stages",
	tags = {"simon", "colors", "sequence", "stages", "edgework", "modded"}
)
public class SimonScreamsSolver extends AbstractModuleSolver<SimonScreamsInput, SimonScreamsOutput> {
	private static final String COLUMNS = "ACDEFH";
	private static final int[] MIN_LENGTH = {3, 4, 5};
	private static final int[] MAX_LENGTH = {5, 7, 9};

	private static final String[][] LARGE_TABLE = {
		{"FFC", "CEH", "HAF", "ECD", "DDE", "AHA"},
		{"AHF", "DFC", "ECH", "CDE", "FEA", "HAD"},
		{"DED", "ECF", "FHE", "HAA", "AFH", "CDC"},
		{"HCE", "ADA", "CFD", "DHH", "EAC", "FEF"},
		{"CAH", "FHD", "DDA", "AEC", "HCF", "EFE"},
		{"EDA", "HAE", "AEC", "FFF", "CHD", "DCH"}
	};
	private static final SimonScreamsColor[][] SMALL_TABLE = {
		colors(SimonScreamsColor.YELLOW, SimonScreamsColor.ORANGE, SimonScreamsColor.GREEN, SimonScreamsColor.RED, SimonScreamsColor.BLUE, SimonScreamsColor.PURPLE),
		colors(SimonScreamsColor.PURPLE, SimonScreamsColor.YELLOW, SimonScreamsColor.RED, SimonScreamsColor.BLUE, SimonScreamsColor.ORANGE, SimonScreamsColor.GREEN),
		colors(SimonScreamsColor.ORANGE, SimonScreamsColor.GREEN, SimonScreamsColor.BLUE, SimonScreamsColor.PURPLE, SimonScreamsColor.RED, SimonScreamsColor.YELLOW),
		colors(SimonScreamsColor.GREEN, SimonScreamsColor.BLUE, SimonScreamsColor.ORANGE, SimonScreamsColor.YELLOW, SimonScreamsColor.PURPLE, SimonScreamsColor.RED),
		colors(SimonScreamsColor.RED, SimonScreamsColor.PURPLE, SimonScreamsColor.YELLOW, SimonScreamsColor.ORANGE, SimonScreamsColor.GREEN, SimonScreamsColor.BLUE),
		colors(SimonScreamsColor.BLUE, SimonScreamsColor.RED, SimonScreamsColor.PURPLE, SimonScreamsColor.GREEN, SimonScreamsColor.YELLOW, SimonScreamsColor.ORANGE)
	};

	private static final List<Rule> RULES = List.of(
		new Rule("three adjacent colors flashed in clockwise order", (colors, positions) -> matchesPattern(positions, 1, 2)),
		new Rule("a color flashed, then an adjacent color, then the first again", (colors, positions) -> matchesPattern(positions, 1, 0) || matchesPattern(positions, 5, 0)),
		new Rule("at most one color flashed out of red, yellow, and blue", (colors, positions) -> Set.of(SimonScreamsColor.RED, SimonScreamsColor.YELLOW, SimonScreamsColor.BLUE).stream().filter(colors::contains).count() <= 1),
		new Rule("there are two colors opposite each other that didn’t flash", (colors, positions) -> oppositeColorsMissing(positions)),
		new Rule("two adjacent colors flashed in clockwise order", (colors, positions) -> matchesPattern(positions, 1)),
		new Rule("otherwise", (colors, positions) -> true)
	);

	@Override
	protected SolveResult<SimonScreamsOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, SimonScreamsInput input
	) {
		if (input == null || input.clockwiseColors() == null || input.flashes() == null) return failure("Enter the color layout and flashing sequence");
		if (input.stage() < 1 || input.stage() > 3) return failure("Simon Screams has exactly 3 stages");
		if (input.clockwiseColors().size() != 6 || input.clockwiseColors().stream().anyMatch(color -> color == null) || Set.copyOf(input.clockwiseColors()).size() != 6) {
			return failure("Enter each of the 6 colors exactly once in clockwise order");
		}
		if (input.flashes().stream().anyMatch(color -> color == null)) return failure("Every flash must have a color");

		int stageIndex = input.stage() - 1;
		if (input.flashes().size() < MIN_LENGTH[stageIndex] || input.flashes().size() > MAX_LENGTH[stageIndex]) {
			return failure("Stage " + input.stage() + " must contain " + MIN_LENGTH[stageIndex] + " to " + MAX_LENGTH[stageIndex] + " flashes");
		}

		SimonScreamsState state = module.getStateAs(SimonScreamsState.class, SimonScreamsState::empty);
		if (state.clockwiseColors() != null && !state.clockwiseColors().isEmpty() && !input.clockwiseColors().equals(state.clockwiseColors())) {
			return failure("The clockwise color layout cannot change between stages");
		}
		List<List<SimonScreamsColor>> flashHistory = state.flashHistory() == null ? List.of() : state.flashHistory();
		if (flashHistory.size() != stageIndex) return failure("Invalid stage order");
		if (stageIndex > 0) {
			List<SimonScreamsColor> previous = flashHistory.getLast();
			if (input.flashes().size() <= previous.size() || !input.flashes().subList(0, previous.size()).equals(previous)) {
				return failure("Each stage's sequence must extend the previous stage's sequence");
			}
		}

		List<Integer> positions = input.flashes().stream().map(input.clockwiseColors()::indexOf).toList();
		int ruleIndex = firstApplicableRule(input.flashes(), positions);
		String rule = RULES.get(ruleIndex).name();
		SimonScreamsColor tableColor = input.flashes().get(stageIndex);
		int smallColumn = COLUMNS.indexOf(LARGE_TABLE[ruleIndex][tableColor.ordinal()].charAt(stageIndex));

		boolean[] applicable = applicableEdgeworkRows(bomb);
		List<SimonScreamsColor> press = new ArrayList<>();
		for (int row = 0; row < applicable.length; row++) if (applicable[row]) press.add(SMALL_TABLE[row][smallColumn]);

		List<List<SimonScreamsColor>> newFlashHistory = new ArrayList<>(flashHistory);
		newFlashHistory.add(List.copyOf(input.flashes()));
		List<String> newRuleHistory = new ArrayList<>(state.ruleHistory() == null ? List.of() : state.ruleHistory());
		newRuleHistory.add(rule);
		List<List<SimonScreamsColor>> newPressHistory = new ArrayList<>(state.pressHistory() == null ? List.of() : state.pressHistory());
		newPressHistory.add(List.copyOf(press));
		module.setState(new SimonScreamsState(List.copyOf(input.clockwiseColors()), newFlashHistory, newRuleHistory, newPressHistory));

		return success(new SimonScreamsOutput(input.stage(), press, rule), input.stage() == 3);
	}

	private static int firstApplicableRule(List<SimonScreamsColor> colors, List<Integer> positions) {
		for (int i = 0; i < RULES.size(); i++) if (RULES.get(i).matches().test(colors, positions)) return i;
		throw new IllegalStateException("The otherwise rule must always apply");
	}

	private static boolean matchesPattern(List<Integer> sequence, int... offsets) {
		for (int start = 0; start + offsets.length < sequence.size(); start++) {
			int base = sequence.get(start);
			boolean matches = true;
			for (int i = 0; i < offsets.length; i++) {
				if (sequence.get(start + i + 1) != (base + offsets[i]) % 6) {
					matches = false;
					break;
				}
			}
			if (matches) return true;
		}
		return false;
	}

	private static boolean oppositeColorsMissing(List<Integer> sequence) {
		for (int color = 0; color < 3; color++) {
			if (!sequence.contains(color) && !sequence.contains(color + 3)) return true;
		}
		return false;
	}

	private static boolean[] applicableEdgeworkRows(BombEntity bomb) {
		String serial = bomb.getSerialNumber() == null ? "" : bomb.getSerialNumber();
		int portCount = bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum();
		return new boolean[] {
			bomb.getIndicators().size() >= 3,
			portCount >= 3,
			serial.chars().filter(Character::isDigit).count() >= 3,
			serial.chars().filter(Character::isLetter).count() >= 3,
			bomb.getBatteryCount() >= 3,
			bomb.getBatteryHolders() >= 3
		};
	}

	private static SimonScreamsColor[] colors(SimonScreamsColor... colors) {
		return colors;
	}

	private record Rule(String name, BiPredicate<List<SimonScreamsColor>, List<Integer>> matches) {}

	private record SimonScreamsState(
		List<SimonScreamsColor> clockwiseColors,
		List<List<SimonScreamsColor>> flashHistory,
		List<String> ruleHistory,
		List<List<SimonScreamsColor>> pressHistory
	) {
		private static SimonScreamsState empty() {
			return new SimonScreamsState(new ArrayList<>(), new ArrayList<>(), new ArrayList<>(), new ArrayList<>());
		}
	}
}
