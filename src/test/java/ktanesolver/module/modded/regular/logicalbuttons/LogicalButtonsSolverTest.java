package ktanesolver.module.modded.regular.logicalbuttons;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.logicalbuttons.LogicalButtonsInput.Button;

class LogicalButtonsSolverTest {
	private final LogicalButtonsSolver solver = new LogicalButtonsSolver();

	@Test
	void solvesAllThreeStagesAndRecordsOnlySuccessfulDisplays() {
		ModuleEntity module = module();

		LogicalButtonsOutput reroll = solve(module, input("AND",
			button("BLUE", "WAIT"), button("BLUE", "WAIT"), button("YELLOW", "LOGIC")));
		assertThat(reroll.pressOperator()).isTrue();
		assertThat(module.getState()).isEmpty();

		LogicalButtonsOutput first = solve(module, input("AND",
			button("RED", "LOGIC"), button("RED", "COLOR"), button("RED", "LABEL")));
		assertThat(first.pressButtons()).containsExactly(1, 2);
		assertThat(module.isSolved()).isFalse();

		LogicalButtonsOutput second = solve(module, input("NAND",
			button("ORANGE", "BUTTON"), button("GREEN", "WRONG"), button("WHITE", "BOOM")));
		assertThat(second.pressButtons()).containsExactly(2, 3, 1);

		LogicalButtonsOutput third = solve(module, input("XOR",
			button("PURPLE", "WAIT"), button("CYAN", "HMMM"), button("GREY", "NO")));
		assertThat(third.pressButtons()).containsExactly(3);
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState().get("stages")).isEqualTo(List.of(
			stage("AND", button("Red", "Logic"), button("Red", "Color"), button("Red", "Label")),
			stage("NAND", button("Orange", "Button"), button("Green", "Wrong"), button("White", "Boom")),
			stage("XOR", button("Purple", "Wait"), button("Cyan", "Hmmm"), button("Grey", "No"))
		));
	}

	@Test
	void evaluatesEveryGateAndItsStageOnePressOrder() {
		List<Button> buttons = List.of(
			button("RED", "LOGIC"), button("RED", "COLOR"), button("RED", "LABEL")
		);
		assertThat(solve(module(), new LogicalButtonsInput("AND", buttons)).pressButtons()).containsExactly(1, 2);
		assertThat(solve(module(), new LogicalButtonsInput("OR", buttons)).pressButtons()).containsExactly(1, 2, 3);
		assertThat(solve(module(), new LogicalButtonsInput("XOR", buttons)).pressButtons()).containsExactly(3);
		assertThat(solve(module(), new LogicalButtonsInput("NAND", buttons)).pressButtons()).containsExactly(3);
		assertThat(solve(module(), new LogicalButtonsInput("NOR", buttons)).pressOperator()).isTrue();
		assertThat(solve(module(), new LogicalButtonsInput("XNOR", buttons)).pressButtons()).containsExactly(1, 2);
	}

	@Test
	void rejectsInvalidDisplays() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(),
			input("IMPLIES", button("RED", "LOGIC"), button("RED", "COLOR"), button("RED", "LABEL"))))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private LogicalButtonsOutput solve(ModuleEntity module, LogicalButtonsInput input) {
		return ((SolveSuccess<LogicalButtonsOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), module, input
		)).output();
	}

	private static LogicalButtonsInput input(String operator, Button... buttons) {
		return new LogicalButtonsInput(operator, List.of(buttons));
	}

	private static Button button(String color, String label) {
		return new Button(color, label);
	}

	private static Map<String, Object> stage(String operator, Button... buttons) {
		return Map.of("operator", operator, "buttons", List.of(buttons).stream()
			.map(button -> Map.of("color", button.color(), "label", button.label())).toList());
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
