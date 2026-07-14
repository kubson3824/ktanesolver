package ktanesolver.module.modded.regular.battleship;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;

class BattleshipSolverTest {
	private final BattleshipSolver solver = new BattleshipSolver();

	@Test
	void derivesSafeCellsAndSolvesTheUniqueFleet() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("ABC123");
		bomb.setAaBatteryCount(1);
		PortPlateEntity plate = new PortPlateEntity();
		plate.setPorts(new LinkedHashSet<>(List.of(PortType.DVI, PortType.PARALLEL)));
		bomb.setPortPlates(List.of(plate));

		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		BattleshipInput scanInput = new BattleshipInput(
			List.of(3, 0, 1, 2, 0), List.of(1, 2, 1, 0, 2), List.of(1, 1, 1, 0), null);

		SolveSuccess<BattleshipOutput> scan = success(solver.solve(new RoundEntity(), bomb, module, scanInput));
		assertThat(scan.solved()).isFalse();
		assertThat(scan.output().safeLocations()).containsExactly("A1", "B2", "C3", "B1");

		BattleshipInput solveInput = new BattleshipInput(
			scanInput.rowCounts(), scanInput.columnCounts(), scanInput.shipCounts(), List.of("A1", "B1"));
		SolveSuccess<BattleshipOutput> solved = success(solver.solve(new RoundEntity(), bomb, module, solveInput));
		assertThat(solved.output().shipLocations()).containsExactly("A1", "B1", "C1", "E3", "B4", "E4");
		assertThat(module.isSolved()).isTrue();
	}

	@SuppressWarnings("unchecked")
	private static SolveSuccess<BattleshipOutput> success(Object result) {
		assertThat(result).isInstanceOf(SolveSuccess.class);
		return (SolveSuccess<BattleshipOutput>)result;
	}
}
