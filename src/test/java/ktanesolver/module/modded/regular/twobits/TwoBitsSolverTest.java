package ktanesolver.module.modded.regular.twobits;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveSuccess;

class TwoBitsSolverTest {
	@Test
	void acceptsTheThirdResponseAndStoresItBeforeSolving() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.TWO_BITS);
		module.setState(new TwoBitsState(new ArrayList<>(List.of(
			new TwoBitsStage(5, "kp"),
			new TwoBitsStage(7, "vt"),
			new TwoBitsStage(3, "tk")))));
		module.setSolution(new HashMap<>());

		var result = new TwoBitsSolver().solve(
			new RoundEntity(), new BombEntity(), module, new TwoBitsInput(4, 9));

		assertThat(result).isInstanceOfSatisfying(SolveSuccess.class, success -> {
			assertThat(success.solved()).isTrue();
			assertThat(((TwoBitsOutput) success.output()).letters()).isEqualTo("dt");
		});
		assertThat(module.getStateAs(TwoBitsState.class, () -> null).stages())
			.extracting(TwoBitsStage::number).containsExactly(5, 7, 3, 9);
	}
}
