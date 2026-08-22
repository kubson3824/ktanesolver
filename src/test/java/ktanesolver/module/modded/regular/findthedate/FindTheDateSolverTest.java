package ktanesolver.module.modded.regular.findthedate;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class FindTheDateSolverTest {
	private final FindTheDateSolver solver = new FindTheDateSolver();
	@Test void usesTheModulesTablesAcrossThreeStagesAndRecordsSouvenirDates() {
		ModuleEntity module = new ModuleEntity(); module.setState(new HashMap<>()); module.setSolution(new HashMap<>());
		assertThat(solve(module, new FindTheDateInput(25, "December", 1862)).weekday()).isEqualTo("Thursday");
		assertThat(solve(module, new FindTheDateInput(27, "June", 2491)).stage()).isEqualTo(2);
		assertThat(solve(module, new FindTheDateInput(1, "January", 0)).stage()).isEqualTo(3);
		assertThat(module.getState()).containsKeys("findTheDateDates", "findTheDateNextStage");
	}
	@SuppressWarnings("unchecked") private FindTheDateOutput solve(ModuleEntity module, FindTheDateInput input) { return ((SolveSuccess<FindTheDateOutput>) solver.solve(new RoundEntity(), new BombEntity(), module, input)).output(); }
}
