package ktanesolver.module.modded.regular.foreignexchange;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class ForeignExchangeSolverTest {
	private final ForeignExchangeSolver solver = new ForeignExchangeSolver();

	@Test
	void acceptsNumericCodesAndSwapsDisplayedRowsForMultipleBatteries() {
		assertThat(solve(new BombEntity(), "AUD", "978")).isEqualTo(new ForeignExchangeOutput(7));

		BombEntity multipleBatteries = new BombEntity();
		multipleBatteries.setAaBatteryCount(2);
		assertThat(solve(multipleBatteries, "840", "EUR")).isEqualTo(new ForeignExchangeOutput(4));
	}

	@SuppressWarnings("unchecked")
	private ForeignExchangeOutput solve(BombEntity bomb, String topRow, String middleRow) {
		return ((SolveSuccess<ForeignExchangeOutput>)solver.solve(
			new RoundEntity(), bomb, new ModuleEntity(), new ForeignExchangeInput(topRow, middleRow, "100", false))).output();
	}
}
