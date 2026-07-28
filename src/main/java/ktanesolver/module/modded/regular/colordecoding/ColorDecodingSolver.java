package ktanesolver.module.modded.regular.colordecoding;

import static ktanesolver.module.modded.regular.colordecoding.ColorDecodingInput.Color.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
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
import ktanesolver.module.modded.regular.colordecoding.ColorDecodingInput.Color;
import ktanesolver.module.modded.regular.colordecoding.ColorDecodingInput.Pattern;
import ktanesolver.module.modded.regular.colordecoding.ColorDecodingOutput.Selection;
import ktanesolver.module.modded.regular.colordecoding.ColorDecodingOutput.Selection.Type;

@Service
@ModuleInfo(
	type = ModuleType.COLOR_DECODING,
	id = "Color Decoding",
	name = "Color Decoding",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Find the rows and columns matching each stage's color constraints",
	tags = {"colors", "grid", "venn diagram", "stages", "modded"}
)
public class ColorDecodingSolver extends AbstractModuleSolver<ColorDecodingInput, ColorDecodingOutput> {
	private static final String[][] CONSTRAINTS = {
		{"BGB", "BBY", "!R", "YPG", "YGB"},
		{"PYP", "!G", "YYR", "RPY", "BPR"},
		{"BPY", "PPB", "PRP", "!G", "RBR"},
		{"GGB", "YRG", "!P", "BYB", "RGB"},
		{"GGY", "RGG", "YRP", "PRR", "!B"},
		{"PGG", "YRR", "!B", "YYG", "YGR"},
		{"BBG", "BYG", "PYY", "!R", "YBG"},
		{"PGB", "!Y", "PPG", "BRG", "RGR"}
	};
	private static final int[] VENN_TO_SET = {2, 7, 1, 5, 4, 1, 3, 4, 6, 2, 5, 0, 0, 3, 7, 6};

