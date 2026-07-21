package ktanesolver.module.modded.regular.backgrounds;

import static org.assertj.core.api.Assertions.assertThat;

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

class BackgroundsSolverTest {
	private final BackgroundsSolver solver = new BackgroundsSolver();

	@Test
	void appliesPriorityColorAndEdgeworkRules() {
		assertThat(solve(bomb(0, 0), "RED", "RED"))
			.isEqualTo(new BackgroundsOutput(7, "AE", 1, 3));
		assertThat(solve(bomb(2, 0), "BLACK", "RED"))
			.isEqualTo(new BackgroundsOutput(8, "DE", 2, 3));

		BombEntity edgework = bomb(2, 1);
		edgework.setIndicators(Map.of("SND", false));
		PortPlateEntity plate = new PortPlateEntity();
		plate.setPorts(Set.of(PortType.SERIAL));
		edgework.setPortPlates(List.of(plate));
		assertThat(solve(edgework, "ORANGE", "BLUE"))
			.isEqualTo(new BackgroundsOutput(5, "EC", 7, 8));

		assertThat(solve(bomb(2, 1), "RED", "PURPLE"))
			.isEqualTo(new BackgroundsOutput(6, "FD", 6, 9));
		assertThat(solve(bomb(2, 1), "ORANGE", "BLUE"))
			.isEqualTo(new BackgroundsOutput(5, "EA", 10, 10));
	}

	@SuppressWarnings("unchecked")
	private BackgroundsOutput solve(BombEntity bomb, String backing, String button) {
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return ((SolveSuccess<BackgroundsOutput>) solver.solve(
			new RoundEntity(), bomb, module, new BackgroundsInput(backing, button)
		)).output();
	}

	private static BombEntity bomb(int aa, int d) {
		BombEntity bomb = new BombEntity();
		bomb.setAaBatteryCount(aa);
		bomb.setDBatteryCount(d);
		return bomb;
	}
}
