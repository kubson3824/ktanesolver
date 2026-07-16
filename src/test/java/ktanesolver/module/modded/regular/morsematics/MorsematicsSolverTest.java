package ktanesolver.module.modded.regular.morsematics;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

class MorsematicsSolverTest {

	@Test
	void countsEachMatchingIndicatorOnce() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("PA0QJ5");
		bomb.setDBatteryCount(2);
		bomb.setIndicators(new HashMap<>(Map.of("SND", true, "BOB", false, "SIG", false)));

		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());

		SolveResult<MorsematicsOutput> result = new MorsematicsSolver().solve(
			new RoundEntity(), bomb, module, new MorsematicsInput("OIS")
		);

		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(((SolveSuccess<MorsematicsOutput>)result).output().letter()).isEqualTo("S");
	}
}
