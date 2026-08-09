package ktanesolver.module.modded.regular.simonsamples;

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

class SimonSamplesSolverTest {
	private final SimonSamplesSolver solver = new SimonSamplesSolver();

	@Test
	void appliesEveryStageRuleBranch() {
		assertThat(SimonSamplesSolver.apply(bomb("ABC123"), "KKSH", 0)).isEqualTo("KKSO");
		assertThat(SimonSamplesSolver.apply(bomb("ABC111"), "KSSH", 0)).isEqualTo("KOSH");
		assertThat(SimonSamplesSolver.apply(bomb("ABC123"), "KKSHKKSS", 1)).isEqualTo("SSKK");
		assertThat(SimonSamplesSolver.apply(bomb("ABC123"), "KHSOKOSH", 1)).isEqualTo("SHKO");
		assertThat(SimonSamplesSolver.apply(bomb("ABC123"), "KKSHKKSSSKSK", 2)).isEqualTo("KSKS");
		assertThat(SimonSamplesSolver.apply(bomb("ABC123"), "KHSHKHSSKKSS", 2)).isEqualTo("OKSS");
	}

	@Test
	void returnsCumulativeResponseAndPersistsAllObservedCallParts() {
		ModuleEntity module = module();
		SimonSamplesOutput output = solve(module, new SimonSamplesInput(3, "KKSH KKSS KKSS", List.of("K", "S", "H", "O"))).output();
		assertThat(output.response()).containsExactly("K", "K", "S", "O", "S", "S", "K", "K", "S", "S", "K", "K");
		assertThat(output.presses()).containsExactly(1, 1, 2, 4, 2, 2, 1, 1, 2, 2, 1, 1);
		assertThat(module.getState()).containsEntry("callStage1", "KKSH").containsEntry("callStage2", "KKSS").containsEntry("callStage3", "KKSS");
	}

	@Test
	void earlierStagesRemainUnsolvedAndInvalidCallsAreRejected() {
		assertThat(solve(module(), new SimonSamplesInput(1, "KKSH", List.of("K", "S", "H", "O"))).solved()).isFalse();
		assertThat(solver.solve(new RoundEntity(), bomb("ABC123"), module(),
			new SimonSamplesInput(2, "KKSH KKKK", List.of("K", "S", "H", "O")))).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<SimonSamplesOutput> solve(ModuleEntity module, SimonSamplesInput input) {
		return (SolveSuccess<SimonSamplesOutput>) solver.solve(new RoundEntity(), bomb("ABC123"), module, input);
	}

	private static BombEntity bomb(String serial) { BombEntity bomb = new BombEntity(); bomb.setSerialNumber(serial); return bomb; }
	private static ModuleEntity module() { ModuleEntity module = new ModuleEntity(); module.setType(ModuleType.SIMON_SAMPLES); module.setState(new HashMap<>()); module.setSolution(new HashMap<>()); return module; }
}
