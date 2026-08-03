package ktanesolver.module.modded.regular.x01;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class X01SolverTest {
	private final X01Solver solver = new X01Solver();

	@Test
	void calculatesARestrictedCheckoutAndValidatesTheBoard() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("ABC123");
		bomb.setIndicators(Map.of("BOB", true, "CAR", false, "FRK", true));
		List<Integer> values = List.of(2, 7, 20, 4, 19, 5, 12, 11, 10, 3);

		@SuppressWarnings("unchecked")
		X01Output output = ((SolveSuccess<X01Output>)solver.solve(
			new RoundEntity(), bomb, new ModuleEntity(), new X01Input(values)
		)).output();

		assertThat(output.targetScore()).isEqualTo(51);
		assertThat(output.dartCount()).isEqualTo(3);
		assertThat(output.restrictions()).isEqualTo("BEI");
		assertThat(output.darts()).containsExactly("D11", "SB", "D2");

		assertThat(solver.solve(
			new RoundEntity(), bomb, new ModuleEntity(),
			new X01Input(List.of(1, 1, 2, 3, 4, 5, 6, 7, 8, 9))
		)).isInstanceOf(SolveFailure.class);
	}
}
