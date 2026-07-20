package ktanesolver.module.modded.regular.xray;

import java.util.List;

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
	type = ModuleType.X_RAY,
	id = "x-ray",
	name = "X-Ray",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Identify three scanned symbols and press the number at the indicated table position.",
	tags = {"symbols", "scanning", "table", "Souvenir"}
)
public class XRaySolver extends AbstractModuleSolver<XRayInput, XRayOutput> {
	private static final List<String> COLUMNS = List.of(
		"a1", "a1 flipped", "b1", "b1 flipped", "c1", "c1 flipped",
		"d1", "d1 flipped", "e1", "e1 flipped", "h2 flipped", "h2"
	);
	private static final List<String> ROWS = List.of(
		"d7", "j1", "h6", "g1", "a6", "a2", "k2", "h1", "a7", "e2", "d6", "b3"
	);
	private static final List<String> MOVEMENTS = List.of(
		"a10", "b10", "c10", "d10", "e10", "f10", "i10", "h9", "i9"
	);
	private static final int[][] TABLE = {
		{2, 1, 5, 2, 5, 2, 5, 3, 5, 2, 5, 3},
		{4, 5, 4, 3, 4, 3, 4, 2, 1, 4, 3, 2},
		{2, 3, 1, 5, 2, 1, 5, 1, 3, 2, 1, 4},
		{4, 1, 4, 3, 4, 3, 2, 4, 2, 1, 3, 5},
		{3, 2, 5, 2, 1, 2, 5, 1, 5, 4, 5, 2},
		{4, 5, 1, 4, 3, 5, 3, 2, 3, 2, 3, 4},
		{2, 3, 2, 3, 5, 4, 2, 1, 4, 1, 4, 2},
		{4, 5, 1, 4, 2, 3, 5, 4, 3, 5, 2, 1},
		{5, 2, 3, 2, 3, 4, 1, 2, 1, 2, 4, 5},
		{2, 4, 1, 5, 1, 2, 5, 3, 4, 3, 5, 1},
		{5, 3, 5, 3, 2, 3, 1, 4, 2, 5, 2, 4},
		{2, 4, 1, 2, 1, 5, 4, 3, 5, 4, 3, 5}
	};

	@Override
	protected SolveResult<XRayOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, XRayInput input
	) {
		if (input == null || input.symbols() == null || input.symbols().size() != 3
			|| input.symbols().stream().distinct().count() != 3) {
			return failure("Select exactly three different scanned symbols");
		}
		int column = input.symbols().stream().mapToInt(COLUMNS::indexOf).filter(i -> i >= 0).findFirst().orElse(-1);
		int row = input.symbols().stream().mapToInt(ROWS::indexOf).filter(i -> i >= 0).findFirst().orElse(-1);
		int movement = input.symbols().stream().mapToInt(MOVEMENTS::indexOf).filter(i -> i >= 0).findFirst().orElse(-1);
		if (column < 0 || row < 0 || movement < 0) return failure("The symbols must include one from each manual table");

		int destinationRow = row + movement / 3 - 1;
		int destinationColumn = column + movement % 3 - 1;
		if (!inRange(destinationRow, 12) || !inRange(destinationColumn, 12)) {
			return failure("That movement leaves the number table; check the three symbols");
		}

		storeState(module, "scannedSymbols", List.of(
			COLUMNS.get(column), ROWS.get(row), MOVEMENTS.get(movement)
		));
		return success(new XRayOutput(TABLE[destinationRow][destinationColumn], destinationRow + 1, destinationColumn + 1));
	}

	private static boolean inRange(int value, int size) {
		return value >= 0 && value < size;
	}
}
