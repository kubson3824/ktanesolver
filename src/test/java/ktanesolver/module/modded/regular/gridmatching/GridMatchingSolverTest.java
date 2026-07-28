package ktanesolver.module.modded.regular.gridmatching;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class GridMatchingSolverTest {
	private static final long[] BOARDS = {
		0x92B1F4E41L, 0xF047DF33AL, 0x79035474BL, 0xAF4315D30L,
		0x3FBC31DF8L, 0xA3212A56L, 0xC1A9A421BL, 0x35E71B3D7L,
		0x5FDB664B4L, 0x573F48D44L, 0x657725AAFL, 0xA4AFBE0ADL,
		0x1ACA28687L, 0x13E1AA4B5L, 0x854956717L, 0xE7B1B09AL
	};
	private final GridMatchingSolver solver = new GridMatchingSolver();

	@Test
	void solvesEveryGeneratedStateAndRejectsMalformedInput() {
		for (int board = 0; board < BOARDS.length; board++) {
			for (int targetRow = 0; targetRow < 3; targetRow++) {
				for (int targetColumn = 0; targetColumn < 3; targetColumn++) {
					int pattern = crop(BOARDS[board], targetRow, targetColumn);
					for (int rotation = 0; rotation < 4; rotation++) {
						for (int focusRow = 0; focusRow < 3; focusRow++) {
							for (int focusColumn = 0; focusColumn < 3; focusColumn++) {
								GridMatchingOutput output = solve(grid(pattern, focusRow, focusColumn), focusRow, focusColumn);
								assertThat(output.letter()).isEqualTo(String.valueOf((char)('A' + board)));
								assertThat(output.actions()).isEqualTo(
									actions(focusRow, focusColumn, targetRow, targetColumn, rotation)
								);
							}
						}
						pattern = rotateClockwise(pattern);
					}
				}
			}
		}

		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
			new GridMatchingInput(List.of(true), 0, 0))).isInstanceOf(SolveFailure.class);
	}

	private GridMatchingOutput solve(List<Boolean> grid, int row, int column) {
		return ((SolveSuccess<GridMatchingOutput>)solver.solve(
			new RoundEntity(), new BombEntity(), new ModuleEntity(), new GridMatchingInput(grid, row, column)
		)).output();
	}

	private static List<Boolean> grid(int pattern, int row, int column) {
		List<Boolean> grid = new ArrayList<>(Collections.nCopies(36, false));
		for (int y = 0; y < 4; y++) {
			for (int x = 0; x < 4; x++) {
				grid.set((row + y) * 6 + column + x, (pattern & (1 << (y * 4 + x))) != 0);
			}
		}
		return grid;
	}

	private static int crop(long board, int row, int column) {
		int result = 0;
		for (int y = 0; y < 4; y++) {
			for (int x = 0; x < 4; x++) {
				if ((board & (1L << ((row + y) * 6 + column + x))) != 0) result |= 1 << (y * 4 + x);
			}
		}
		return result;
	}

	private static int rotateClockwise(int pattern) {
		int result = 0;
		for (int y = 0; y < 4; y++) {
			for (int x = 0; x < 4; x++) {
				if ((pattern & (1 << (y * 4 + x))) != 0) result |= 1 << (x * 4 + 3 - y);
			}
		}
		return result;
	}

	private static List<String> actions(int row, int column, int targetRow, int targetColumn, int rotation) {
		List<String> actions = new ArrayList<>();
		for (int i = 0; i < Math.abs(targetRow - row); i++) actions.add(targetRow > row ? "down" : "up");
		for (int i = 0; i < Math.abs(targetColumn - column); i++) actions.add(targetColumn > column ? "right" : "left");
		int clockwise = (4 - rotation) % 4;
		if (clockwise == 3) actions.add("counter-clockwise");
		else for (int i = 0; i < clockwise; i++) actions.add("clockwise");
		return actions;
	}
}
