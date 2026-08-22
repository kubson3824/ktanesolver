package ktanesolver.module.modded.regular.theblock;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.shared.edgework.BombEdgeworkUtils;

@Service
@ModuleInfo(
	type = ModuleType.THE_BLOCK,
	id = "theBlock",
	name = "The Block",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Apply the first matching edgework rule to the six colored Block faces.",
	tags = {"cube", "colors", "edgework"}
)
public class TheBlockSolver extends AbstractModuleSolver<TheBlockInput, TheBlockOutput> {
	private static final List<String> COLORS = List.of("RED", "BLUE", "GREEN", "YELLOW");

	@Override
	protected SolveResult<TheBlockOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, TheBlockInput input) {
		if (input == null || input.sideColors() == null || input.sideColors().size() != 6) return failure("Enter all six side colors in net order");
		List<String> colors = input.sideColors().stream().map(value -> value == null ? "" : value.trim().toUpperCase(Locale.ROOT)).toList();
		if (colors.stream().anyMatch(color -> !COLORS.contains(color))) return failure("Side colors must be red, blue, green, or yellow");
		long red = count(colors, "RED"), blue = count(colors, "BLUE"), green = count(colors, "GREEN"), yellow = count(colors, "YELLOW");
		if (bomb.isIndicatorLit("BOB") && bomb.getBatteryCount() == 3 && bomb.getBatteryHolders() == 2 && BombEdgeworkUtils.hasEmptyPortPlate(bomb)) return answer(1, "BLOCK", "BLOCK", "BLOCK", "BLOCK", "BLOCK");
		if (bomb.hasPort(PortType.PARALLEL) && bomb.hasPort(PortType.SERIAL) && colors.get(3).equals("GREEN")) return answer(2, String.valueOf(first(colors, "GREEN")));
		if (bomb.serialHasVowel() && bomb.isIndicatorUnlit("SIG")) return answer(3, "6", "5", "4", "3", "2", "1");
		if (bomb.getBatteryCount() > 2 && colors.get(0).equals("RED")) return answer(4, "5");
		if (blue > red && yellow > green) return answer(5, "2", "4");
		if (yellow == 0) return answer(6, "1", "2", "3", "4", "5", "6");
		if (colors.get(1).equals("YELLOW") && colors.get(2).equals("BLUE")) return answer(7, "BLOCK");
		if (BombEdgeworkUtils.getLitIndicatorCount(bomb) == 0 && colors.get(1).equals("BLUE") && colors.get(3).equals("BLUE")) return answer(8, String.valueOf(last(colors, "BLUE")));
		if (bomb.getPortPlates().size() == 2 && BombEdgeworkUtils.hasEmptyPortPlate(bomb)) return answer(9, "2", "4", "6");
		if (colors.get(4).equals("BLUE") && colors.get(0).equals("GREEN")) return answer(10, "5", "3", "1");
		if (bomb.getBatteryCount() == 0 && colors.get(2).equals("BLUE")) return answer(11, String.valueOf(first(colors, "BLUE")));
		if (bomb.hasPort(PortType.DVI) && bomb.getBatteryCount() == 1) return answer(12, "BLOCK");
		if (red > blue) return answer(13, "1", "4");
		return answer(14, "4");
	}

	private SolveResult<TheBlockOutput> answer(int rule, String... presses) { return success(new TheBlockOutput(rule, List.of(presses))); }
	private static long count(List<String> values, String target) { return values.stream().filter(target::equals).count(); }
	private static int first(List<String> values, String target) { return values.indexOf(target) + 1; }
	private static int last(List<String> values, String target) { return values.lastIndexOf(target) + 1; }
}
