package ktanesolver.module.modded.regular.braille;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class BrailleSolverTest {
	private final BrailleSolver solver = new BrailleSolver();

	@Test
	void undoesLetterAndDigitSerialFlipsAndDecodesContractions() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("A0B0C0");
		ModuleEntity module = new ModuleEntity();

		assertThat(solver.solve(new RoundEntity(), bomb, module, new BrailleInput(List.of(39, 56, 30, 44))))
			.isEqualTo(new SolveSuccess<>(new BrailleOutput("acting", 3), true));
		assertThat(module.getState().get("braillePatterns")).isEqualTo(List.of(39, 56, 30, 44));
	}

	@Test
	void rejectsImpossibleDisplayedPatterns() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("A0B0C0");
		assertThat(solver.solve(new RoundEntity(), bomb, new ModuleEntity(), new BrailleInput(List.of(0, 1, 1, 1))))
			.isInstanceOf(SolveFailure.class);
	}
}
