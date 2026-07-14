package ktanesolver.module.modded.regular.booleanvenndiagram;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class BooleanVennDiagramSolverTest {
	private final BooleanVennDiagramSolver solver = new BooleanVennDiagramSolver();

	@Test
	void evaluatesEveryOperatorAndBothGroupings() {
		assertThat(truthTable("AND")).isEqualTo("0001");
		assertThat(truthTable("OR")).isEqualTo("0111");
		assertThat(truthTable("XOR")).isEqualTo("0110");
		assertThat(truthTable("IMPLIES")).isEqualTo("1101");
		assertThat(truthTable("NAND")).isEqualTo("1110");
		assertThat(truthTable("NOR")).isEqualTo("1000");
		assertThat(truthTable("XNOR")).isEqualTo("1001");
		assertThat(truthTable("IMPLIED_BY")).isEqualTo("1011");

		assertThat(solve("AND", "OR", "AB_FIRST"))
			.isEqualTo(new BooleanVennDiagramOutput("(A ∧ B) ∨ C", List.of("C", "BC", "AC", "AB", "ABC")));
		assertThat(solve("IMPLIED_BY", "NOR", "BC_FIRST").regions())
			.isEqualTo(List.of("C", "B", "BC", "A", "AC", "AB", "ABC"));
	}

	@Test
	void validatesAndPersistsCanonicalInput() {
		ModuleEntity module = module();
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module, new BooleanVennDiagramInput("wat", "OR", "AB_FIRST")))
			.isInstanceOf(SolveFailure.class);

		solver.solve(new RoundEntity(), new BombEntity(), module, new BooleanVennDiagramInput("implied by", "nor", "bc_first"));
		assertThat(module.getState()).containsEntry("input", new BooleanVennDiagramInput("IMPLIED_BY", "NOR", "BC_FIRST"));
	}

	private static String truthTable(String operator) {
		StringBuilder result = new StringBuilder();
		for (boolean left : List.of(false, true)) {
			for (boolean right : List.of(false, true)) result.append(BooleanVennDiagramSolver.apply(operator, left, right) ? '1' : '0');
		}
		return result.toString();
	}

	@SuppressWarnings("unchecked")
	private BooleanVennDiagramOutput solve(String first, String second, String grouping) {
		return ((SolveSuccess<BooleanVennDiagramOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), module(), new BooleanVennDiagramInput(first, second, grouping)
		)).output();
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.BOOLEAN_VENN_DIAGRAM);
		return module;
	}
}
