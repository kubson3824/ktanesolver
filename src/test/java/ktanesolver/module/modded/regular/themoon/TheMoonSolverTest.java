package ktanesolver.module.modded.regular.themoon;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.themoon.TheMoonInput.Direction;

class TheMoonSolverTest {
	private final TheMoonSolver solver = new TheMoonSolver();

	@Test
	void derivesSectionsOrdersSetsAndStopsAtCenter() {
		BombEntity bomb = bomb("A1B2C3", 2);
		bomb.setAaBatteryCount(4);
		bomb.setDBatteryCount(1);
		bomb.setIndicators(Map.of("CAR", true));
		PortPlateEntity plate = new PortPlateEntity();
		plate.setPorts(Set.of(PortType.DVI));
		bomb.setPortPlates(List.of(plate));

		assertThat(solve(bomb)).containsExactly(
			"outer southwest", "outer northwest", "outer northeast", "outer west",
			"outer south", "outer north", "inner east", "inner southeast"
		);

		bomb.setIndicators(Map.of("CAR", true, "FRK", false, "NSA", true, "BOB", false, "SND", true));
		assertThat(solve(bomb)).containsExactly("center");

		assertThat(solver.solve(new RoundEntity(), bomb, new ModuleEntity(), new TheMoonInput(null)))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private List<String> solve(BombEntity bomb) {
		return ((SolveSuccess<TheMoonOutput>)solver.solve(
			new RoundEntity(), bomb, new ModuleEntity(), new TheMoonInput(Direction.NORTH)
		)).output().pressSequence();
	}

	private static BombEntity bomb(String serial, int moduleCount) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		for (int i = 0; i < moduleCount; i++) bomb.getModules().add(new ModuleEntity());
		return bomb;
	}
}
