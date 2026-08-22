package ktanesolver.module.modded.regular.insanetalk;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class InsaneTalkSolverTest {
	private final InsaneTalkSolver solver = new InsaneTalkSolver();
	@Test void followsDistinctCodeDigitsThenUnusedLabels() { assertThat(solve("Error 200: Exception error 200", List.of(7, 5, 3, 1)).pressLabels()).containsExactly(5, 3, 7, 1); }
	@Test void reversesTheCodeWhenTheDisplayIsQuoted() { InsaneTalkOutput output = solve("\"Exactly what it says.\"", List.of(4, 5, 6, 7)); assertThat(output.phraseCode()).isEqualTo("456789132"); assertThat(output.pressLabels()).containsExactly(4, 5, 6, 7); }
	@SuppressWarnings("unchecked") private InsaneTalkOutput solve(String phrase, List<Integer> labels) { ModuleEntity module = new ModuleEntity(); module.setState(new HashMap<>()); module.setSolution(new HashMap<>()); return ((SolveSuccess<InsaneTalkOutput>) solver.solve(new RoundEntity(), new BombEntity(), module, new InsaneTalkInput(phrase, labels))).output(); }
}
