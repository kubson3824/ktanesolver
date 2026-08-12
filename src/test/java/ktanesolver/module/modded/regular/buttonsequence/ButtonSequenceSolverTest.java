package ktanesolver.module.modded.regular.buttonsequence;

import static ktanesolver.module.modded.regular.buttonsequence.ButtonSequenceInput.Color.*;
import static ktanesolver.module.modded.regular.buttonsequence.ButtonSequenceInput.Label.*;
import static ktanesolver.module.modded.regular.buttonsequence.ButtonSequenceInput.Shape.*;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.buttonsequence.ButtonSequenceInput.Button;

class ButtonSequenceSolverTest {
	private final ButtonSequenceSolver solver = new ButtonSequenceSolver();

	@Test
	void matchesEveryRowOfAllFourManualTables() {
		Map<ButtonSequenceInput.Color, List<Button>> rules = Map.of(
			RED, List.of(button(RED, ABORT, SQUARE), button(RED, DETONATE, HEXAGON), button(RED, HOLD, CIRCLE), button(RED, ABORT, CIRCLE), button(RED, PRESS, SQUARE)),
			YELLOW, List.of(button(YELLOW, DETONATE, CIRCLE), button(YELLOW, HOLD, HEXAGON), button(YELLOW, ABORT, SQUARE), button(YELLOW, PRESS, CIRCLE), button(YELLOW, HOLD, HEXAGON)),
			BLUE, List.of(button(BLUE, HOLD, CIRCLE), button(BLUE, ABORT, SQUARE), button(BLUE, DETONATE, HEXAGON), button(BLUE, PRESS, SQUARE), button(BLUE, PRESS, HEXAGON)),
			WHITE, List.of(button(WHITE, HOLD, HEXAGON), button(WHITE, DETONATE, SQUARE), button(WHITE, PRESS, HEXAGON), button(WHITE, ABORT, CIRCLE), button(WHITE, DETONATE, SQUARE))
		);

		for (var entry : rules.entrySet()) for (int row = 0; row < entry.getValue().size(); row++) {
			Button match = entry.getValue().get(row);
			var otherLabel = ButtonSequenceInput.Label.values()[(match.label().ordinal() + 1) % ButtonSequenceInput.Label.values().length];
			var otherShape = ButtonSequenceInput.Shape.values()[(match.shape().ordinal() + 1) % ButtonSequenceInput.Shape.values().length];
			int occurrence = row + 1;
			assertThat(actionAt(occurrence, match)).isEqualTo(ButtonSequenceOutput.Action.HOLD);
			assertThat(actionAt(occurrence, button(entry.getKey(), match.label(), otherShape))).isEqualTo(ButtonSequenceOutput.Action.PRESS);
			assertThat(actionAt(occurrence, button(entry.getKey(), otherLabel, match.shape()))).isEqualTo(ButtonSequenceOutput.Action.PRESS);
			assertThat(actionAt(occurrence, button(entry.getKey(), otherLabel, otherShape))).isEqualTo(ButtonSequenceOutput.Action.SKIP);
		}
	}

