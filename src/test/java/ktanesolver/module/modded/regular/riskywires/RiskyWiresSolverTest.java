package ktanesolver.module.modded.regular.riskywires;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class RiskyWiresSolverTest {
	@Test void evaluatesTheSixVisibleWireRules() {
		BombEntity bomb = new BombEntity(); bomb.setSerialNumber("ABC1D2"); bomb.setDBatteryCount(2);
		RiskyWiresInput input = new RiskyWiresInput("1234", RiskyWiresInput.LedColor.OFF, RiskyWiresInput.LedColor.GREEN, List.of(RiskyWiresInput.WireColor.RED, RiskyWiresInput.WireColor.BLUE, RiskyWiresInput.WireColor.YELLOW, RiskyWiresInput.WireColor.GREEN, RiskyWiresInput.WireColor.PURPLE, RiskyWiresInput.WireColor.RED), 0);
		assertThat(solve(bomb, input).cutPositions()).containsExactly(2, 5, 6);
	}
	@SuppressWarnings("unchecked") private static RiskyWiresOutput solve(BombEntity bomb, RiskyWiresInput input) { ModuleEntity module = new ModuleEntity(); module.setState(new HashMap<>()); module.setSolution(new HashMap<>()); return ((SolveSuccess<RiskyWiresOutput>) new RiskyWiresSolver().solve(new RoundEntity(), bomb, module, input)).output(); }
}
