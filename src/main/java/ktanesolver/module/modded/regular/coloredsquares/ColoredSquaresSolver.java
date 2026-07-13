package ktanesolver.module.modded.regular.coloredsquares;

import java.util.Map;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.coloredsquares.ColoredSquaresOutput.Group;

@Service
@ModuleInfo(
	type = ModuleType.COLORED_SQUARES,
	id = "colored-squares",
	name = "Colored Squares",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Find the next color, row, or column group from the white-square count",
	tags = {"colors", "stages", "modded"}
)
public class ColoredSquaresSolver extends AbstractModuleSolver<ColoredSquaresInput, ColoredSquaresOutput> {
	private static final Group[][] TABLE = {
		{Group.BLUE, Group.COLUMN, Group.RED, Group.YELLOW, Group.ROW, Group.GREEN, Group.MAGENTA},
		{Group.ROW, Group.GREEN, Group.BLUE, Group.MAGENTA, Group.RED, Group.COLUMN, Group.YELLOW},
		{Group.YELLOW, Group.MAGENTA, Group.GREEN, Group.ROW, Group.BLUE, Group.RED, Group.COLUMN},
		{Group.BLUE, Group.GREEN, Group.YELLOW, Group.COLUMN, Group.RED, Group.ROW, Group.MAGENTA},
		{Group.YELLOW, Group.ROW, Group.BLUE, Group.MAGENTA, Group.COLUMN, Group.RED, Group.GREEN},
		{Group.MAGENTA, Group.RED, Group.YELLOW, Group.GREEN, Group.COLUMN, Group.BLUE, Group.ROW},
		{Group.GREEN, Group.ROW, Group.COLUMN, Group.BLUE, Group.MAGENTA, Group.YELLOW, Group.RED},
		{Group.MAGENTA, Group.RED, Group.GREEN, Group.BLUE, Group.YELLOW, Group.COLUMN, Group.ROW},
		{Group.COLUMN, Group.YELLOW, Group.RED, Group.GREEN, Group.ROW, Group.MAGENTA, Group.BLUE},
		{Group.GREEN, Group.COLUMN, Group.ROW, Group.RED, Group.MAGENTA, Group.BLUE, Group.YELLOW},
		{Group.RED, Group.YELLOW, Group.ROW, Group.COLUMN, Group.GREEN, Group.MAGENTA, Group.BLUE},
		{Group.COLUMN, Group.BLUE, Group.MAGENTA, Group.RED, Group.YELLOW, Group.ROW, Group.GREEN},
		{Group.ROW, Group.MAGENTA, Group.COLUMN, Group.YELLOW, Group.BLUE, Group.GREEN, Group.RED},
		{Group.RED, Group.BLUE, Group.MAGENTA, Group.ROW, Group.GREEN, Group.YELLOW, Group.COLUMN},
		{Group.COLUMN, Group.ROW, Group.COLUMN, Group.ROW, Group.COLUMN, Group.ROW, Group.COLUMN}
	};

	@Override
	protected SolveResult<ColoredSquaresOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, ColoredSquaresInput input
	) {
		if (input == null || input.previousGroup() == null) return failure("Select the group that was pressed");
		if (input.whiteCount() < 1 || input.whiteCount() > 16) return failure("White-square count must be between 1 and 16");
		if (!module.getState().containsKey("firstGroup")) storeState(module, "firstGroup", input.previousGroup());

		storeState(module, Map.of(
			"whiteCount", input.whiteCount(),
			"previousGroup", input.previousGroup()
		));
		if (input.whiteCount() == 16) return success(new ColoredSquaresOutput(null));
		return success(new ColoredSquaresOutput(TABLE[input.whiteCount() - 1][input.previousGroup().ordinal()]), false);
	}
}
