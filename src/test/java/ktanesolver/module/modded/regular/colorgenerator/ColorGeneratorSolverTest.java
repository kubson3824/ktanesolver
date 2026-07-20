package ktanesolver.module.modded.regular.colorgenerator;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class ColorGeneratorSolverTest {
	@Test
	void convertsLettersDigitsAndModuloSixteenIntoRgbValues() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("PZ9A0F");

		var result = (SolveSuccess<ColorGeneratorOutput>) new ColorGeneratorSolver().solve(
			new RoundEntity(), bomb, new ModuleEntity(), new ColorGeneratorInput());

		assertThat(result.output()).isEqualTo(new ColorGeneratorOutput(10, 145, 6));
	}
}