	@Override
	protected SolveResult<ColorDecodingOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, ColorDecodingInput input
	) {
		String validation = validate(input);
		if (validation != null) return failure(validation);

		ColorDecodingState state = module.getStateAs(ColorDecodingState.class, () -> new ColorDecodingState(new ArrayList<>()));
		List<StageObservation> stages = state.stages() == null ? new ArrayList<>() : new ArrayList<>(state.stages());
		if (input.stage() != stages.size() + 1) return failure("Enter Color Decoding stages in order");

		RuleRow rule = ruleFor(bomb, input.pattern(), input.stage());
		int region = 0;
		for (int i = 0; i < rule.vennColors().size(); i++) {
			if (input.indicatorColors().contains(rule.vennColors().get(i))) region |= 1 << i;
		}
		int set = VENN_TO_SET[region];
		Set<Integer> skipped = new HashSet<>();
		rule.skips()[input.stage() - 1].chars().forEach(label -> skipped.add(label - 'A'));

		List<List<Color>> lines = lines(input.display());
		List<Selection> selections = new ArrayList<>();
		for (int label = 0; label < 5; label++) {
			if (skipped.contains(label)) continue;
			String constraint = CONSTRAINTS[set][label];
			List<Integer> matches = new ArrayList<>();
			for (int line = 0; line < lines.size(); line++) {
				if (matches(lines.get(line), constraint)) matches.add(line);
			}
			if (matches.size() != 1) {
				return failure("Constraint " + (char)('A' + label) + " must match exactly one row or column");
			}
			int line = matches.getFirst();
			selections.add(new Selection(line < 6 ? Type.ROW : Type.COLUMN, line < 6 ? line + 1 : line - 5));
		}

		stages.add(new StageObservation(input.pattern(), List.copyOf(input.indicatorColors())));
		module.setState(new ColorDecodingState(stages));
		return success(new ColorDecodingOutput(selections, set + 1), input.stage() == 3);
	}

	private static String validate(ColorDecodingInput input) {
		if (input.stage() < 1 || input.stage() > 3) return "Stage must be between 1 and 3";
		if (input.pattern() == null) return "Select the indicator pattern";
		if (input.indicatorColors() == null || input.indicatorColors().stream().anyMatch(Objects::isNull)
			|| new HashSet<>(input.indicatorColors()).size() != input.indicatorColors().size()) {
			return "Select each indicator color once";
		}
		int colorCount = input.indicatorColors().size();
		if (input.pattern() == Pattern.SOLID ? colorCount != 1 : colorCount < 2 || colorCount > 4) {
			return input.pattern() == Pattern.SOLID
				? "A solid indicator has exactly one color"
				: "This indicator pattern has between 2 and 4 colors";
		}
		if (input.display() == null || input.display().size() != 36 || input.display().stream().anyMatch(Objects::isNull)) {
			return "Enter all 36 display colors";
		}
		return null;
	}

	private static RuleRow ruleFor(BombEntity bomb, Pattern pattern, int stage) {
		return switch (pattern) {
			case CHECKERED -> bomb.getBatteryCount() <= 2
				? new RuleRow(List.of(RED, GREEN, BLUE, YELLOW), new String[]{"AC", "B", "BE"})
				: new RuleRow(List.of(PURPLE, BLUE, YELLOW, RED), new String[]{"BD", "D", "CE"});
			case VERTICAL -> portCount(bomb) <= 2
				? new RuleRow(List.of(GREEN, RED, PURPLE, YELLOW), new String[]{"C", "AD", "AB"})
				: new RuleRow(List.of(BLUE, YELLOW, GREEN, PURPLE), new String[]{"AE", "BD", "AD"});
			case HORIZONTAL -> litIndicatorCount(bomb) <= 2
				? new RuleRow(List.of(YELLOW, PURPLE, RED, BLUE), new String[]{"D", "AC", "BE"})
				: new RuleRow(List.of(GREEN, BLUE, PURPLE, RED), new String[]{"CE", "A", "CD"});
			case SOLID -> stage == 1 || stage == 3
				? new RuleRow(List.of(PURPLE, GREEN, BLUE, RED), new String[]{"AE", "BD", "C"})
				: new RuleRow(List.of(YELLOW, RED, GREEN, PURPLE), new String[]{"E", "AD", "BC"});
		};
	}

	private static int portCount(BombEntity bomb) {
		return bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum();
	}

	private static long litIndicatorCount(BombEntity bomb) {
		return bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count();
	}

	private static List<List<Color>> lines(List<Color> display) {
		List<List<Color>> lines = new ArrayList<>(12);
		for (int row = 0; row < 6; row++) lines.add(display.subList(row * 6, row * 6 + 6));
		for (int column = 0; column < 6; column++) {
			List<Color> line = new ArrayList<>(6);
			for (int row = 0; row < 6; row++) line.add(display.get(row * 6 + column));
			lines.add(line);
		}
		return lines;
	}

	private static boolean matches(List<Color> line, String constraint) {
		if (constraint.charAt(0) == '!') {
			Color absent = color(constraint.charAt(1));
			return !line.contains(absent);
		}
		List<Color> sequence = constraint.chars().mapToObj(ColorDecodingSolver::color).toList();
		int count = 0;
		for (int start = 0; start <= line.size() - sequence.size(); start++) {
			List<Color> window = line.subList(start, start + sequence.size());
			if (window.equals(sequence) || reversedEquals(window, sequence)) count++;
		}
		return count == 1;
	}

	private static boolean reversedEquals(List<Color> window, List<Color> sequence) {
		for (int i = 0; i < sequence.size(); i++) {
			if (window.get(i) != sequence.get(sequence.size() - 1 - i)) return false;
		}
		return true;
	}

	private static Color color(int code) {
		return switch (code) {
			case 'R' -> RED;
			case 'G' -> GREEN;
			case 'B' -> BLUE;
			case 'Y' -> YELLOW;
			case 'P' -> PURPLE;
			default -> throw new IllegalArgumentException("Unknown color code");
		};
	}

	private record RuleRow(List<Color> vennColors, String[] skips) {}
}

record ColorDecodingState(List<StageObservation> stages) {}
record StageObservation(Pattern pattern, List<Color> indicatorColors) {}
