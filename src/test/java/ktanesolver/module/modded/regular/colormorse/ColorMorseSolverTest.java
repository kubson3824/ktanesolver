package ktanesolver.module.modded.regular.colormorse;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveSuccess;

class ColorMorseSolverTest {
	private final ColorMorseSolver solver = new ColorMorseSolver();

	@Test
	void appliesColorRulesAndRecordsSouvenirFacts() {
		ModuleEntity module = module();
		ColorMorseOutput output = solve(module, List.of("3", "6", "B"), List.of("RED", "ORANGE", "BLUE"),
			List.of("ADD", "MULTIPLY"), "FIRST_TWO");

		assertThat(output).isEqualTo(new ColorMorseOutput(
			48, List.of(6d, 2d, 6d), "(6 + 2) × 6", List.of("....-", "---..")
		));
		assertThat(module.getState()).containsEntry("colors", List.of("Red", "Orange", "Blue"));
		assertThat(module.getState()).containsEntry("characters", List.of("3", "6", "B"));
	}

	@Test
	void greenMovesParenthesesAndNegativeFractionsTruncateTowardZero() {
		ColorMorseOutput output = solve(module(), List.of("5", "A", "Z"), List.of("YELLOW", "GREEN", "PURPLE"),
			List.of("DIVIDE", "ADD"), "FIRST_TWO");

		assertThat(output.answer()).isEqualTo(-1);
		assertThat(output.evaluatedExpression()).isEqualTo("25 ÷ (10 + -25)");
		assertThat(output.morse()).containsExactly("-....-", ".----");
	}

	@Test
	void keepsOnlyTheThreeLeastSignificantDigits() {
		assertThat(solve(module(), List.of("Z", "1", "1"), List.of("YELLOW", "WHITE", "WHITE"),
			List.of("ADD", "ADD"), "FIRST_TWO").answer()).isEqualTo(227);
	}

	@SuppressWarnings("unchecked")
	private ColorMorseOutput solve(
		ModuleEntity module, List<String> characters, List<String> colors, List<String> operators, String parentheses
	) {
		return ((SolveSuccess<ColorMorseOutput>) solver.solve(new RoundEntity(), new BombEntity(), module,
			new ColorMorseInput(characters, colors, operators, parentheses))).output();
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.COLOR_MORSE);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
