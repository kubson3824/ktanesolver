package ktanesolver.module.modded.regular.rubikscube;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

class RubiksCubeSolverTest {
	private final RubiksCubeSolver solver = new RubiksCubeSolver();

	@Test
	void appliesOrderingOppositeAndReverseRules() {
		assertThat(solve(List.of("YELLOW", "BLUE", "RED", "GREEN", "ORANGE", "WHITE")))
			.containsExactly("R'", "U'", "R'", "F", "U", "U", "F", "U", "B", "B'");
		assertThat(solve(List.of("YELLOW", "BLUE", "ORANGE", "GREEN", "RED", "WHITE")))
			.containsExactly("R", "U'", "B'", "R'", "R", "U", "R'", "U", "U", "B'");
		assertThat(solve(List.of("YELLOW", "BLUE", "RED", "ORANGE", "GREEN", "WHITE")))
			.containsExactly("B'", "U", "B'", "U", "U", "R'", "F", "U'", "U", "R'");
		assertThat(solve(List.of("YELLOW", "BLUE", "RED", "GREEN", "WHITE", "ORANGE")))
			.containsExactly("B'", "B", "U", "F", "U", "U", "F", "R'", "U'", "R'");
	}

	@Test
	void rejectsInvalidInputs() {
		assertThat(solveResult("ABC123", List.of("YELLOW", "YELLOW", "RED", "GREEN", "ORANGE", "WHITE")))
			.isInstanceOf(SolveFailure.class);
		assertThat(solveResult("ABC12", List.of("YELLOW", "BLUE", "RED", "GREEN", "ORANGE", "WHITE")))
			.isInstanceOf(SolveFailure.class);
	}

	private List<String> solve(List<String> colors) {
		SolveResult<RubiksCubeOutput> result = solveResult("ABC123", colors);
		assertThat(result).isInstanceOf(SolveSuccess.class);
		return ((SolveSuccess<RubiksCubeOutput>) result).output().moves();
	}

	private SolveResult<RubiksCubeOutput> solveResult(String serial, List<String> colors) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.RUBIKS_CUBE);
		return solver.solve(new RoundEntity(), bomb, module, new RubiksCubeInput(colors));
	}
}
