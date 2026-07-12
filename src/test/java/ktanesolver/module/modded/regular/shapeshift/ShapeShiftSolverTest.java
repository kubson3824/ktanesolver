package ktanesolver.module.modded.regular.shapeshift;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.shapeshift.ShapeShiftInput.Edge;

class ShapeShiftSolverTest {
	private final ShapeShiftSolver solver = new ShapeShiftSolver();

	@Test
	void returnsTheFirstRepeatedShape() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("ABC124");
		bomb.setIndicators(new HashMap<>());

		assertThat(solve(bomb, new ShapeShiftInput(Edge.SQUARE, Edge.SQUARE)))
			.isEqualTo(new ShapeShiftOutput(Edge.SQUARE, Edge.SQUARE));
	}

	@Test
	void usesBombEdgeworkForTransitions() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("ABC125");
		bomb.setAaBatteryCount(3);
		bomb.setIndicators(new HashMap<>(Map.of("SIG", true, "MSA", true, "SND", true, "IND", true, "CAR", false, "BOB", false, "FRQ", false)));
		PortPlateEntity plate = new PortPlateEntity();
		plate.setPorts(Set.of(PortType.DVI, PortType.PARALLEL, PortType.PS2, PortType.RJ45, PortType.STEREO_RCA));
		bomb.getPortPlates().add(plate);

		assertThat(solve(bomb, new ShapeShiftInput(Edge.SQUARE, Edge.SQUARE)))
			.isEqualTo(new ShapeShiftOutput(Edge.ROUND, Edge.POINT));
	}

	private ShapeShiftOutput solve(BombEntity bomb, ShapeShiftInput input) {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.SHAPE_SHIFT);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return ((SolveSuccess<ShapeShiftOutput>) solver.solve(new RoundEntity(), bomb, module, input)).output();
	}
}
