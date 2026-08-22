package ktanesolver.module.modded.regular.thematrix;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class TheMatrixSolverTest {
	private final TheMatrixSolver solver = new TheMatrixSolver();

	@Test
	void solvesAccessCodeAndGlitch() {
		ModuleEntity module = new ModuleEntity();
		var result = solver.solve(new RoundEntity(), new BombEntity(), module,
			new TheMatrixInput("HTIMS", "OEN", List.of("Headjack", "Phone", "Dystopia", "Control", "Paradise", "Oddity")));
		assertThat(result).isInstanceOf(SolveSuccess.class);
		TheMatrixOutput output = (TheMatrixOutput) ((SolveSuccess<?>) result).output();
		assertThat(output.accessCodeNames()).containsExactly("Smith", "Neo");
		assertThat(output.accessSeconds()).isEqualTo(30);
		assertThat(output.listNumber()).isZero();
		assertThat(output.glitchWord()).isEqualTo("Oddity");
		assertThat(output.pill()).isEqualTo("RED");
		assertThat(module.getState().get("matrixAccessCodeNames")).isEqualTo(List.of("Smith", "Neo"));
	}
}
