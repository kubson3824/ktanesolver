package ktanesolver.module.modded.regular.booleanvenndiagram;

import java.util.ArrayList;
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
	type = ModuleType.BOOLEAN_VENN_DIAGRAM,
	id = "booleanVennModule",
	name = "Boolean Venn Diagram",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Evaluate the displayed Boolean expression for all eight regions of a three-set Venn diagram.",
	tags = {"boolean", "logic", "venn", "modded"}
)
public class BooleanVennDiagramSolver extends AbstractModuleSolver<BooleanVennDiagramInput, BooleanVennDiagramOutput> {
	private static final List<String> REGIONS = List.of("NONE", "C", "B", "BC", "A", "AC", "AB", "ABC");
	private static final List<String> OPERATORS = List.of("AND", "OR", "XOR", "IMPLIES", "NAND", "NOR", "XNOR", "IMPLIED_BY");

	@Override
	protected SolveResult<BooleanVennDiagramOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, BooleanVennDiagramInput input
	) {
		if (input == null || input.firstOperator() == null || input.secondOperator() == null || input.grouping() == null) {
			return failure("Select both operators and the displayed grouping");
		}
		String first = normalize(input.firstOperator());
		String second = normalize(input.secondOperator());
		String grouping = normalize(input.grouping());
		if (!OPERATORS.contains(first) || !OPERATORS.contains(second)) return failure("Select valid Boolean operators");
		if (!grouping.matches("AB_FIRST|BC_FIRST")) return failure("Grouping must be AB_FIRST or BC_FIRST");

		List<String> regions = new ArrayList<>();
		for (int value = 0; value < 8; value++) {
			boolean a = (value & 4) != 0;
			boolean b = (value & 2) != 0;
			boolean c = (value & 1) != 0;
			boolean matches = grouping.equals("AB_FIRST")
				? apply(second, apply(first, a, b), c)
				: apply(first, a, apply(second, b, c));
			if (matches) regions.add(REGIONS.get(value));
		}

		String expression = grouping.equals("AB_FIRST")
			? "(A " + symbol(first) + " B) " + symbol(second) + " C"
			: "A " + symbol(first) + " (B " + symbol(second) + " C)";
		storeState(module, "input", new BooleanVennDiagramInput(first, second, grouping));
		return success(new BooleanVennDiagramOutput(expression, regions));
	}

	static boolean apply(String operator, boolean left, boolean right) {
		return switch (operator) {
			case "AND" -> left && right;
			case "OR" -> left || right;
			case "XOR" -> left ^ right;
			case "IMPLIES" -> !left || right;
			case "NAND" -> !(left && right);
			case "NOR" -> !(left || right);
			case "XNOR" -> left == right;
			case "IMPLIED_BY" -> left || !right;
			default -> throw new IllegalArgumentException("Unknown Boolean operator: " + operator);
		};
	}

	private static String normalize(String value) {
		return value.trim().toUpperCase(Locale.ROOT).replace(' ', '_');
	}

	private static String symbol(String operator) {
		return switch (operator) {
			case "AND" -> "∧";
			case "OR" -> "∨";
			case "XOR" -> "⊻";
			case "IMPLIES" -> "→";
			case "NAND" -> "|";
			case "NOR" -> "↓";
			case "XNOR" -> "↔";
			case "IMPLIED_BY" -> "←";
			default -> throw new IllegalArgumentException("Unknown Boolean operator: " + operator);
		};
	}
}
