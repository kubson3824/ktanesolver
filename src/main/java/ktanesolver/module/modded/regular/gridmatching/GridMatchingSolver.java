package ktanesolver.module.modded.regular.gridmatching;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
	type = ModuleType.GRID_MATCHING,
	id = "GridMatching",
	name = "Grid Matching",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Match a moved and rotated 4×4 light pattern to one of sixteen grids",
	tags = {"grid", "pattern", "rotation", "movement", "modded"}
)
public class GridMatchingSolver extends AbstractModuleSolver<GridMatchingInput, GridMatchingOutput> {
	private static final long[] BOARDS = {
		0x92B1F4E41L, 0xF047DF33AL, 0x79035474BL, 0xAF4315D30L,
		0x3FBC31DF8L, 0xA3212A56L, 0xC1A9A421BL, 0x35E71B3D7L,
		0x5FDB664B4L, 0x573F48D44L, 0x657725AAFL, 0xA4AFBE0ADL,
		0x1ACA28687L, 0x13E1AA4B5L, 0x854956717L, 0xE7B1B09AL
	};

	@Override
	protected SolveResult<GridMatchingOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, GridMatchingInput input
	) {
		if (input.grid() == null || input.grid().size() != 36 || input.grid().stream().anyMatch(Objects::isNull)) {
			return failure("Enter all 36 grid cells");
		}
		if (input.focusRow() < 0 || input.focusRow() > 2 || input.focusColumn() < 0 || input.focusColumn() > 2) {
			return failure("Focus box row and column must be between 1 and 3");
		}

		int visible = 0;
		for (int row = 0; row < 6; row++) {
			for (int column = 0; column < 6; column++) {
				if (!input.grid().get(row * 6 + column)) continue;
				if (row < input.focusRow() || row >= input.focusRow() + 4
					|| column < input.focusColumn() || column >= input.focusColumn() + 4) {
					return failure("Lit cells must be inside the focus box");
				}
				visible |= 1 << ((row - input.focusRow()) * 4 + column - input.focusColumn());
			}
		}

		for (int board = 0; board < BOARDS.length; board++) {
			for (int targetRow = 0; targetRow < 3; targetRow++) {
				for (int targetColumn = 0; targetColumn < 3; targetColumn++) {
					int candidate = crop(BOARDS[board], targetRow, targetColumn);
					for (int rotation = 0; rotation < 4; rotation++) {
						if (candidate == visible) {
							return success(new GridMatchingOutput(
								String.valueOf((char)('A' + board)),
								actions(input.focusRow(), input.focusColumn(), targetRow, targetColumn, rotation)
							));
						}
						candidate = rotateClockwise(candidate);
					}
				}
			}
		}
		return failure("The focused pattern does not match any Grid Matching board");
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
