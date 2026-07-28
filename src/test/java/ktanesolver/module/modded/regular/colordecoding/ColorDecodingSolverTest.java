package ktanesolver.module.modded.regular.colordecoding;

import static ktanesolver.module.modded.regular.colordecoding.ColorDecodingInput.Color.*;
import static ktanesolver.module.modded.regular.colordecoding.ColorDecodingInput.Pattern.SOLID;
import static ktanesolver.module.modded.regular.colordecoding.ColorDecodingOutput.Selection.Type.ROW;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.colordecoding.ColorDecodingInput.Color;
import ktanesolver.module.modded.regular.colordecoding.ColorDecodingOutput.Selection;

class ColorDecodingSolverTest {
	private final ColorDecodingSolver solver = new ColorDecodingSolver();

	@Test
	void solvesAllStagesInManualOrderAndStoresEverySouvenirObservation() {
		ModuleEntity module = new ModuleEntity();

		assertThat(solve(module, 1, PURPLE,
			"RRRRRR", "PPGYRB", "GRBYPP", "YYYYYY", "YYYYYY", "YYYYYY").selections())
			.containsExactly(new Selection(ROW, 1), new Selection(ROW, 2), new Selection(ROW, 3));

		assertThat(solve(module, 2, YELLOW,
			"RRRRRR", "PPGYBR", "YYYRGR", "YYYYYY", "YYYYYY", "YYYYYY").selections())
			.containsExactly(new Selection(ROW, 1), new Selection(ROW, 2), new Selection(ROW, 3));

		assertThat(solve(module, 3, PURPLE,
			"PGBYYY", "RRRRRR", "YYBRGY", "YYYRGR", "YYYYYY", "YYYYYY").selections())
			.containsExactly(
				new Selection(ROW, 1), new Selection(ROW, 2),
				new Selection(ROW, 3), new Selection(ROW, 4)
			);

		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState()).containsKey("stages");
		assertThat((List<?>)module.getState().get("stages")).hasSize(3);
	}

	@SuppressWarnings("unchecked")
	private ColorDecodingOutput solve(ModuleEntity module, int stage, Color indicatorColor, String... rows) {
		List<Color> display = Arrays.stream(rows)
			.flatMapToInt(String::chars)
			.mapToObj(ColorDecodingSolverTest::color)
			.toList();
		SolveResult<ColorDecodingOutput> result = solver.solve(
			new RoundEntity(), new BombEntity(), module,
			new ColorDecodingInput(stage, SOLID, List.of(indicatorColor), display)
		);
		assertThat(result)
			.withFailMessage(() -> result instanceof SolveFailure<ColorDecodingOutput> failure ? failure.getReason() : "")
			.isInstanceOf(SolveSuccess.class);
		return ((SolveSuccess<ColorDecodingOutput>)result).output();
	}

	private static Color color(int code) {
		return switch (code) {
			case 'R' -> RED;
			case 'G' -> GREEN;
			case 'B' -> BLUE;
			case 'Y' -> YELLOW;
			case 'P' -> PURPLE;
			default -> throw new IllegalArgumentException();
		};
	}
}
