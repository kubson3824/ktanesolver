package ktanesolver.module.modded.regular.backgrounds;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class FaultyBackgroundsSolverTest {
	private final FaultyBackgroundsSolver solver = new FaultyBackgroundsSolver();

	@Test
	void appliesTheFirstMatchingFaultRuleAndSerialFallback() {
		assertThat(solve(bomb("ABC123"), "ORANGE", "BLACK", "BLUE", "PUSH_ME", "PUSH_ME", "LEFT_NO_CHANGE"))
			.isEqualTo(new FaultyBackgroundsOutput("RIGHT", 5, 1, "EA", 10, 10));
		assertThat(solve(bomb("ABC123"), "RED", "RED", "GREEN", "PUSH_ME", "PUSH_ME", "ALL_VISIBLE"))
			.isEqualTo(new FaultyBackgroundsOutput("LEFT", 4, 2, "AF", 1, 5));
		assertThat(solve(bomb("ABC123"), "GRAY", "ORANGE", "BLUE", "PUSH_ME", "BUSH_ME", "ALL_VISIBLE").faultyRule()).isEqualTo(3);
		assertThat(solve(bomb("ABC123"), "PURPLE", "BLACK", "YELLOW", "PUSH_ME", "PUSH_ME", "FIVE_HIDDEN").correctButton()).isEqualTo("RIGHT");
		assertThat(solve(bomb("ABC124"), "GRAY", "RED", "BLUE", "PUSH_ME", "PUSH_ME", "ALL_VISIBLE"))
			.extracting(FaultyBackgroundsOutput::correctButton, FaultyBackgroundsOutput::faultyRule)
			.containsExactly("LEFT", 10);
		assertThat(solve(bomb("ABC123"), "GRAY", "RED", "BLUE", "PUSH_ME", "PUSH_ME", "ALL_VISIBLE"))
			.extracting(FaultyBackgroundsOutput::correctButton, FaultyBackgroundsOutput::faultyRule)
			.containsExactly("RIGHT", 11);
	}

	@SuppressWarnings("unchecked")
	private FaultyBackgroundsOutput solve(
		BombEntity bomb, String backing, String leftColor, String rightColor,
		String leftLabel, String rightLabel, String counterBehavior
	) {
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return ((SolveSuccess<FaultyBackgroundsOutput>) solver.solve(
			new RoundEntity(), bomb, module,
			new FaultyBackgroundsInput(backing, leftColor, rightColor, leftLabel, rightLabel, counterBehavior)
		)).output();
	}

	private static BombEntity bomb(String serial) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setAaBatteryCount(2);
		bomb.setDBatteryCount(1);
		return bomb;
	}
}
