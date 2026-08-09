package ktanesolver.module.modded.regular.guitarchords;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class GuitarChordsSolverTest {
	private final GuitarChordsSolver solver = new GuitarChordsSolver();

	@Test
	void solvesThreeStagesInBottomToTopOrderUsingFirstMatchingCapoRules() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("BCDF18");
		bomb.setAaBatteryCount(2);
		bomb.setIndicators(new HashMap<>(Map.of("SIG", false)));
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());

		assertThat(solve(bomb, module, "Ab"))
			.isEqualTo(new GuitarChordsOutput(1, "Ab", 5, List.of("5", "5", "6", "7", "7", "5")));
		assertThat(module.isSolved()).isFalse();
		assertThat(solve(bomb, module, "C"))
			.isEqualTo(new GuitarChordsOutput(2, "C", 7, List.of("-", "7", "-", "8", "9", "9")));
		assertThat(solve(bomb, module, "Em"))
			.isEqualTo(new GuitarChordsOutput(3, "Em", 5, List.of("-", "-", "-", "6", "6", "-")));
		assertThat(module.isSolved()).isTrue();
	}

	@SuppressWarnings("unchecked")
	private GuitarChordsOutput solve(BombEntity bomb, ModuleEntity module, String chord) {
		return ((SolveSuccess<GuitarChordsOutput>) solver.solve(
			new RoundEntity(), bomb, module, new GuitarChordsInput(chord)
		)).output();
	}
}
