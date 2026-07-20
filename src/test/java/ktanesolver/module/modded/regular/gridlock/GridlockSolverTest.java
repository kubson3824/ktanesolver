package ktanesolver.module.modded.regular.gridlock;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class GridlockSolverTest {
	private final GridlockSolver solver = new GridlockSolver();

	@Test
	void followsColoredArrowAndBlankMovesWithWrappingAndVisitedCellSkipping() {
		List<List<String>> pages = pages(5);
		pages.get(0).set(0, "STAR_BLUE");
		pages.get(1).set(13, "ARROW_N");
		pages.get(1).set(10, "ARROW_E");
		pages.get(1).set(11, "ARROW_E");
		pages.get(1).set(8, "ARROW_E");
		ModuleEntity module = module();

		assertThat(solve(module, pages)).isEqualTo(new GridlockOutput(
			"A3", List.of("A1", "B4", "B3", "C3", "D3", "A3")
		));
		assertThat(module.getState()).containsEntry("startingColor", "Blue").containsEntry("startingLocation", "A1");
	}

	@Test
	void rejectsMissingPagesAndInvalidFirstPageStars() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(), new GridlockInput(pages(4))))
			.isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(), new GridlockInput(pages(5))))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private GridlockOutput solve(ModuleEntity module, List<List<String>> pages) {
		return ((SolveSuccess<GridlockOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), module, new GridlockInput(pages)
		)).output();
	}

	private static List<List<String>> pages(int count) {
		List<List<String>> pages = new ArrayList<>();
		for (int i = 0; i < count; i++) pages.add(new ArrayList<>(java.util.Collections.nCopies(16, "BLANK")));
		return pages;
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.GRIDLOCK);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
