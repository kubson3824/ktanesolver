package ktanesolver.module.modded.regular.rubiksclock;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.rubiksclock.RubiksClockInput.Action;
import ktanesolver.module.modded.regular.rubiksclock.RubiksClockInput.ClockPosition;
import ktanesolver.module.modded.regular.rubiksclock.RubiksClockInput.PinPosition;

class RubiksClockSolverTest {
	private final RubiksClockSolver solver = new RubiksClockSolver();

	@Test
	void appliesMovingPinRotationAndHourModificationsWhileAdvancingRows() {
		BombEntity bomb = bomb("ABCD12");
		ModuleEntity module = module();
		assertThat(solve(bomb, module, ClockPosition.TL, PinPosition.TL))
			.isEqualTo(new RubiksClockOutput(List.of(PinPosition.BL, PinPosition.BR), PinPosition.TL, -2, 1));
		assertThat(solve(bomb, module, ClockPosition.TL, PinPosition.TL))
			.isEqualTo(new RubiksClockOutput(List.of(PinPosition.TR, PinPosition.BL), PinPosition.BL, 3, 2));

		BombEntity modifiers = bomb("GAPD12");
		modifiers.setIndicators(Map.of());
		assertThat(solve(modifiers, module(), ClockPosition.TL, PinPosition.TL))
			.isEqualTo(new RubiksClockOutput(List.of(PinPosition.TR, PinPosition.BL), PinPosition.BL, -6, 1));
		BombEntity hours = bomb("YA7D12");
		hours.setIndicators(Map.of());
		assertThat(solve(hours, module(), ClockPosition.TL, PinPosition.TL))
			.isEqualTo(new RubiksClockOutput(List.of(PinPosition.TL, PinPosition.BR), PinPosition.BL, 7, 1));
	}

	private RubiksClockOutput solve(BombEntity bomb, ModuleEntity module, ClockPosition clock, PinPosition pin) {
		var input = new RubiksClockInput(Action.SOLVE_STEP, clock, pin);
		return ((SolveSuccess<RubiksClockOutput>) solver.solve(new RoundEntity(), bomb, module, input)).output();
	}

	private static BombEntity bomb(String serial) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setAaBatteryCount(1);
		bomb.setDBatteryCount(1);
		bomb.setIndicators(Map.of("SND", true));
		return bomb;
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
