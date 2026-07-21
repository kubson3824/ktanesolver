package ktanesolver.module.modded.regular.blindmaze;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.blindmaze.BlindMazeInput.ButtonColor;
import ktanesolver.module.modded.regular.blindmaze.BlindMazeOutput.Direction;

class BlindMazeSolverTest {
	private final BlindMazeSolver solver = new BlindMazeSolver();

	@Test
	void findsTheExactDefaultMazeRouteAndRecordsSouvenirColors() {
		BombEntity bomb = bomb();
		ModuleEntity module = module(ModuleType.BLIND_MAZE, false);
		bomb.setModules(List.of(module));
		var result = solve(bomb, module, new BlindMazeInput(
			ButtonColor.GREEN, ButtonColor.BLUE, ButtonColor.GRAY, ButtonColor.YELLOW
		));

		assertThat(result.output()).extracting(
			BlindMazeOutput::mazeNumber, BlindMazeOutput::rotationRule,
			BlindMazeOutput::startRow, BlindMazeOutput::startColumn
		).containsExactly(0, 7, 4, 3);
		assertThat(result.output().moves()).containsExactly(
			Direction.SOUTH, Direction.WEST, Direction.NORTH, Direction.NORTH, Direction.WEST,
			Direction.NORTH, Direction.NORTH, Direction.EAST, Direction.EAST, Direction.NORTH
		);
		assertThat(module.getState().get("buttonColors")).isEqualTo(Map.of(
			"north", "Green", "east", "Blue", "south", "Gray", "west", "Yellow"
		));
	}

	@Test
	void appliesTheFirstMatchingRotationRule() {
		assertThat(solve(bomb(), new BlindMazeInput(ButtonColor.RED, ButtonColor.RED, ButtonColor.BLUE, ButtonColor.YELLOW)).output().rotationRule()).isEqualTo(1);

		BombEntity batteries = bomb();
		batteries.setAaBatteryCount(5);
		assertThat(solve(batteries, baseInput()).output().rotationRule()).isEqualTo(2);

		BombEntity indicator = bomb();
		indicator.getIndicators().put("IND", false);
		assertThat(solve(indicator, baseInput()).output().rotationRule()).isEqualTo(3);

		assertThat(solve(bomb(), new BlindMazeInput(ButtonColor.RED, ButtonColor.GREEN, ButtonColor.BLUE, ButtonColor.GRAY)).output().rotationRule()).isEqualTo(4);

		BombEntity otherMaze = bomb();
		otherMaze.getModules().add(module(ModuleType.MAZES, false));
		assertThat(solve(otherMaze, baseInput()).output().rotationRule()).isEqualTo(5);

		BombEntity onePortType = new BombEntity();
		onePortType.setSerialNumber("ABC0");
		onePortType.replacePortPlates(List.of(Set.of(PortType.DVI)));
		assertThat(solve(onePortType, baseInput()).output().rotationRule()).isEqualTo(6);

		assertThat(solve(bomb(), baseInput()).output().rotationRule()).isEqualTo(7);
	}

	@Test
	void solvedModuleCountSelectsTheLiveMaze() {
		BombEntity bomb = bomb();
		ModuleEntity solved = module(ModuleType.BUTTON, true);
		bomb.getModules().add(solved);

		assertThat(solve(bomb, baseInput()).output().mazeNumber()).isEqualTo(1);
	}

	@Test
	void findsARouteThroughEveryDefaultMaze() {
		for (int mazeNumber = 0; mazeNumber < 10; mazeNumber++) {
			BlindMazeOutput output = solve(bomb(mazeNumber), baseInput()).output();
			assertThat(output.mazeNumber()).isEqualTo(mazeNumber);
			assertThat(output.moves()).isNotEmpty().endsWith(Direction.NORTH);
		}
	}

	private SolveSuccess<BlindMazeOutput> solve(BombEntity bomb, BlindMazeInput input) {
		ModuleEntity module = module(ModuleType.BLIND_MAZE, false);
		bomb.getModules().add(module);
		return solve(bomb, module, input);
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<BlindMazeOutput> solve(BombEntity bomb, ModuleEntity module, BlindMazeInput input) {
		return (SolveSuccess<BlindMazeOutput>) solver.solve(new RoundEntity(), bomb, module, input);
	}

	private static BlindMazeInput baseInput() {
		return new BlindMazeInput(ButtonColor.GREEN, ButtonColor.BLUE, ButtonColor.GRAY, ButtonColor.YELLOW);
	}

	private static BombEntity bomb() {
		return bomb(0);
	}

	private static BombEntity bomb(int lastDigit) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("ABC" + lastDigit);
		bomb.replacePortPlates(List.of(Set.of(PortType.DVI, PortType.PARALLEL)));
		return bomb;
	}

	private static ModuleEntity module(ModuleType type, boolean solved) {
		ModuleEntity module = new ModuleEntity();
		module.setType(type);
		module.setSolved(solved);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
