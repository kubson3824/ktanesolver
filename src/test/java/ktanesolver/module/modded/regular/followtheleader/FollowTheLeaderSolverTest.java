package ktanesolver.module.modded.regular.followtheleader;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.followtheleader.FollowTheLeaderInput.WireColor;

class FollowTheLeaderSolverTest {
	private final FollowTheLeaderSolver solver = new FollowTheLeaderSolver();

	@Test
	void followsTableFromRj45StartAndHandlesClrFallback() {
		BombEntity bomb = bomb("A1B2C3", Map.of());
		PortPlateEntity plate = new PortPlateEntity();
		plate.setPorts(Set.of(PortType.RJ45));
		bomb.getPortPlates().add(plate);
		List<WireColor> colors = List.of(WireColor.RED, WireColor.GREEN, WireColor.WHITE, WireColor.BLUE, WireColor.RED, WireColor.YELLOW, WireColor.BLUE, WireColor.BLACK, WireColor.WHITE, WireColor.GREEN, WireColor.RED, WireColor.BLACK);

		assertThat(solve(bomb, colors)).isEqualTo(new FollowTheLeaderOutput(4, List.of(4, 6, 7, 8, 11, 3), "FORWARD", false));

		BombEntity clrBomb = bomb("ABC000", Map.of("CLR", true));
		assertThat(solve(clrBomb, colors)).isEqualTo(new FollowTheLeaderOutput(12, List.of(12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1), "DESCENDING", true));
	}

	private static BombEntity bomb(String serial, Map<String, Boolean> indicators) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setIndicators(new HashMap<>(indicators));
		return bomb;
	}

	private FollowTheLeaderOutput solve(BombEntity bomb, List<WireColor> colors) {
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return ((SolveSuccess<FollowTheLeaderOutput>) solver.solve(new RoundEntity(), bomb, module, new FollowTheLeaderInput(new ArrayList<>(colors)))).output();
	}
}
