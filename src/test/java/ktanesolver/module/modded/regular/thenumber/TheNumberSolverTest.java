package ktanesolver.module.modded.regular.thenumber;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.DayOfWeek;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class TheNumberSolverTest {
	private final TheNumberSolver solver = new TheNumberSolver();

	@Test
	void appliesPriorityRulesFallbackAndValidatesTheKeypad() {
		BombEntity priorityBomb = bomb();
		priorityBomb.getModules().add(module(ModuleType.THE_NUMBER, false));
		for(int i = 0; i < 7; i++) priorityBomb.getModules().add(module(ModuleType.WIRES, true));

		TheNumberOutput priority = solve(priorityBomb, new TheNumberInput(
			List.of(1, 3, 5, 0, 2, 4, 6, 7, 8, 9), true, 10, DayOfWeek.MONDAY, 9, false
		));
		assertThat(priority).isEqualTo(new TheNumberOutput("7271", List.of(8, 5, 8, 1)));

		BombEntity fallbackBomb = bomb();
		fallbackBomb.setAaBatteryCount(2);
		fallbackBomb.replacePortPlates(List.of(Set.of(PortType.SERIAL), Set.of(PortType.SERIAL)));
		fallbackBomb.getModules().add(module(ModuleType.THE_NUMBER, false));

		TheNumberOutput fallback = solve(fallbackBomb, new TheNumberInput(
			List.of(4, 6, 7, 8, 9, 0, 1, 2, 3, 5), false, 10, DayOfWeek.SUNDAY, 9, false
		));
		assertThat(fallback).isEqualTo(new TheNumberOutput("4444", List.of(1, 1, 1, 1)));

		assertThat(solver.solve(new RoundEntity(), fallbackBomb, fallbackBomb.getModules().getFirst(),
			new TheNumberInput(List.of(0, 0, 1, 2, 3, 4, 5, 6, 7, 8), false, 10, DayOfWeek.SUNDAY, 9, false)))
			.isInstanceOf(SolveFailure.class);
	}

	private TheNumberOutput solve(BombEntity bomb, TheNumberInput input) {
		return ((SolveSuccess<TheNumberOutput>)solver.solve(
			new RoundEntity(), bomb, bomb.getModules().getFirst(), input
		)).output();
	}

	private static BombEntity bomb() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("ABC123");
		bomb.setModules(new ArrayList<>());
		return bomb;
	}

	private static ModuleEntity module(ModuleType type, boolean solved) {
		ModuleEntity module = new ModuleEntity();
		module.setType(type);
		module.setSolved(solved);
		return module;
	}
}
