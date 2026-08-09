package ktanesolver.module.modded.regular.turtlerobot;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveSuccess;
import org.junit.jupiter.api.Test;

class TurtleRobotSolverTest {

	@Test
	void findsBugsAfterSplittingScalingMirroringReversingAndRotating() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.TURTLE_ROBOT);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());

		var result = new TurtleRobotSolver().solve(
			new RoundEntity(), new BombEntity(), module,
			new TurtleRobotInput(List.of(
				"FD 2", "RT 90", "FD 4", "LT 90", "LT 90 8", "FD 2",
				"LT 90 8", "LT 90", "FD 4", "RT 180", "LT 90 2", "LT 90",
				"FD 4", "LT 90", "FD 8", "LT 90", "FD 2", "FD 30"
			))
		);

		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(((SolveSuccess<TurtleRobotOutput>) result).output())
			.isEqualTo(new TurtleRobotOutput("Mushroom", List.of(6, 11, 18)));
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState()).containsKey("input");
	}
}
