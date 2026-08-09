package ktanesolver.module.modded.regular.usamaze;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class USAMazeSolverTest {
	private final USAMazeSolver solver = new USAMazeSolver();

	@Test
	void followsDefaultLandAndWeekdayFlightEdgesAndRecordsTheOrigin() {
		ModuleEntity land = module();
		assertThat(solve(land, new USAMazeInput("AL", "FL", "Monday")))
			.isEqualTo(new USAMazeOutput(List.of("AL", "FL"), List.of("Circle")));

		ModuleEntity flight = module();
		assertThat(solve(flight, new USAMazeInput("AK", "WA", "Sunday")))
			.isEqualTo(new USAMazeOutput(List.of("AK", "WA"), List.of("Circle")));
		assertThat(flight.getState()).containsEntry("souvenirState", "Alaska");
	}

	@SuppressWarnings("unchecked")
	private USAMazeOutput solve(ModuleEntity module, USAMazeInput input) {
		return ((SolveSuccess<USAMazeOutput>) solver.solve(new RoundEntity(), new BombEntity(), module, input)).output();
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
