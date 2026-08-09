package ktanesolver.module.modded.regular.charactershift;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class CharacterShiftSolverTest {
	private final CharacterShiftSolver solver = new CharacterShiftSolver();

	@Test
	void implementsAllTenManualOperations() {
		BombEntity bomb = bomb();
		assertThat(List.of(0, 1, 2, 3, 4, 5, 6, 7, 8, 9).stream()
			.map(digit -> CharacterShiftSolver.shift(bomb, digit, 'A')).toList())
			.containsExactly('D', 'F', 'V', 'E', 'D', 'H', 'F', 'F', 'J', 'A');
	}

	@Test
	void returnsEveryValidPairAndRecordsOnlyUnsubmittedCharacters() {
		ModuleEntity module = module();
		CharacterShiftOutput output = solve(bomb(), module,
			new CharacterShiftInput(List.of("X", "Y", "Z", "Q"), List.of(0, 1, 2, 3))).output();
		assertThat(output.solutions()).contains(new CharacterShiftSolution("X", 0, "A"));
		assertThat(output.x()).isEqualTo(5);
		assertThat(output.y()).isEqualTo(5);
		assertThat(module.getState()).containsEntry("unsubmittedLetters", List.of("Y", "Z", "Q"))
			.containsEntry("unsubmittedDigits", List.of("1", "2", "3"));
	}

	@Test
	void rejectsDuplicateOrMalformedSliderValues() {
		assertThat(solver.solve(new RoundEntity(), bomb(), module(),
			new CharacterShiftInput(List.of("A", "A", "B", "C"), List.of(0, 1, 2, 3))))
			.isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), bomb(), module(),
			new CharacterShiftInput(List.of("A", "B", "C", "D"), List.of(0, 1, 2, 10))))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<CharacterShiftOutput> solve(BombEntity bomb, ModuleEntity module, CharacterShiftInput input) {
		return (SolveSuccess<CharacterShiftOutput>) solver.solve(new RoundEntity(), bomb, module, input);
	}

	private static BombEntity bomb() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("ABC123");
		bomb.setAaBatteryCount(4); bomb.setDBatteryCount(1);
		bomb.setIndicators(new HashMap<>(Map.of("SIG", true, "CAR", false)));
		bomb.replacePortPlates(List.of(Set.of(PortType.DVI, PortType.PARALLEL)));
		return bomb;
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity(); module.setType(ModuleType.CHARACTER_SHIFT);
		module.setState(new HashMap<>()); module.setSolution(new HashMap<>()); return module;
	}
}
