package ktanesolver.module.modded.regular.manometers;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class ManometersSolverTest {
	private final ManometersSolver solver = new ManometersSolver();

	@Test
	void calculatesEveryTargetColorCombinationInTheManualRange() {
		Map<String, Integer> screens = Map.of("BLUE", 5, "ORANGE", 7, "BLACK", 8, "YELLOW", 9, "MAGENTA", 6);
		Map<String, Integer> minuses = Map.of("BLUE", 2, "ORANGE", 3, "YELLOW", 4);
		Map<String, Integer> pluses = Map.of("BLUE", 1, "ORANGE", 2, "YELLOW", 1);
		for (var screen : screens.entrySet()) for (var minus : minuses.entrySet()) for (var plus : pluses.entrySet()) {
			ManometersOutput output = success(module(), bomb(), stage1(screen.getKey(), minus.getKey(), plus.getKey())).output();
			assertThat(output.targetPressure()).isEqualTo(ManometersSolver.normalizeTarget(minus.getValue() * screen.getValue() / plus.getValue()));
			assertThat(output.targetPressure()).isBetween(11, 35);
		}
	}

	@Test
	void reachesAnAvailableTargetWithoutTheValve() {
		ModuleEntity module = module(); BombEntity bomb = bomb();
		assertThat(success(module, bomb, stage1("BLUE", "ORANGE", "ORANGE")).output().targetPressure()).isEqualTo(11);
		ManometersOutput output = success(module, bomb, stage2("BLUE", "BLUE", "BLUE")).output();
		assertThat(output).extracting(ManometersOutput::topMaximum, ManometersOutput::bottomLeftMaximum, ManometersOutput::bottomRightMaximum)
			.containsExactly(6, 8, 7);
		assertThat(output).extracting(ManometersOutput::topPressure, ManometersOutput::bottomLeftPressure, ManometersOutput::bottomRightPressure)
			.containsExactly(6, 5, 0);
		assertThat(output.useValve()).isFalse();
	}

	@Test
	void maxesEveryManometerAndUsesTheValveWhenTheTargetIsUnreachable() {
		ModuleEntity module = module(); BombEntity bomb = bomb();
		assertThat(success(module, bomb, stage1("BLACK", "YELLOW", "YELLOW")).output().targetPressure()).isEqualTo(32);
		ManometersOutput output = success(module, bomb, stage2("BLUE", "BLUE", "BLUE")).output();
		assertThat(output).extracting(ManometersOutput::topPressure, ManometersOutput::bottomLeftPressure, ManometersOutput::bottomRightPressure)
			.containsExactly(6, 8, 7);
		assertThat(output.useValve()).isTrue();
		assertThat(module.isSolved()).isTrue();
	}

	@Test
	void appliesSourceOrderedEdgeworkAndClockConditions() {
		BombEntity bomb = bomb();
		assertThat(ManometersSolver.shift(10, bomb, stage2("BLUE", "BLUE", "BLUE"), false, false)).isEqualTo(-1);
		bomb.setAaBatteryCount(2);
		assertThat(ManometersSolver.shift(10, bomb, stage2("BLUE", "BLUE", "BLUE"), false, false)).isEqualTo(2);
		bomb.setAaBatteryCount(0);
		ManometersInput late = new ManometersInput(2, null, null, null, null, null, "BLUE", "BLUE", "BLUE", false, 6, 10, 3, 20);
		assertThat(ManometersSolver.shift(16, bomb, late, false, false)).isEqualTo(9);
		bomb.setIndicators(Map.of("SND", true));
		assertThat(ManometersSolver.shift(16, bomb, stage2("BLUE", "BLUE", "BLUE"), false, false)).isEqualTo(-15);
		bomb.setIndicators(new HashMap<>());
		assertThat(ManometersSolver.shift(24, bomb, stage2("BLUE", "BLUE", "BLUE"), false, false)).isEqualTo(-6);
		assertThat(ManometersSolver.shift(17, bomb, stage2("BLUE", "BLUE", "BLUE"), false, true)).isEqualTo(1);
		assertThat(ManometersSolver.shift(19, bomb, stage2("BLUE", "BLUE", "BLUE"), true, false)).isEqualTo(1);
	}

	@Test
	void requiresStageOneAndCompleteStageTwoObservations() {
		assertThat(solver.solve(new RoundEntity(), bomb(), module(), stage2("BLUE", "BLUE", "BLUE"))).isInstanceOf(SolveFailure.class);
		ModuleEntity module = module(); success(module, bomb(), stage1("BLUE", "BLUE", "BLUE"));
		ManometersInput bad = new ManometersInput(2, null, null, null, null, null, "PURPLE", "BLUE", "BLUE", false, 6, 10, 3, 12);
		assertThat(solver.solve(new RoundEntity(), bomb(), module, bad)).isInstanceOf(SolveFailure.class);
	}

	private SolveSuccess<ManometersOutput> success(ModuleEntity module, BombEntity bomb, ManometersInput input) {
		return (SolveSuccess<ManometersOutput>) solver.solve(new RoundEntity(), bomb, module, input);
	}
	private SolveSuccess<ManometersOutput> success(ModuleEntity module, ManometersInput input) { return success(module, bomb(), input); }
	private static ManometersInput stage1(String screen, String minus, String plus) {
		return new ManometersInput(1, screen, minus, plus, false, false, null, null, null, null, null, null, null, null);
	}
	private static ManometersInput stage2(String top, String bottomLeft, String bottomRight) {
		return new ManometersInput(2, null, null, null, null, null, top, bottomLeft, bottomRight, false, 6, 10, 3, 12);
	}
	private static BombEntity bomb() {
		BombEntity bomb = new BombEntity(); bomb.setSerialNumber("ABC123"); bomb.setIndicators(new HashMap<>());
		bomb.setPortPlates(new java.util.ArrayList<PortPlateEntity>()); bomb.setModules(new java.util.ArrayList<>()); return bomb;
	}
	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity(); module.setType(ModuleType.MANOMETERS);
		module.setState(new HashMap<>()); module.setSolution(new HashMap<>()); return module;
	}
}
