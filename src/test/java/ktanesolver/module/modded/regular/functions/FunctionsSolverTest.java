package ktanesolver.module.modded.regular.functions;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.*;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.*;
import ktanesolver.enums.PortType;
import ktanesolver.logic.*;
import ktanesolver.module.modded.regular.functions.FunctionsInput.Observation;

class FunctionsSolverTest {
	private final FunctionsSolver solver = new FunctionsSolver();

	@Test
	void evaluatesTheNontrivialRuleSeedOneFunctions() {
		BombEntity bomb = bomb();
		assertThat(FunctionsSolver.evaluate(1, 12, 34, bomb)).isEqualTo(48);
		assertThat(FunctionsSolver.evaluate(20, 12, 34, bomb)).isZero();
		assertThat(FunctionsSolver.evaluate(21, 12, 34, bomb)).isEqualTo(567890);
		assertThat(FunctionsSolver.evaluate(24, 12, 34, bomb)).isEqualTo(11223142);
		assertThat(FunctionsSolver.evaluate(38, 12, 34, bomb)).isEqualTo(11213141);
		assertThat(FunctionsSolver.evaluate(13, 1, 1234, bomb)).isEqualTo(234);
		assertThat(FunctionsSolver.evaluate(40, 1, 1234, bomb)).isEqualTo(1234);
		assertThat(FunctionsSolver.evaluate(41, 1, 1234, bomb)).isEqualTo(1_523_990);
	}

	@Test
	void appliesLetterConditionsAndOffsets() {
		BombEntity bomb = bomb();
		assertThat(FunctionsSolver.offset('A', bomb)).isEqualTo(6);
		assertThat(FunctionsSolver.offset('D', bomb)).isEqualTo(-8);
		bomb.setIndicators(Map.of("BOB", true));
		assertThat(FunctionsSolver.offset('D', bomb)).isEqualTo(8);
		bomb.replacePortPlates(List.of(Set.of()));
		assertThat(FunctionsSolver.offset('H', bomb)).isEqualTo(1);
	}

	@Test
	void narrowsQueriesCalculatesTheFinalFunctionAndStoresSouvenirFacts() {
		BombEntity bomb = bomb();
		ModuleEntity module = new ModuleEntity();
		List<Observation> observations = new ArrayList<>();
		FunctionsOutput output = solve(bomb, module, observations);
		Long firstResult = null;
		for (int attempt = 0; output.answer() == null && attempt < 8; attempt++) {
			assertThat(output.suggestedQuery()).hasSize(2);
			int a = output.suggestedQuery().get(0), b = output.suggestedQuery().get(1);
			long result = FunctionsSolver.evaluate(39, a, b, bomb);
			if (firstResult == null) firstResult = result;
			observations.add(new Observation(a, b, result));
			output = solve(bomb, module, observations);
		}
		assertThat(output.queryFunctionNumber()).isEqualTo(39);
		assertThat(output.finalFunctionNumber()).isEqualTo(3);
		assertThat(output.answer()).isEqualTo(1);
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState()).containsEntry("functionsLeftNumber", 12).containsEntry("functionsLetter", "A").containsEntry("functionsRightNumber", 34);
		assertThat(module.getState().get("functionsFirstQueryLastDigit")).isEqualTo(firstResult % 10);
	}

	@Test
	void rejectsUnsafeQueriesAndContradictoryResults() {
		BombEntity bomb = bomb();
		assertThat(solver.solve(new RoundEntity(), bomb, new ModuleEntity(), new FunctionsInput(12, "A", 34, List.of(new Observation(0, 2, 3L))))).isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), bomb, new ModuleEntity(), new FunctionsInput(12, "A", 34, List.of(new Observation(1, 2, 999_999L))))).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private FunctionsOutput solve(BombEntity bomb, ModuleEntity module, List<Observation> observations) {
		return ((SolveSuccess<FunctionsOutput>) solver.solve(new RoundEntity(), bomb, module, new FunctionsInput(12, "A", 34, List.copyOf(observations)))).output();
	}

	private static BombEntity bomb() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("ABC123");
		bomb.setAaBatteryCount(2);
		bomb.setIndicators(new HashMap<>());
		bomb.replacePortPlates(List.of(Set.of(PortType.SERIAL)));
		return bomb;
	}
}
