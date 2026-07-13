package ktanesolver.module.modded.regular.complicatedbuttons;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.complicatedbuttons.ComplicatedButtonsInput.Button;
import ktanesolver.module.modded.regular.complicatedbuttons.ComplicatedButtonsInput.Label;

class ComplicatedButtonsSolverTest {
	private final ComplicatedButtonsSolver solver = new ComplicatedButtonsSolver();

	@Test
	void appliesOrderingVennConditionsAndFallback() {
		BombEntity edgework = bomb("AABC12", 2, 1);
		edgework.replacePortPlates(List.of(Set.of(PortType.SERIAL)));
		assertThat(solve(edgework, List.of(
			button(Label.HOLD, false, true),
			button(Label.HOLD, true, false),
			button(Label.PRESS, true, true)
		))).isEqualTo(List.of(3, 2, 1));

		BombEntity noEdgework = bomb("ABC123", 0, 0);
		assertThat(solve(noEdgework, List.of(
			button(Label.DETONATE, false, true),
			button(Label.PRESS, true, true),
			button(Label.HOLD, false, true)
		))).isEqualTo(List.of(1));
	}

	@Test
	void rejectsIncompleteButtonLists() {
		var result = solver.solve(new RoundEntity(), bomb("ABC123", 0, 0), module(),
			new ComplicatedButtonsInput(List.of(button(Label.PRESS, false, false))));
		assertThat(result).isInstanceOf(SolveFailure.class);
	}

	private List<Integer> solve(BombEntity bomb, List<Button> buttons) {
		return ((SolveSuccess<ComplicatedButtonsOutput>) solver.solve(
			new RoundEntity(), bomb, module(), new ComplicatedButtonsInput(buttons)
		)).output().pressOrder();
	}

	private static Button button(Label label, boolean red, boolean blue) {
		return new Button(label, red, blue);
	}

	private static BombEntity bomb(String serial, int aa, int d) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setAaBatteryCount(aa);
		bomb.setDBatteryCount(d);
		return bomb;
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
