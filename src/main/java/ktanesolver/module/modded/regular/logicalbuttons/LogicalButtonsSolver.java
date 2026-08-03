package ktanesolver.module.modded.regular.logicalbuttons;

import java.util.ArrayList;
import java.util.Arrays;
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
	type = ModuleType.LOGICAL_BUTTONS,
	id = "logicalButtonsModule",
	name = "Logical Buttons",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Evaluate each button's color and label through the displayed logic gate.",
	tags = {"buttons", "colors", "logic", "multi-stage", "souvenir"}
)
public class LogicalButtonsSolver extends AbstractModuleSolver<LogicalButtonsInput, LogicalButtonsOutput> {
	private static final Set<String> COLORS = Set.of(
		"RED", "BLUE", "GREEN", "YELLOW", "PURPLE", "WHITE", "ORANGE", "CYAN", "GREY"
	);
	private static final Set<String> LABELS = Set.of(
		"LOGIC", "COLOR", "LABEL", "BUTTON", "WRONG", "BOOM", "NO", "WAIT", "HMMM"
	);
	private static final Set<String> OPERATORS = Set.of("AND", "OR", "XOR", "NAND", "NOR", "XNOR");
	private static final Set<String> PRIMARY_COLORS = Set.of("RED", "BLUE", "YELLOW");
	private static final int[][][] PRESS_ORDERS = {
		{{1, 2, 3}, {2, 1, 3}, {3, 2, 1}},
		{{3, 1, 2}, {2, 3, 1}, {1, 3, 2}}
	};

	@Override
	protected SolveResult<LogicalButtonsOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, LogicalButtonsInput input
	) {
		if (input == null || input.operator() == null || input.buttons() == null) {
			return failure("Enter the operator and all three buttons");
		}
		String operator = normalize(input.operator());
		if (!OPERATORS.contains(operator)) return failure("Select a valid logic gate");
		if (input.buttons().size() != 3 || input.buttons().stream().anyMatch(button ->
			button == null || button.color() == null || button.label() == null
		)) return failure("Enter exactly three buttons");

		List<String> colors = input.buttons().stream().map(button -> normalize(button.color())).toList();
		List<String> labels = input.buttons().stream().map(button -> normalize(button.label())).toList();
		if (colors.stream().anyMatch(color -> !COLORS.contains(color))) return failure("Select a valid color for every button");
		if (labels.stream().anyMatch(label -> !LABELS.contains(label))) return failure("Select a valid label for every button");

		List<Object> stages = history(module);
		int stage = stages.size() + 1;
		if (stage > 3) return failure("All Logical Buttons stages are already complete");

		boolean[] colorValues = new boolean[3];
		for (int i = 0; i < 3; i++) colorValues[i] = colorValue(i, colors, labels);

		boolean[] shouldPress = new boolean[3];
		for (int i = 0; i < 3; i++) {
			shouldPress[i] = apply(operator, colorValues[i], labelValue(i, stage, colors, labels, colorValues));
		}
		int group = Set.of("AND", "OR", "XOR").contains(operator) ? 0 : 1;
		List<Integer> pressButtons = Arrays.stream(PRESS_ORDERS[group][stage - 1])
			.filter(button -> shouldPress[button - 1])
			.boxed()
			.toList();
		LogicalButtonsOutput output = new LogicalButtonsOutput(stage, pressButtons, pressButtons.isEmpty());
		if (pressButtons.isEmpty()) return success(output, false);

		stages.add(Map.of(
			"operator", operator,
			"buttons", input.buttons().stream().map(button -> Map.of(
				"color", display(normalize(button.color())),
				"label", display(normalize(button.label()))
			)).toList()
		));
		storeState(module, "stages", stages);
		return success(output, stage == 3);
	}

	private static boolean colorValue(int index, List<String> colors, List<String> labels) {
		String color = colors.get(index);
		return switch (color) {
			case "RED" -> !colors.contains("BLUE");
			case "BLUE" -> colors.stream().filter("BLUE"::equals).count() > 1;
			case "GREEN" -> Set.of("PURPLE", "WHITE").contains(colors.get(clockwise(index)));
			case "YELLOW" -> !Set.of("WRONG", "LOGIC").contains(labels.get(index));
			case "PURPLE" -> colors.stream().noneMatch(PRIMARY_COLORS::contains);
			case "WHITE" -> colors.stream().anyMatch(PRIMARY_COLORS::contains);
			case "ORANGE" -> !"ORANGE".equals(colors.getFirst());
			case "CYAN" -> labels.get(index).length() == 5;
			case "GREY" -> otherIndexes(index).stream().anyMatch(other -> labels.get(other).equals(labels.get(index)));
			default -> false;
		};
	}

	private static boolean labelValue(
		int index, int stage, List<String> colors, List<String> labels, boolean[] colorValues
	) {
		return switch (labels.get(index)) {
			case "LOGIC" -> !colors.contains("GREY");
			case "COLOR" -> !Set.of("GREEN", "YELLOW", "ORANGE").contains(colors.get(index));
			case "LABEL" -> labels.getFirst().length() != 5;
			case "BUTTON" -> !Set.of("HMMM", "NO").contains(labels.get(clockwise(index)));
			case "WRONG" -> colors.get(counterClockwise(index)).equals(colors.get(index));
			case "BOOM" -> {
				List<Integer> others = otherIndexes(index);
				yield colors.get(others.get(0)).equals(colors.get(others.get(1)));
			}
			case "NO" -> !colorValues[index];
			case "WAIT" -> stage == 3;
			case "HMMM" -> colorValues[1];
			default -> false;
		};
	}

	private static boolean apply(String operator, boolean left, boolean right) {
		return switch (operator) {
			case "AND" -> left && right;
			case "OR" -> left || right;
			case "XOR" -> left ^ right;
			case "NAND" -> !(left && right);
			case "NOR" -> !(left || right);
			case "XNOR" -> left == right;
			default -> false;
		};
	}

	private static int clockwise(int index) {
		return (index + 2) % 3;
	}

	private static int counterClockwise(int index) {
		return (index + 1) % 3;
	}

	private static List<Integer> otherIndexes(int index) {
		return switch (index) {
			case 0 -> List.of(1, 2);
			case 1 -> List.of(0, 2);
			default -> List.of(0, 1);
		};
	}

	private static String normalize(String value) {
		return value.trim().toUpperCase(Locale.ROOT);
	}

	private static String display(String value) {
		return value.charAt(0) + value.substring(1).toLowerCase(Locale.ROOT);
	}

	private static List<Object> history(ModuleEntity module) {
		return module.getState().get("stages") instanceof List<?> stages ? new ArrayList<>(stages) : new ArrayList<>();
	}
}
