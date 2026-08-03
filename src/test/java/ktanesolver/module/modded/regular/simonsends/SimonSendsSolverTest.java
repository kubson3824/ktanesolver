package ktanesolver.module.modded.regular.simonsends;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveSuccess;

class SimonSendsSolverTest {
	@Test
	void derivesTheManualLettersTransmissionAndSouvenirFacts() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.SIMON_SENDS);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());

		SolveSuccess<SimonSendsOutput> result = (SolveSuccess<SimonSendsOutput>) new SimonSendsSolver().solve(
			new RoundEntity(), new BombEntity(), module, new SimonSendsInput("A", "B", "C"));

		assertThat(result.output()).isEqualTo(new SimonSendsOutput("SHP", "WKWBWKCBBKB"));
		assertThat(module.getState()).containsEntry("receivedLetters", Map.of("red", "A", "green", "B", "blue", "C"));
	}
}
