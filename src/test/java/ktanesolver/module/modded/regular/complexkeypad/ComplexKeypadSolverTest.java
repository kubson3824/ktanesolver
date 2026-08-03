package ktanesolver.module.modded.regular.complexkeypad;

import static ktanesolver.module.modded.regular.complexkeypad.ComplexKeypadInput.Symbol.*;
import static org.assertj.core.api.Assertions.assertThat;

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
import ktanesolver.module.modded.regular.complexkeypad.ComplexKeypadInput.Symbol;

class ComplexKeypadSolverTest {
	private final ComplexKeypadSolver solver = new ComplexKeypadSolver();
	private final List<Symbol> symbols = List.of(
		THETA, ALPHA, EPSILON, PSI, MU, XI, ZETA, SIGMA, BETA
	);

	@Test
	void followsTheThreeRulesAndRejectsAnInvalidKeypad() {
		assertThat(solve(new BombEntity(), symbols))
			.isEqualTo(new ComplexKeypadOutput(List.of(2, 3, 1, 4, 5, 6, 7, 8, 9), "CHART_FORWARD"));

		BombEntity reverse = new BombEntity();
		reverse.setIndicators(Map.of("BOB", true));
		reverse.replacePortPlates(List.of(Set.of(PortType.DVI)));
		assertThat(solve(reverse, symbols).pressPositions())
			.containsExactly(9, 8, 7, 6, 5, 4, 1, 3, 2);

		BombEntity readingOrder = new BombEntity();
		readingOrder.setAaBatteryCount(3);
		readingOrder.replacePortPlates(List.of(Set.of(PortType.PARALLEL)));
		assertThat(solve(readingOrder, List.of()).pressPositions())
			.containsExactly(1, 2, 3, 4, 5, 6, 7, 8, 9);

		assertThat(solver.solve(
			new RoundEntity(), new BombEntity(), new ModuleEntity(),
			new ComplexKeypadInput(List.of(ALPHA, EPSILON))
		)).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private ComplexKeypadOutput solve(BombEntity bomb, List<Symbol> input) {
		return ((SolveSuccess<ComplexKeypadOutput>) solver.solve(
			new RoundEntity(), bomb, new ModuleEntity(), new ComplexKeypadInput(input)
		)).output();
	}
}
