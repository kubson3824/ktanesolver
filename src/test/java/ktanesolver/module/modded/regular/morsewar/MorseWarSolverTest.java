package ktanesolver.module.modded.regular.morsewar;

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

class MorseWarSolverTest {
	private final MorseWarSolver solver = new MorseWarSolver();

	@Test
	void resolvesManualLookupAndOverwritesSuccessfulSouvenirFacts() {
		ModuleEntity module = module();
		SolveSuccess<MorseWarOutput> first = solve(module, new MorseWarInput("11OO", "1O1O", "1OO1", "ABR"));
		assertThat(first.output()).isEqualTo(new MorseWarOutput(6, List.of("U", "S", "U", "S")));

		module.setSolved(false);
		SolveSuccess<MorseWarOutput> retry = solve(module, new MorseWarInput("0011", "0101", "0110", "SUN"));
		assertThat(retry.output()).isEqualTo(new MorseWarOutput(1, List.of("U", "U", "U", "U")));
		assertThat(module.getState()).containsEntry("morseCode", "SUN")
			.containsEntry("bottomRow", "0110").containsEntry("middleRow", "0101").containsEntry("topRow", "0011");
	}

	@Test
	void rejectsUnknownCodesAndInvalidLedRows() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(),
			new MorseWarInput("1110", "1010", "1001", "ABR"))).isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(),
			new MorseWarInput("1100", "1010", "1001", "SOS"))).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<MorseWarOutput> solve(ModuleEntity module, MorseWarInput input) {
		return (SolveSuccess<MorseWarOutput>) solver.solve(new RoundEntity(), new BombEntity(), module, input);
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.MORSE_WAR);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
