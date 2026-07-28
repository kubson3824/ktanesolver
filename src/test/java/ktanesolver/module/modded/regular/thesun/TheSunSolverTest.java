package ktanesolver.module.modded.regular.thesun;

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
import ktanesolver.module.modded.regular.thesun.TheSunInput.Direction;

class TheSunSolverTest {
	private final TheSunSolver solver = new TheSunSolver();

	@Test
	void derivesSectionsOrdersSetsAndStopsAtCenter() {
		BombEntity clockwise = bomb("F6G7H8", 3);
		clockwise.setAaBatteryCount(4);
		clockwise.setDBatteryCount(1);
		clockwise.setIndicators(Map.of("CAR", true));
		PortPlateEntity plate = new PortPlateEntity();
		plate.setPorts(Set.of(PortType.DVI));
		clockwise.setPortPlates(List.of(plate));
		assertThat(solve(clockwise)).containsExactly(
			"inner southeast", "outer south", "inner southwest", "inner west",
			"outer northwest", "outer north", "inner northeast", "center"
		);

		assertThat(solve(bomb("Z9A0F5", 2))).containsExactly(
			"outer east", "inner southeast", "outer south", "inner northeast",
			"outer north", "inner southwest", "outer west", "outer northwest"
		);

		BombEntity earlyCenter = bomb("A1B2C3", 3);
		earlyCenter.setAaBatteryCount(4);
		earlyCenter.setDBatteryCount(1);
		assertThat(solve(earlyCenter)).containsExactly("inner southeast", "center");

		assertThat(solver.solve(new RoundEntity(), clockwise, new ModuleEntity(), new TheSunInput(null)))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private List<String> solve(BombEntity bomb) {
		return ((SolveSuccess<TheSunOutput>)solver.solve(
			new RoundEntity(), bomb, new ModuleEntity(), new TheSunInput(Direction.NORTH)
		)).output().pressSequence();
	}

	private static BombEntity bomb(String serial, int moduleCount) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		for (int i = 0; i < moduleCount; i++) bomb.getModules().add(new ModuleEntity());
		return bomb;
	}
}
