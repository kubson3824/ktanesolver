package ktanesolver.module.modded.regular.amistake;

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
import ktanesolver.module.shared.edgework.BombEdgeworkUtils;

@Service
@ModuleInfo(
	type = ModuleType.A_MISTAKE,
	id = "MistakeModule",
	name = "A Mistake",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Destroy the blank module with three touches at the required timer values.",
	tags = {"blank", "timer", "multi-stage"}
)
public class AMistakeSolver extends AbstractModuleSolver<AMistakeInput, AMistakeOutput> {
	@Override
	protected SolveResult<AMistakeOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, AMistakeInput input) {
		String serial = bomb.getSerialNumber();
		if (serial == null || serial.chars().noneMatch(Character::isDigit)) return failure("A serial number containing digits is required");
		int stage = module.getState().get("mistakeNextStage") instanceof Number value ? value.intValue() : 1;
		return switch (stage) {
			case 1 -> advance(module, new AMistakeOutput(1, "Touch immediately", "touch", 2), false);
			case 2 -> advance(module, new AMistakeOutput(2, "Touch when the timer's last digit is " + bomb.getLastDigit(), "touch " + bomb.getLastDigit(), 3), false);
			case 3 -> {
				int seconds = BombEdgeworkUtils.getSerialDigitSum(bomb);
				yield advance(module, new AMistakeOutput(3, "Touch when the seconds section is " + String.format(Locale.ROOT, "%02d", seconds), "touch " + String.format(Locale.ROOT, "%02d", seconds), 3), true);
			}
			default -> failure("The saved A Mistake stage is invalid");
		};
	}

	private SolveResult<AMistakeOutput> advance(ModuleEntity module, AMistakeOutput output, boolean solved) {
		storeState(module, "mistakeNextStage", output.nextStage());
		return success(output, solved);
	}
}