	@Test
	void appliesEveryActionAndWrapsColorOccurrencesAfterTheFifth() {
		ModuleEntity module = new ModuleEntity();

		assertThat(solve(module, 1,
			button(RED, ABORT, SQUARE),
			button(RED, ABORT, CIRCLE),
			button(YELLOW, DETONATE, SQUARE)))
			.isEqualTo(output(1, List.of(
				ButtonSequenceOutput.Action.HOLD,
				ButtonSequenceOutput.Action.SKIP,
				ButtonSequenceOutput.Action.PRESS), 2, 1, 0, 0));
		assertThat(module.isSolved()).isFalse();

		assertThat(solve(module, 2,
			button(BLUE, HOLD, CIRCLE),
			button(WHITE, ABORT, SQUARE),
			button(RED, HOLD, CIRCLE)))
			.isEqualTo(output(2, List.of(
				ButtonSequenceOutput.Action.HOLD,
				ButtonSequenceOutput.Action.SKIP,
				ButtonSequenceOutput.Action.HOLD), 3, 1, 1, 1));

		assertThat(solve(module, 3,
			button(RED, PRESS, CIRCLE),
			button(YELLOW, HOLD, HEXAGON),
			button(WHITE, DETONATE, SQUARE)))
			.isEqualTo(output(3, List.of(
				ButtonSequenceOutput.Action.PRESS,
				ButtonSequenceOutput.Action.HOLD,
				ButtonSequenceOutput.Action.HOLD), 4, 2, 1, 2));

		assertThat(solve(module, 4,
			button(BLUE, ABORT, SQUARE),
			button(RED, PRESS, SQUARE),
			button(RED, ABORT, SQUARE)))
			.isEqualTo(output(4, List.of(
				ButtonSequenceOutput.Action.HOLD,
				ButtonSequenceOutput.Action.HOLD,
				ButtonSequenceOutput.Action.HOLD), 6, 2, 2, 2));
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState()).containsEntry("completedPanels", 4);
		assertThat(module.getState().get("colorOccurrences"))
			.asInstanceOf(org.assertj.core.api.InstanceOfAssertFactories.MAP)
			.containsEntry("RED", 6).containsEntry("YELLOW", 2).containsEntry("BLUE", 2).containsEntry("WHITE", 2);
	}

	@Test
	void aNewFirstPanelReplacesAnIncorrectRunAndItsSouvenirCounts() {
		ModuleEntity module = new ModuleEntity();
		solve(module, 1,
			button(RED, ABORT, SQUARE), button(RED, ABORT, SQUARE), button(RED, ABORT, SQUARE));

		ButtonSequenceOutput restarted = solve(module, 1,
			button(WHITE, HOLD, HEXAGON), button(WHITE, HOLD, HEXAGON), button(WHITE, HOLD, HEXAGON));

		assertThat(restarted.colorOccurrences()).containsExactlyInAnyOrderEntriesOf(Map.of(
			RED, 0, YELLOW, 0, BLUE, 0, WHITE, 3));
		assertThat(module.getState()).containsEntry("completedPanels", 1);
	}

	@Test
	void rejectsSkippedPanelsAndIncompleteButtons() {
		ModuleEntity module = new ModuleEntity();
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module, new ButtonSequenceInput(2, List.of(
			button(RED, ABORT, SQUARE), button(BLUE, HOLD, CIRCLE), button(WHITE, PRESS, HEXAGON)))))
			.isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module, new ButtonSequenceInput(1, List.of(
			button(RED, ABORT, SQUARE), button(BLUE, HOLD, CIRCLE)))))
			.isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module, new ButtonSequenceInput(1, List.of(
			new Button(null, ABORT, SQUARE), button(BLUE, HOLD, CIRCLE), button(WHITE, PRESS, HEXAGON)))))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private ButtonSequenceOutput solve(ModuleEntity module, int panel, Button... buttons) {
		return ((SolveSuccess<ButtonSequenceOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), module, new ButtonSequenceInput(panel, List.of(buttons)))).output();
	}

	private ButtonSequenceOutput.Action actionAt(int occurrence, Button target) {
		ModuleEntity module = new ModuleEntity();
		Button filler = button(target.color(), ABORT, CIRCLE);
		List<Button> firstPanel = new ArrayList<>(3);
		for (int position = 1; position <= 3; position++) firstPanel.add(position == occurrence ? target : filler);
		ButtonSequenceOutput output = solve(module, 1, firstPanel.toArray(Button[]::new));
		if (occurrence <= 3) return output.actions().get(occurrence - 1);

		List<Button> secondPanel = new ArrayList<>(3);
		for (int position = 4; position <= 6; position++) secondPanel.add(position == occurrence ? target : filler);
		return solve(module, 2, secondPanel.toArray(Button[]::new)).actions().get(occurrence - 4);
	}

	private static Button button(ButtonSequenceInput.Color color, ButtonSequenceInput.Label label, ButtonSequenceInput.Shape shape) {
		return new Button(color, label, shape);
	}

	private static ButtonSequenceOutput output(
		int panel, List<ButtonSequenceOutput.Action> actions, int red, int yellow, int blue, int white
	) {
		return new ButtonSequenceOutput(panel, actions, Map.of(RED, red, YELLOW, yellow, BLUE, blue, WHITE, white));
	}
}
