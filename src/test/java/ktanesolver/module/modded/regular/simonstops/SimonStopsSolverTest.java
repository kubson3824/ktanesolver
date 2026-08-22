package ktanesolver.module.modded.regular.simonstops;

import static ktanesolver.module.modded.regular.simonstops.SimonStopsInput.Color.*;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class SimonStopsSolverTest {
	private final SimonStopsSolver solver = new SimonStopsSolver();

	@Test void translatesNormalInputThenAddsTheControlInputAndRemainder() {
		BombEntity bomb = new BombEntity(); bomb.setSerialNumber("BC1DF2"); bomb.setAaBatteryCount(2);
		ModuleEntity module = new ModuleEntity(); module.setState(new HashMap<>()); module.setSolution(new HashMap<>());
		List<SimonStopsInput.Color> flashes = List.of(RED, ORANGE, YELLOW);
		assertThat(solve(bomb, module, new SimonStopsInput(flashes, null)).pressColors()).containsExactly(BLUE, GREEN, YELLOW);
		// Last digit 2 + four serial consonants * two batteries = 10: stage-one rule 0 is same color.
		assertThat(solve(bomb, module, new SimonStopsInput(flashes, 2)).pressColors()).containsExactly(GREEN, YELLOW);
		assertThat(module.getState()).containsEntry("simonStopsStage", 2).containsEntry("simonStopsFlashedColors", List.of("Red", "Orange", "Yellow"));
	}

	@SuppressWarnings("unchecked") private SimonStopsOutput solve(BombEntity bomb, ModuleEntity module, SimonStopsInput input) { return ((SolveSuccess<SimonStopsOutput>) solver.solve(new RoundEntity(), bomb, module, input)).output(); }
}
