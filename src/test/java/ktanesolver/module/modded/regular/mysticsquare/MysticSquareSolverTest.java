package ktanesolver.module.modded.regular.mysticsquare;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class MysticSquareSolverTest {

	@Test
	void solvesWhenEmptyCellPrecedesNumberBeingLocated() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("ABC123");
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());

		var result = new MysticSquareSolver().solve(
			new RoundEntity(), bomb, module,
			new MysticSquareInput(new ArrayList<>(Arrays.asList(null, 1, 2, 3, 4, 5, 6, 7, 8)))
		);

		assertThat(result).isInstanceOf(SolveSuccess.class);
	}
}
