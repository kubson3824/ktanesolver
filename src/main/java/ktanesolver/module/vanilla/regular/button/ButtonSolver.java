
package ktanesolver.module.vanilla.regular.button;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.logic.AbstractModuleSolver;
import org.springframework.stereotype.Service;

import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
		type = ModuleType.BUTTON,
		id = "button",
		name = "The Button",
		category = ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR,
		description = "Press and hold the button based on strip color and text",
		tags = {"timing", "color"}
)
public class ButtonSolver extends AbstractModuleSolver<ButtonInput, ButtonOutput> {

	@Override
	public SolveResult<ButtonOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, ButtonInput input) {
		String color = input.color();
		String label = input.label();

		// Set module state with inputs
		storeState(module, "color", color);
		storeState(module, "label", label);

		if(input.stripColor() != null) {
			storeState(module, "stripColor", input.stripColor());

			if(input.stripColor().equalsIgnoreCase("BLUE")) {
                return success(new ButtonOutput(false, "Release when timer has 4", 4));
			}
			if(input.stripColor().equalsIgnoreCase("WHITE")) {
                return success(new ButtonOutput(false, "Release when timer has 1", 1));
			}
			if(input.stripColor().equalsIgnoreCase("YELLOW")) {
                return success(new ButtonOutput(false, "Release when timer has 5", 5));
			}
            return success(new ButtonOutput(false, "Release when timer has 1", 1));
		}

		// Immediate release rules
		if(color.equalsIgnoreCase("BLUE") && label.equalsIgnoreCase("ABORT")) {
			return hold();
		}

		if(label.equalsIgnoreCase("DETONATE") && bomb.getBatteryCount() > 1) {
			return solved();
		}

		if(color.equalsIgnoreCase("WHITE") && bomb.isIndicatorLit("CAR")) {
			return hold();
		}

		if(bomb.getBatteryCount() > 2 && bomb.isIndicatorLit("FRK")) {
			return solved();
		}

		if(color.equalsIgnoreCase("YELLOW")) {
			return hold();
		}

		if(color.equalsIgnoreCase("RED") && label.equalsIgnoreCase("HOLD")) {
			return solved();
		}

		return hold();
	}

	private SolveResult<ButtonOutput> hold() {
		ButtonOutput output = new ButtonOutput(true, "Hold the button", null);
		return success(output);
	}

	private SolveResult<ButtonOutput> solved() {
		ButtonOutput output = new ButtonOutput(false, "Press and immediately release", null);
		return success(output);
	}
}
