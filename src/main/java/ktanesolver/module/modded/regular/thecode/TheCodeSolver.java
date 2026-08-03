package ktanesolver.module.modded.regular.thecode;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.shared.edgework.BombEdgeworkUtils;

@Service
@ModuleInfo(
	type = ModuleType.THE_CODE,
	id = "theCodeModule",
	name = "The Code",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Divide the displayed number using the first matching edgework rule.",
	tags = {"numbers", "math", "edgework"}
)
public class TheCodeSolver extends AbstractModuleSolver<TheCodeInput, TheCodeOutput> {
	@Override
	protected SolveResult<TheCodeOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, TheCodeInput input
	) {
		if(input == null || input.displayedNumber() == null
			|| input.displayedNumber() < 999 || input.displayedNumber() > 9999) {
			return failure("Displayed number must be from 999 to 9999");
		}
		String serial = bomb.getSerialNumber();
		if(serial == null || serial.chars().filter(Character::isDigit).count() < 2) {
			return failure("The bomb needs a serial number with at least two digits");
		}

		int divisor;
		if(BombEdgeworkUtils.getFirstSerialDigit(bomb) == bomb.getLastDigit() && bomb.getBatteryCount() == 0) divisor = 1;
		else if(bomb.hasIndicator("CLR")) divisor = 8;
		else if(BombEdgeworkUtils.serialContains(bomb, 'X') || BombEdgeworkUtils.serialContains(bomb, 'Y')
			|| BombEdgeworkUtils.serialContains(bomb, 'Z')) divisor = 20;
		else if(BombEdgeworkUtils.getTotalPortCount(bomb) >= 5) divisor = 30;
		else if(bomb.getBatteryCount() == 0) divisor = 42;
		else if(BombEdgeworkUtils.getLitIndicatorCount(bomb) > BombEdgeworkUtils.getUnlitIndicatorCount(bomb)) divisor = 69;
		else divisor = 3;

		storeState(module, "displayedNumber", input.displayedNumber());
		return success(new TheCodeOutput(input.displayedNumber() / divisor));
	}
}
