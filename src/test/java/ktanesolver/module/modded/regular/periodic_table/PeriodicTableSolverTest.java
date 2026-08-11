package ktanesolver.module.modded.regular.periodic_table;

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
import ktanesolver.module.modded.regular.periodic_table.PeriodicTableInput.Color;

class PeriodicTableSolverTest {
	private final PeriodicTableSolver solver = new PeriodicTableSolver();

	@Test void calculatesAllFourEdgeworkTermsAndElementAnswer() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("AB1C23");
		bomb.setAaBatteryCount(2); bomb.setDBatteryCount(1);
		bomb.setIndicators(Map.of("BOB", true, "CAR", false));
		bomb.replacePortPlates(List.of(Set.of(PortType.DVI, PortType.RJ45), Set.of(PortType.SERIAL)));
		PeriodicTableOutput out = solve(bomb, new PeriodicTableInput("Hydrogen", Color.RED, "He", Color.ORANGE, 3, Color.YELLOW, 4, Color.GREEN));
		assertThat(out).isEqualTo(new PeriodicTableOutput(69, "Thulium", "Tm", 4, 10, 15, 40, 69));
	}

	@Test void wrapsIntoOneThroughOneHundredEighteenAndAcceptsManualGreySpellings() {
		BombEntity bomb = new BombEntity(); bomb.setSerialNumber("999999");
		PeriodicTableOutput out = solve(bomb, new PeriodicTableInput("oganesson", Color.GREY, "Og", Color.GRAY, 118, Color.WHITE, 118, Color.WHITE));
		assertThat(out.atomicNumber()).isBetween(1, 118);
		assertThat(out.atomicNumber()).isEqualTo(Math.floorMod(out.total() - 1, 118) + 1);
	}

	@Test void containsTheExactOfficialElementDataAndRejectsBadClues() {
		assertThat(PeriodicTableSolver.NAMES).hasSize(118).doesNotHaveDuplicates();
		assertThat(PeriodicTableSolver.SYMBOLS).hasSize(118).doesNotHaveDuplicates();
		assertThat(PeriodicTableSolver.NAMES.get(106)).isEqualTo("Borium");
		BombEntity bomb = new BombEntity(); bomb.setSerialNumber("ABC123");
		assertThat(solver.solve(new RoundEntity(), bomb, new ModuleEntity(), new PeriodicTableInput("Bohrium", Color.RED, "Bh", Color.RED, 1, Color.RED, 1, Color.RED))).isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), bomb, new ModuleEntity(), new PeriodicTableInput("Hydrogen", Color.RED, "H", Color.RED, 0, Color.RED, 119, Color.RED))).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private PeriodicTableOutput solve(BombEntity bomb, PeriodicTableInput input) {
		return ((SolveSuccess<PeriodicTableOutput>) solver.solve(new RoundEntity(), bomb, new ModuleEntity(), input)).output();
	}
}
