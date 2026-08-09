package ktanesolver.module.modded.regular.britishslang;

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

class BritishSlangSolverTest {
	private final BritishSlangSolver solver = new BritishSlangSolver();

	@Test
	void carriesTheDefinitionsAnswerIntoTheNextStage() {
		ModuleEntity module = module();
		assertThat(solve(module, new BritishSlangInput("Call dibs", List.of("Wally", "", "Mint", "Loo"), false)).output())
			.isEqualTo(new BritishSlangOutput(1, 2, "BLANK", 2));
		assertThat(solve(module, new BritishSlangInput("Silly person", List.of("Fag", "Bagsy", "Loo", "Ta"), false)).output())
			.isEqualTo(new BritishSlangOutput(2, 2, "Bagsy", 3));
		assertThat(module.getState()).containsEntry("previousAnswer", "Wally").containsEntry("nextStage", 3);
	}

	@Test
	void aNewAttemptOverwritesStaleProgressAndValidationRejectsMissingAnswer() {
		ModuleEntity module = module();
		solve(module, new BritishSlangInput("Call dibs", List.of("", "Wally", "Mint", "Loo"), false));
		solve(module, new BritishSlangInput("Silly person", List.of("Bagsy", "Fag", "Loo", "Ta"), false));
		assertThat(solve(module, new BritishSlangInput("Nervous", List.of("Ta", "Quid", "", "Fag"), true)).output().stage()).isEqualTo(1);
		assertThat(module.getState()).containsEntry("previousAnswer", "Collywobbles").containsEntry("nextStage", 2);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(),
			new BritishSlangInput("Goodbye", List.of("Ta", "Quid", "Fag", "Loo"), false))).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<BritishSlangOutput> solve(ModuleEntity module, BritishSlangInput input) {
		return (SolveSuccess<BritishSlangOutput>) solver.solve(new RoundEntity(), new BombEntity(), module, input);
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.BRITISH_SLANG);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
