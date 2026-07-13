package ktanesolver.module.modded.regular.hexamaze;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class HexamazeSolverTest {
	@Test
	void matchesDefaultMazeAndFindsAValidRedExit() {
		var input = new HexamazeInput(Map.of(
			"-3,1", "TRIANGLE_UP",
			"0,0", "HEXAGON",
			"3,-2", "HEXAGON"
		), 0, 1, "RED");
		var result = new HexamazeSolver().solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), input);

		assertThat(result).isInstanceOf(SolveSuccess.class);
		var output = ((SolveSuccess<HexamazeOutput>) result).output();
		assertThat(output.mazeCenterQ()).isZero();
		assertThat(output.mazeCenterR()).isZero();
		assertThat(output.clockwiseRotation()).isZero();
		assertThat(output.moves()).isNotEmpty();
		assertThat(output.walls()).isNotEmpty();
		assertThat(output.walls()).allMatch(wall -> wall.matches("-?\\d+,-?\\d+,[0-5]"));
	}
}
