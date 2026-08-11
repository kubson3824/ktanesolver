package ktanesolver.module.modded.regular.quintuples;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.quintuples.QuintuplesInput.Cell;
import ktanesolver.module.modded.regular.quintuples.QuintuplesInput.Color;

class QuintuplesSolverTest {
	private final QuintuplesSolver solver = new QuintuplesSolver();

	@Test void appliesEverySlotRuleIncludingDisplayedZeroAsTen() {
		assertThat(QuintuplesSolver.transform(0, 10)).isEqualTo(17);
		assertThat(QuintuplesSolver.transform(1, 4)).isEqualTo(17);
		assertThat(QuintuplesSolver.transform(2, 4)).isEqualTo(8);
		assertThat(QuintuplesSolver.transform(3, 4)).isEqualTo(12);
		assertThat(QuintuplesSolver.transform(4, 9)).isEqualTo(4);
	}

	@Test void solvesSlotMajorGridAndStoresAllSouvenirFacts() {
		List<Cell> cells = new ArrayList<>();
		Color[] colors = Color.values();
		for (int index = 0; index < 25; index++) cells.add(new Cell(index % 10, colors[index % colors.length]));
		ModuleEntity module = new ModuleEntity();
		QuintuplesOutput output = ((SolveSuccess<QuintuplesOutput>) solver.solve(new RoundEntity(), new BombEntity(), module, new QuintuplesInput(cells))).output();
		assertThat(output.answer()).isEqualTo("72953");
		assertThat(module.getState().get("quintuplesNumbers")).isEqualTo(cells.stream().map(Cell::digit).toList());
		assertThat(module.getState().get("quintuplesColors")).isEqualTo(cells.stream().map(cell -> cell.color().name().toLowerCase()).toList());
		assertThat(module.getState().get("quintuplesColorCounts")).isEqualTo(java.util.Map.of("red", 5, "blue", 5, "orange", 5, "green", 5, "pink", 5));
	}

	@Test void validatesTheCompleteObservation() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new QuintuplesInput(List.of())))
			.isInstanceOf(SolveFailure.class);
		List<Cell> cells = new ArrayList<>();
		for (int index = 0; index < 25; index++) cells.add(new Cell(1, Color.GREEN));
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new QuintuplesInput(cells)))
			.isInstanceOf(SolveFailure.class);
	}
}
