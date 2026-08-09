package ktanesolver.module.modded.regular.binarytree;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

class BinaryTreeSolverTest {
	private final BinaryTreeSolver solver = new BinaryTreeSolver();

	@Test
	void appliesEveryColorTableAndTextDirection() {
		String[] colors = {"RED", "GREEN", "BLUE", "ORANGE", "CYAN", "MAGENTA", "YELLOW", "GRAY"};
		List<List<Integer>> expected = List.of(
			List.of(4, 6, 2), List.of(5, 3, 5), List.of(2, 7, 6), List.of(3, 3, 4),
			List.of(7, 4, 3), List.of(6, 5, 3), List.of(3, 2, 2), List.of(2, 2, 7)
		);
		for (int index = 0; index < colors.length; index++) {
			assertThat(solve(repeated(colors[index], "A", false)).presses()).isEqualTo(expected.get(index));
		}
		assertThat(solve(repeated("RED", "1", true)).presses()).containsExactly(7, 4, 4);
	}

	@Test
	void rejectsInvalidNodeData() {
		ModuleEntity module = module();
		SolveResult<BinaryTreeOutput> result = solver.solve(
			new RoundEntity(), new BombEntity(), module,
			new BinaryTreeInput(repeated("RED", "O", false))
		);
		assertThat(result).isInstanceOf(SolveFailure.class);
		assertThat(module.isSolved()).isFalse();
	}

	private BinaryTreeOutput solve(List<BinaryTreeNodeInput> nodes) {
		ModuleEntity module = module();
		SolveResult<BinaryTreeOutput> result = solver.solve(
			new RoundEntity(), new BombEntity(), module, new BinaryTreeInput(nodes)
		);
		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState()).containsKey("input");
		return ((SolveSuccess<BinaryTreeOutput>) result).output();
	}

	private static List<BinaryTreeNodeInput> repeated(String color, String character, boolean silver) {
		return java.util.stream.IntStream.range(0, 7)
			.mapToObj(ignored -> new BinaryTreeNodeInput(color, character, silver))
			.toList();
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.BINARY_TREE);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
