package ktanesolver.module.modded.regular.theswan;

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
	type = ModuleType.THE_SWAN,
	id = "the-swan",
	name = "The Swan",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Determine the disarm code from the number of successful system resets",
	tags = {"boss", "resets", "sequences", "Souvenir"}
)
public class TheSwanSolver extends AbstractModuleSolver<TheSwanInput, TheSwanOutput> {
	@Override
	protected SolveResult<TheSwanOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, TheSwanInput input
	) {
		if (input == null || input.resetCount() == null || input.resetCount() < 0) {
			return failure("Reset count must be zero or greater");
		}
		storeState(module, "resetCount", input.resetCount());
		return success(new TheSwanOutput(codeFor(input.resetCount()), input.resetCount()));
	}

	static String codeFor(int resetCount) {
		return switch (resetCount) {
			case 0, 4, 6, 12, 17, 23 -> "SWAN";
			case 1, 2, 5, 11, 18, 20 -> "HATCH";
			case 3, 9 -> "SWN";
			case 7, 13 -> "DARMA";
			case 8, 10, 14, 16, 24 -> "DHARMA";
			case 15, 19, 21, 22 -> "HTCH";
			default -> "77";
		};
	}
}
