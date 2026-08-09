package ktanesolver.module.modded.regular.numbercipher;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class NumberCipherSolverTest {
	private final NumberCipherSolver solver = new NumberCipherSolver();

	@ParameterizedTest
	@CsvSource({
		"OFF,OFF,OFF,H,1", "RED,OFF,OFF,A,2", "BLUE,OFF,OFF,B,7", "GREEN,OFF,OFF,G,8",
		"BLUE,RED,OFF,C,0", "RED,GREEN,OFF,E,8", "BLUE,GREEN,OFF,F,5", "RED,GREEN,BLUE,D,3"
	})
	void coversEveryVennRegion(String first, String second, String third, String rule, int answer) {
		SolveSuccess<NumberCipherOutput> result = solve(new NumberCipherInput(List.of(2, 3, 5), List.of(first, second, third)));
		assertThat(result.output()).isEqualTo(new NumberCipherOutput(answer, rule));
	}

	@Test
	void treatsRepeatedColorsAsOneActiveVennSetAndValidatesTheDisplay() {
		assertThat(solve(new NumberCipherInput(List.of(9, 9, 9), List.of("red", "RED", "OFF"))).output())
			.isEqualTo(new NumberCipherOutput(9, "A"));
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(),
			new NumberCipherInput(List.of(0, 2, 3), List.of("OFF", "OFF", "OFF"))))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<NumberCipherOutput> solve(NumberCipherInput input) {
		return (SolveSuccess<NumberCipherOutput>) solver.solve(new RoundEntity(), new BombEntity(), module(), input);
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.THE_NUMBER_CIPHER);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
