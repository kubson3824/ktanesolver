package ktanesolver.module.modded.regular.taxreturns;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class TaxReturnsSolverTest {
	private final TaxReturnsSolver solver = new TaxReturnsSolver();

	@Test
	void calculatesEveryTaxStageAndValidatesTheRecords() {
		BombEntity bomb = new BombEntity();
		bomb.setIndicators(Map.of("CAR", true, "FRK", true, "NSA", false));
		bomb.replacePortPlates(List.of(
			Set.of(PortType.SERIAL, PortType.RJ45),
			Set.of(PortType.SERIAL, PortType.DVI)
		));

		TaxReturnsOutput output = solve(bomb, new TaxReturnsInput(
			List.of(20_000, 20_000, 20_000, 20_000, 20_000, 20_000, 20_000, 20_000, 20_000, 20_000, 20_000, 20_000),
			new ArrayList<>(java.util.Collections.nCopies(36, 1_000)),
			"A", "C", 7
		)).output();

		assertThat(output).isEqualTo(new TaxReturnsOutput(
			240_000, 36_000, 5, 12_000, "D", 2_796,
			189_204, 0, 71_334, 6_566, 77_900
		));

		assertThat(solver.solve(new RoundEntity(), bomb, new ModuleEntity(),
			new TaxReturnsInput(List.of(1), List.of(), "A", "C", 7)))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<TaxReturnsOutput> solve(BombEntity bomb, TaxReturnsInput input) {
		return (SolveSuccess<TaxReturnsOutput>) solver.solve(new RoundEntity(), bomb, new ModuleEntity(), input);
	}
}
