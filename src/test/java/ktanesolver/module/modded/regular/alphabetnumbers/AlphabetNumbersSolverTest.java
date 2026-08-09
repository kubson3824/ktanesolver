package ktanesolver.module.modded.regular.alphabetnumbers;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class AlphabetNumbersSolverTest {
	private final AlphabetNumbersSolver solver = new AlphabetNumbersSolver();

	@Test
	void advancesAllFourStagesAndRecordsEverySouvenirSet() {
		ModuleEntity module = module();
		assertThat(solve(module, List.of(1, 2, 3, 4, 5, 6)).output().presses()).containsExactly(1, 2, 6, 5, 4, 3);
		assertThat(solve(module, List.of(1, 2, 3, 4, 5, 6)).output().stage()).isEqualTo(2);
		assertThat(solve(module, List.of(1, 2, 3, 4, 5, 6)).output().stage()).isEqualTo(3);
		assertThat(solve(module, List.of(30, 31, 32, 1, 2, 3)).output().presses()).containsExactly(6, 2, 1, 5, 3, 4);
		assertThat(module.getState()).containsKeys("stage1Numbers", "stage2Numbers", "stage3Numbers", "stage4Numbers");
	}

	@Test
	void usesTheManualsSpecialLargeNumberNamesAndValidatesLabels() {
		assertThat(AlphabetNumbersSolver.numberName(1_000)).isEqualTo("thousand");
		assertThat(AlphabetNumbersSolver.numberName(10_000)).isEqualTo("ten thousand");
		assertThat(AlphabetNumbersSolver.numberName(1_000_000_000_000L)).isEqualTo("trillion");
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(), new AlphabetNumbersInput(List.of(1, 1, 2, 3, 4, 5))))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<AlphabetNumbersOutput> solve(ModuleEntity module, List<Integer> labels) {
		return (SolveSuccess<AlphabetNumbersOutput>) solver.solve(new RoundEntity(), new BombEntity(), module, new AlphabetNumbersInput(labels));
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.ALPHABET_NUMBERS);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
