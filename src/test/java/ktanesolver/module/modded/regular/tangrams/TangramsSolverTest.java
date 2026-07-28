package ktanesolver.module.modded.regular.tangrams;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class TangramsSolverTest {
	private final TangramsSolver solver = new TangramsSolver();

	@Test
	void solvesEveryTemplateAndRejectsMalformedCodes() {
		assertThat(solve("TAN-D", "376581")).containsExactly(
			new TangramsConnection(1, 8),
			new TangramsConnection(2, 1),
			new TangramsConnection(5, 4)
		);
		assertThat(solve("TAN-D", "1231121")).containsExactly(
			new TangramsConnection(2, 1),
			new TangramsConnection(3, 2),
			new TangramsConnection(5, 6)
		);
		assertThat(solve("TAN-D", "121123412")).containsExactly(
			new TangramsConnection(2, 12),
			new TangramsConnection(3, 4),
			new TangramsConnection(5, 4)
		);
		assertThat(solve("TAN-S", "1211212")).containsExactly(
			new TangramsConnection(2, 6),
			new TangramsConnection(3, 6),
			new TangramsConnection(4, 14)
		);
		assertThat(solve("TAN-S", "12123412")).containsExactly(
			new TangramsConnection(1, 8),
			new TangramsConnection(2, 14),
			new TangramsConnection(3, 4)
		);
		assertThat(solve("TAN-S", "112123412")).containsExactly(
			new TangramsConnection(1, 2),
			new TangramsConnection(2, 1),
			new TangramsConnection(3, 4)
		);

		assertThat(result("TAN-X", "376581")).isInstanceOf(SolveFailure.class);
		assertThat(result("TAN-D", "12345678")).isInstanceOf(SolveFailure.class);
		assertThat(result("TAN-D", "111111")).isInstanceOf(SolveFailure.class);
		assertThat(result("TAN-S", "9999999")).isInstanceOf(SolveFailure.class);
	}

	private List<TangramsConnection> solve(String chipType, String chipCode) {
		return ((SolveSuccess<TangramsOutput>)result(chipType, chipCode)).output().connections();
	}

	private Object result(String chipType, String chipCode) {
		return solver.solve(
			new RoundEntity(), new BombEntity(), new ModuleEntity(), new TangramsInput(chipType, chipCode)
		);
	}
}
