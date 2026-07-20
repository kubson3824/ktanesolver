package ktanesolver.module.modded.regular.nonogram;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class NonogramSolverTest {
	private final NonogramSolver solver = new NonogramSolver();

	@Test
	void decodesBothSerialParityTablesAndSolvesTheGrid() {
		List<String> expected = List.of(
			"B1", "A2", "B2", "C2", "D2", "E2", "A3", "B3", "C3", "D3", "E3",
			"A4", "C4", "D4", "E4", "A5", "B5");

		assertThat(solve("ABC123", List.of(
			pair("blue", "yellow"), pair("red", "blue"), pair("blue", "orange"), pair("orange", "blue"), pair("blue", "orange"),
			pair("yellow", "orange"), pair("red", "green"), pair("green", "red"), pair("blue", "purple"), pair("green", "purple")
		)).filledCells()).containsExactlyElementsOf(expected);

		assertThat(solve("ABC124", List.of(
			pair("red", "green"), pair("red", "orange"), pair("yellow", "orange"), pair("orange", "yellow"), pair("yellow", "orange"),
			pair("blue", "orange"), pair("green", "yellow"), pair("yellow", "green"), pair("green", "purple"), pair("red", "blue")
		)).filledCells()).containsExactlyElementsOf(expected);

		NonogramOutput emptyLines = solve("ABC123", List.of(
			pair("red", "purple"), pair("red", "purple"), pair("yellow", "orange"), pair("red", "purple"), pair("red", "purple"),
			pair("red", "purple"), pair("red", "purple"), pair("yellow", "orange"), pair("red", "purple"), pair("red", "purple")
		));
		assertThat(emptyLines.filledCells()).containsExactly("C3");
		assertThat(emptyLines.columnClues().get(0)).isEmpty();
	}

	private NonogramOutput solve(String serial, List<List<String>> pairs) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setIndicators(new HashMap<>());
		return ((SolveSuccess<NonogramOutput>) solver.solve(
			new RoundEntity(), bomb, new ModuleEntity(), new NonogramInput(pairs))).output();
	}

	private static List<String> pair(String first, String second) {
		return List.of(first, second);
	}
}
