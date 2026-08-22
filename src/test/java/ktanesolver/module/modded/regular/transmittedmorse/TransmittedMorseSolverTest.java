package ktanesolver.module.modded.regular.transmittedmorse;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class TransmittedMorseSolverTest {
	private final TransmittedMorseSolver solver = new TransmittedMorseSolver();

	@Test
	void transformsUnknownMessagesReversesAndRecordsBothSouvenirStages() {
		ModuleEntity module = new ModuleEntity(); module.setState(new HashMap<>()); module.setSolution(new HashMap<>());
		TransmittedMorseOutput first = solve(module, new TransmittedMorseInput("ENERGY", "red", "yellow"));
		assertThat(first.effectiveMessage()).isEqualTo("DEREDOC");
		assertThat(first.entries().get(0)).isEqualTo(new TransmittedMorseOutput.Entry(1, 4));
		TransmittedMorseOutput second = solve(module, new TransmittedMorseInput("LONG", "green", "blue"));
		assertThat(second.effectiveMessage()).isEqualTo("UNLUCKY");
		assertThat(module.getState().get("transmittedMorseMessages")).isEqualTo(java.util.List.of("ENERGY", "LONG"));
	}

	@SuppressWarnings("unchecked") private TransmittedMorseOutput solve(ModuleEntity module, TransmittedMorseInput input) { return ((SolveSuccess<TransmittedMorseOutput>) solver.solve(new RoundEntity(), new BombEntity(), module, input)).output(); }
}
