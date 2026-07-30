package ktanesolver.module.modded.regular.thecube;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.thecube.TheCubeInput.Button;
import ktanesolver.module.modded.regular.thecube.TheCubeInput.Color;
import ktanesolver.module.modded.regular.thecube.TheCubeInput.Rotation;
import ktanesolver.module.modded.regular.thecube.TheCubeOutput.StageSolution;

class TheCubeSolverTest {
	private final TheCubeSolver solver = new TheCubeSolver();

	@Test
	void calculatesEveryCipherAndStageRuleAndRecordsSouvenirRotations() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("A1B2C3");
		bomb.setModules(List.of(new ModuleEntity(), new ModuleEntity(), new ModuleEntity()));
		ModuleEntity module = module();
		TheCubeInput input = new TheCubeInput(
			List.of(
				Rotation.ROTATE_CLOCKWISE,
				Rotation.ROTATE_COUNTERCLOCKWISE,
				Rotation.TIP_FORWARDS,
				Rotation.TIP_BACKWARDS,
				Rotation.TIP_LEFT,
				Rotation.TIP_RIGHT
			),
			List.of(1, 2, 3, 4, 5, 6),
			List.of(Color.BLUE, Color.GREEN, Color.ORANGE, Color.RED),
			List.of(
				new Button(Color.BLUE, "A"),
				new Button(Color.GREEN, "B"),
				new Button(Color.ORANGE, "C"),
				new Button(Color.RED, "D"),
				new Button(Color.WHITE, "E"),
				new Button(Color.PURPLE, "F"),
				new Button(Color.BLUE, "G"),
				new Button(Color.GREEN, "H")
			),
			new Button(Color.GREEN, "A"),
			"ABCDEFGH",
			"IJKLMNOP"
		);

		@SuppressWarnings("unchecked")
		TheCubeOutput output = ((SolveSuccess<TheCubeOutput>) solver.solve(
			new RoundEntity(), bomb, module, input
		)).output();

		assertThat(output).isEqualTo(new TheCubeOutput("521533", "54511324", List.of(
			new StageSolution(1, 5, List.of(5)),
			new StageSolution(2, 4, List.of(1, 8)),
			new StageSolution(3, 5, List.of(5)),
			new StageSolution(4, 1, List.of(2, 5, 8)),
			new StageSolution(5, 1, List.of(2, 5)),
			new StageSolution(6, 3, List.of(1, 3, 7)),
			new StageSolution(7, 2, List.of(3, 4)),
			new StageSolution(8, 4, List.of(1, 2, 3, 4, 5, 6, 7))
		)));
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState().get("rotations")).isEqualTo(List.of(
			"rotate clockwise", "rotate counterclockwise", "tip forwards",
			"tip backwards", "tip left", "tip right"
		));
	}

	@Test
	void rejectsIncompleteObservations() {
		TheCubeInput input = new TheCubeInput(
			List.of(Rotation.ROTATE_CLOCKWISE),
			List.of(1, 2, 3, 4, 5, 6),
			List.of(Color.BLUE, Color.GREEN, Color.ORANGE, Color.RED),
			List.of(),
			new Button(Color.BLUE, "A"),
			"ABCDEFGH",
			"IJKLMNOP"
		);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(), input))
			.isInstanceOf(SolveFailure.class);
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
