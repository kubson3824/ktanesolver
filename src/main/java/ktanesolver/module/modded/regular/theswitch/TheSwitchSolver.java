package ktanesolver.module.modded.regular.theswitch;

import java.util.Map;
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

@Service
@ModuleInfo(type = ModuleType.THE_SWITCH, id = "BigSwitch", name = "The Switch",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Flip the switch twice when either seconds digit matches the color and edgework rule.",
	tags = {"switch", "led", "colors", "timer", "stages"})
public class TheSwitchSolver extends AbstractModuleSolver<TheSwitchInput, TheSwitchOutput> {
	@Override protected SolveResult<TheSwitchOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, TheSwitchInput input) {
		if (input == null || input.position() == null || input.topColor() == null || input.bottomColor() == null)
			return failure("Select the switch position and both LED colors");
		if (bomb.getSerialNumber() == null) return failure("Bomb serial number is required");
		int completed = input.restartAttempt() ? 0 : module.getState().get("successfulFlips") instanceof Number number ? number.intValue() : 0;
		int stage = completed + 1;
		int digit = digit(bomb, input.position(), input.topColor(), input.bottomColor());
		storeState(module, Map.of("successfulFlips", stage, "stage" + stage + "Top", input.topColor().name().toLowerCase(), "stage" + stage + "Bottom", input.bottomColor().name().toLowerCase()));
		return success(new TheSwitchOutput(stage, digit, input.position() == SwitchPosition.DOWN ? SwitchPosition.UP : SwitchPosition.DOWN), stage == 2);
	}

	static int digit(BombEntity bomb, SwitchPosition position, SwitchColor top, SwitchColor bottom) {
		if (position == SwitchPosition.DOWN) {
			if (top == SwitchColor.RED || bottom == SwitchColor.BLUE) return 5;
			if ((top == SwitchColor.GREEN || top == SwitchColor.YELLOW) && !bomb.isLastDigitOdd()) return 3;
			if ((bottom == SwitchColor.GREEN || bottom == SwitchColor.YELLOW) && bomb.isLastDigitOdd()) return 6;
			if (top == bottom) return 0;
			return 9;
		}
		if ((top == SwitchColor.PURPLE || bottom == SwitchColor.PURPLE) && bomb.hasPort(PortType.RJ45)) return 1;
		if (top == SwitchColor.ORANGE || bottom == SwitchColor.ORANGE) return 4;
		if (bottom == SwitchColor.RED || bottom == SwitchColor.YELLOW) return 7;
		if (bomb.getBatteryCount() >= 2 && bomb.isIndicatorUnlit("TRN")) return 8;
		return 2;
	}
}
