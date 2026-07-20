package ktanesolver.module.modded.regular.morseamaze;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.shared.grid.Cell;
import ktanesolver.module.vanilla.regular.maze.Move;

class MorseAMazeSolverTest {
	private final MorseAMazeSolver solver = new MorseAMazeSolver();

	@Test
	void solvesDirectAndEdgeworkMazesWithManualOverride() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("AB1CD2");
		bomb.setAaBatteryCount(2);
		bomb.setDBatteryCount(2);
		bomb.getModules().add(solvedModule(ModuleType.BUTTON));
		bomb.getModules().add(solvedModule(ModuleType.VENTING_GAS));

		MorseAMazeOutput direct = output(bomb, new MorseAMazeInput("pulses", new Cell(1, 1), new Cell(6, 6), null));
		assertThat(direct.mazeIndex()).isZero();
		assertThat(direct.moves()).isEqualTo(List.of(
			Move.RIGHT, Move.RIGHT, Move.DOWN, Move.LEFT, Move.DOWN, Move.RIGHT, Move.DOWN,
			Move.RIGHT, Move.UP, Move.RIGHT, Move.RIGHT, Move.DOWN, Move.DOWN, Move.DOWN
		));

		assertThat(output(bomb, new MorseAMazeInput("mosaic", new Cell(1, 1), new Cell(6, 6), null)))
			.extracting(MorseAMazeOutput::mazeIndex, MorseAMazeOutput::mazeWord)
			.containsExactly(4, "spurs");
		assertThat(output(bomb, new MorseAMazeInput("count", new Cell(1, 1), new Cell(6, 6), 9)))
			.extracting(MorseAMazeOutput::mazeIndex, MorseAMazeOutput::mazeWord)
			.containsExactly(9, "stroke");
		assertThat(output(bomb, new MorseAMazeInput("assay", new Cell(1, 1), new Cell(6, 6), null)).mazeIndex())
			.isOne();
	}

	private ModuleEntity solvedModule(ModuleType type) {
		ModuleEntity module = new ModuleEntity();
		module.setType(type);
		module.setSolved(true);
		return module;
	}

	@SuppressWarnings("unchecked")
	private MorseAMazeOutput output(BombEntity bomb, MorseAMazeInput input) {
		return ((SolveSuccess<MorseAMazeOutput>) solver.solve(new RoundEntity(), bomb, new ModuleEntity(), input)).output();
	}
}
