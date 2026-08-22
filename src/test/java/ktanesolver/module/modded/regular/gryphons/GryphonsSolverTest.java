package ktanesolver.module.modded.regular.gryphons;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class GryphonsSolverTest {
	private final GryphonsSolver solver = new GryphonsSolver();

	@Test
	void followsBothNameBranchesAndStoresSouvenirFacts() {
		ModuleEntity first = module();
		assertThat(solve(first, "Gabe", 23, "A1B2C3")).isEqualTo(new GryphonsOutput("Crow", "Snow Leopard", "Scarf"));
		assertThat(first.getState()).containsEntry("gryphonsName", "Gabe").containsEntry("gryphonsAge", 23);
		assertThat(solve(module(), "Gabriel", 34, "Z9Y8X7")).isEqualTo(new GryphonsOutput("Cardinal", "Housecat", "Watch"));
	}

	@Test
	void rejectsImpossibleDisplayedData() {
		BombEntity bomb = new BombEntity(); bomb.setSerialNumber("ABC123");
		assertThat(solver.solve(new RoundEntity(), bomb, module(), new GryphonsInput("Gabe", 22))).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private GryphonsOutput solve(ModuleEntity module, String name, int age, String serial) {
		BombEntity bomb = new BombEntity(); bomb.setSerialNumber(serial);
		return ((SolveSuccess<GryphonsOutput>) solver.solve(new RoundEntity(), bomb, module, new GryphonsInput(name, age))).output();
	}
	private static ModuleEntity module() { ModuleEntity module = new ModuleEntity(); module.setState(new HashMap<>()); module.setSolution(new HashMap<>()); return module; }
}
