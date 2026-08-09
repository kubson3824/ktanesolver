package ktanesolver.module.modded.regular.timekeeper;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.timekeeper.TimeKeeperInput.Color;

class TimeKeeperSolverTest {
	private final TimeKeeperSolver solver = new TimeKeeperSolver();

	@Test
	void followsEarlySelectionEndpointAndLateRules() {
		BombEntity early = bomb();
		early.replacePortPlates(List.of(Set.of(PortType.DVI, PortType.PARALLEL, PortType.USB)));
		assertThat(solve(early, input(20, Color.BLUE, List.of(Color.WHITE, Color.BLUE, Color.RED))))
			.isEqualTo(new TimeKeeperOutput(1, 51));

		assertThat(solve(bomb(), input(10, Color.RED, List.of(Color.GREEN, Color.GREEN, Color.GREEN))))
			.isEqualTo(new TimeKeeperOutput(1, 38));

		BombEntity third = bomb();
		third.setDBatteryCount(1);
		assertThat(solve(third, input(24, Color.GREEN, List.of(Color.GREEN, Color.RED, Color.GREEN))))
			.isEqualTo(new TimeKeeperOutput(3, 68));

		BombEntity late = bomb();
		late.setAaBatteryCount(2);
		late.setIndicators(Map.of("CAR", false));
		late.replacePortPlates(List.of(Set.of(PortType.PARALLEL)));
		assertThat(solve(late, input(50, Color.WHITE, List.of(Color.YELLOW, Color.RED, Color.BLUE))))
			.isEqualTo(new TimeKeeperOutput(1, 153));
	}

	@Test
	void rejectsMalformedModuleInput() {
		BombEntity bomb = bomb();
		assertThat(result(bomb, null)).isInstanceOf(SolveFailure.class);
		assertThat(result(bomb, input(0, Color.RED, List.of(Color.RED, Color.BLUE, Color.WHITE)))).isInstanceOf(SolveFailure.class);
		assertThat(result(bomb, input(51, Color.RED, List.of(Color.RED, Color.BLUE, Color.WHITE)))).isInstanceOf(SolveFailure.class);
		assertThat(result(bomb, new TimeKeeperInput(20, Color.RED, List.of(Color.RED, Color.BLUE), 6))).isInstanceOf(SolveFailure.class);
		assertThat(result(bomb, new TimeKeeperInput(20, Color.RED, java.util.Arrays.asList(Color.RED, null, Color.BLUE), 6))).isInstanceOf(SolveFailure.class);
		assertThat(result(bomb, new TimeKeeperInput(20, Color.RED, List.of(Color.RED, Color.BLUE, Color.WHITE), 0))).isInstanceOf(SolveFailure.class);
		assertThat(result(bomb, new TimeKeeperInput(20, Color.RED, List.of(Color.RED, Color.BLUE, Color.WHITE), 13))).isInstanceOf(SolveFailure.class);
	}

	private TimeKeeperOutput solve(BombEntity bomb, TimeKeeperInput input) {
		var result = result(bomb, input);
		assertThat(result).isInstanceOf(SolveSuccess.class);
		return ((SolveSuccess<TimeKeeperOutput>) result).output();
	}

	private Object result(BombEntity bomb, TimeKeeperInput input) {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.THE_TIME_KEEPER);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		module.setBomb(bomb);
		bomb.setModules(List.of(module));
		return solver.solve(new RoundEntity(), bomb, module, input);
	}

	private static BombEntity bomb() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("ABC123");
		return bomb;
	}

	private static TimeKeeperInput input(int number, Color display, List<Color> leds) {
		return new TimeKeeperInput(number, display, leds, 6);
	}
}
