package ktanesolver.module.modded.regular.blackhole;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

class BlackHoleSolverTest {
	private final BlackHoleSolver solver = new BlackHoleSolver();

	@Test
	void calculatesTheDefaultGridCodeWithWrapping() {
		assertThat(BlackHoleSolver.calculateCode("AB0CD0", 0, 7))
			.containsExactly(3, 1, 4, 3, 0, 4, 1);
		assertThat(BlackHoleSolver.calculateCode("AB0CD0", 1, 3))
			.containsExactly(3, 0, 2);
	}

	@Test
	void shortensOneBlackHoleFromSevenDigitsToThree() {
		BombEntity bomb = bomb();
		ModuleEntity blackHole = module(ModuleType.BLACK_HOLE, bomb);
		ModuleEntity firstOther = module(ModuleType.WIRES, bomb);
		ModuleEntity secondOther = module(ModuleType.BUTTON, bomb);
		bomb.setModules(new ArrayList<>(List.of(blackHole, firstOther, secondOther)));

		BlackHoleOutput first = solve(bomb, blackHole);
		assertThat(first.digit()).isEqualTo(3);
		assertThat(blackHole.isSolved()).isFalse();

		firstOther.setSolved(true);
		BlackHoleOutput second = solve(bomb, blackHole);
		assertThat(second).extracting(BlackHoleOutput::digit, BlackHoleOutput::expectedHere, BlackHoleOutput::shortened)
			.containsExactly(1, 5, true);

		secondOther.setSolved(true);
		BlackHoleOutput third = solve(bomb, blackHole);
		assertThat(third).extracting(BlackHoleOutput::digit, BlackHoleOutput::expectedHere, BlackHoleOutput::shortened)
			.containsExactly(4, 3, true);
		assertThat(blackHole.isSolved()).isTrue();
	}

	@Test
	void sharesTheCodeAndMovesShortcutEligibilityBetweenInstances() {
		BombEntity bomb = bomb();
		ModuleEntity first = module(ModuleType.BLACK_HOLE, bomb);
		ModuleEntity second = module(ModuleType.BLACK_HOLE, bomb);
		ModuleEntity other = module(ModuleType.WIRES, bomb);
		bomb.setModules(new ArrayList<>(List.of(first, second, other)));

		assertThat(solve(bomb, first).digit()).isEqualTo(3);
		assertThat(solve(bomb, second).digit()).isEqualTo(1);
		other.setSolved(true);
		BlackHoleOutput result = solve(bomb, first);

		assertThat(result.digit()).isEqualTo(4);
		assertThat(result.enteredGlobally()).isEqualTo(3);
		assertThat(result.expectedGlobally()).isEqualTo(12);
		assertThat(first.getState().get("expected")).isEqualTo(7);
		assertThat(second.getState().get("expected")).isEqualTo(5);
	}

	@Test
	void rejectsSerialsWithoutDigitsAtCharactersThreeAndSix() {
		BombEntity bomb = bomb();
		bomb.setSerialNumber("ABCDEF");
		ModuleEntity module = module(ModuleType.BLACK_HOLE, bomb);
		bomb.setModules(List.of(module));
		assertThat(solver.solve(new RoundEntity(), bomb, module, new BlackHoleInput()))
			.isInstanceOf(SolveFailure.class);
	}

	private BlackHoleOutput solve(BombEntity bomb, ModuleEntity module) {
		SolveResult<BlackHoleOutput> result = solver.solve(new RoundEntity(), bomb, module, new BlackHoleInput());
		assertThat(result).isInstanceOf(SolveSuccess.class);
		return ((SolveSuccess<BlackHoleOutput>) result).output();
	}

	private static BombEntity bomb() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("AB0CD0");
		return bomb;
	}

	private static ModuleEntity module(ModuleType type, BombEntity bomb) {
		ModuleEntity module = new ModuleEntity();
		module.setType(type);
		module.setBomb(bomb);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
