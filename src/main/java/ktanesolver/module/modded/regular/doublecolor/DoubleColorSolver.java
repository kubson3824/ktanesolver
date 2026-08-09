package ktanesolver.module.modded.regular.doublecolor;

import java.util.List;
import java.util.Locale;

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
	type = ModuleType.DOUBLE_COLOR,
	id = "doubleColor",
	name = "Double Color",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Use battery count and the screen color to time two safe submissions.",
	tags = {"colors", "timer", "batteries", "multi-stage"}
)
public class DoubleColorSolver extends AbstractModuleSolver<DoubleColorInput, DoubleColorOutput> {
	private static final List<String> COLORS = List.of("GREEN", "BLUE", "RED", "PINK", "YELLOW");
	private static final int[][][] TABLES = {
		{{1,0,9,8,7},{2,7,6,5,6},{3,8,1,4,5},{4,9,2,3,4},{5,0,1,2,3},{6,7,8,9,0}},
		{{0,2,6,8,5},{4,9,9,0,2},{1,7,5,9,6},{4,2,0,8,3},{6,8,4,7,1},{1,3,7,3,5}}
	};

	@Override
	protected SolveResult<DoubleColorOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, DoubleColorInput input
	) {
		if (input == null || input.screenColor() == null) return failure("Enter the current screen color");
		String color = input.screenColor().trim().toUpperCase(Locale.ROOT);
		if (!COLORS.contains(color)) return failure("Screen color must be green, blue, red, pink, or yellow");
		int stage = input.newAttempt() ? 1
			: module.getState().get("nextStage") instanceof Number number ? number.intValue() : 1;
		if (stage < 1 || stage > 2) return failure("The stored Double Color stage is invalid");
		int digit = correctDigit(stage, bomb.getBatteryCount(), color);
		storeState(module, "stage" + stage + "Color", title(color));
		int nextStage = Math.min(2, stage + 1);
		storeState(module, "nextStage", nextStage);
		DoubleColorOutput output = new DoubleColorOutput(stage, digit, nextStage);
		return stage == 2 ? success(output) : success(output, false);
	}

	static int correctDigit(int stage, int batteries, String color) {
		return TABLES[stage - 1][Math.min(5, Math.max(0, batteries))][COLORS.indexOf(color.toUpperCase(Locale.ROOT))];
	}

	private static String title(String color) {
		return color.substring(0, 1) + color.substring(1).toLowerCase(Locale.ROOT);
	}
}
