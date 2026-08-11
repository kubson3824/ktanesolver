package ktanesolver.module.modded.regular.theswitch;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.HashMap;
import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;

class TheSwitchSolverTest {
	private final TheSwitchSolver solver = new TheSwitchSolver();

	@Test void coversEveryDownRuleInPriorityOrder() {
		BombEntity even = bomb("ABC124"), odd = bomb("ABC123");
		assertThat(TheSwitchSolver.digit(even, SwitchPosition.DOWN, SwitchColor.RED, SwitchColor.BLUE)).isEqualTo(5);
		assertThat(TheSwitchSolver.digit(even, SwitchPosition.DOWN, SwitchColor.GREEN, SwitchColor.PURPLE)).isEqualTo(3);
		assertThat(TheSwitchSolver.digit(odd, SwitchPosition.DOWN, SwitchColor.PURPLE, SwitchColor.YELLOW)).isEqualTo(6);
		assertThat(TheSwitchSolver.digit(even, SwitchPosition.DOWN, SwitchColor.PURPLE, SwitchColor.PURPLE)).isEqualTo(0);
		assertThat(TheSwitchSolver.digit(even, SwitchPosition.DOWN, SwitchColor.PURPLE, SwitchColor.GREEN)).isEqualTo(9);
	}

	@Test void coversEveryUpRuleInPriorityOrder() {
		BombEntity bomb = bomb("ABC123"); PortPlateEntity plate = new PortPlateEntity(); plate.setPorts(java.util.Set.of(PortType.RJ45)); bomb.setPortPlates(List.of(plate));
		assertThat(TheSwitchSolver.digit(bomb, SwitchPosition.UP, SwitchColor.PURPLE, SwitchColor.ORANGE)).isEqualTo(1);
		bomb.setPortPlates(List.of()); assertThat(TheSwitchSolver.digit(bomb, SwitchPosition.UP, SwitchColor.ORANGE, SwitchColor.RED)).isEqualTo(4);
		assertThat(TheSwitchSolver.digit(bomb, SwitchPosition.UP, SwitchColor.GREEN, SwitchColor.RED)).isEqualTo(7);
		bomb.setAaBatteryCount(2); bomb.getIndicators().put("TRN", false); assertThat(TheSwitchSolver.digit(bomb, SwitchPosition.UP, SwitchColor.GREEN, SwitchColor.BLUE)).isEqualTo(8);
		assertThat(TheSwitchSolver.digit(bomb("ABC123"), SwitchPosition.UP, SwitchColor.GREEN, SwitchColor.BLUE)).isEqualTo(2);
	}

	@Test void solvesTwoSuccessfulFlipsAndRestartOverwritesSouvenirFacts() {
		BombEntity bomb = bomb("ABC123"); ModuleEntity module = module();
		SolveSuccess<TheSwitchOutput> first = solve(bomb, module, new TheSwitchInput(SwitchPosition.DOWN, SwitchColor.RED, SwitchColor.GREEN, true));
		assertThat(first.solved()).isFalse(); assertThat(first.output().timerDigit()).isEqualTo(5);
		SolveSuccess<TheSwitchOutput> second = solve(bomb, module, new TheSwitchInput(SwitchPosition.UP, SwitchColor.BLUE, SwitchColor.YELLOW, false));
		assertThat(second.solved()).isTrue();
		assertThat(module.getState()).containsEntry("stage1Top", "red").containsEntry("stage2Bottom", "yellow");
		module.setSolved(false); solve(bomb, module, new TheSwitchInput(SwitchPosition.DOWN, SwitchColor.PURPLE, SwitchColor.ORANGE, true));
		assertThat(module.getState()).containsEntry("stage1Top", "purple").containsEntry("successfulFlips", 1);
	}

	@SuppressWarnings("unchecked") private SolveSuccess<TheSwitchOutput> solve(BombEntity bomb, ModuleEntity module, TheSwitchInput input) { return (SolveSuccess<TheSwitchOutput>) solver.solve(new RoundEntity(), bomb, module, input); }
	private static BombEntity bomb(String serial) { BombEntity bomb = new BombEntity(); bomb.setSerialNumber(serial); return bomb; }
	private static ModuleEntity module() { ModuleEntity module = new ModuleEntity(); module.setType(ModuleType.THE_SWITCH); module.setState(new HashMap<>()); module.setSolution(new HashMap<>()); return module; }
}
