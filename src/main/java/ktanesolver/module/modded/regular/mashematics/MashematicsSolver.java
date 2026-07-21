package ktanesolver.module.modded.regular.mashematics;

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
import ktanesolver.module.modded.regular.mashematics.MashematicsInput.Operator;

@Service
@ModuleInfo(
	type = ModuleType.MASHEMATICS,
	id = "mashematics",
	name = "Mashematics",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Evaluate the displayed equation and normalize the required number of pushes",
	tags = {"math", "button", "Souvenir", "modded"}
)
public class MashematicsSolver extends AbstractModuleSolver<MashematicsInput, MashematicsOutput> {
	@Override
	protected SolveResult<MashematicsOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, MashematicsInput input
	) {
		if (input == null || input.firstOperator() == null || input.secondOperator() == null) {
			return failure("Enter all three numbers and both operators");
		}
		if (!valid(input.first()) || !valid(input.second()) || !valid(input.third())) {
			return failure("Numbers must be between 0 and 99");
		}

		int answer = input.secondOperator() == Operator.MULTIPLY
			? apply(input.first(), apply(input.second(), input.third(), input.secondOperator()), input.firstOperator())
			: apply(apply(input.first(), input.second(), input.firstOperator()), input.third(), input.secondOperator());
		int presses = answer;
		while (presses < 0) presses += 50;
		while (presses > 99) presses -= 50;

		storeState(module, "numbers", List.of(input.first(), input.second(), input.third()));
		return success(new MashematicsOutput(answer, presses));
	}

	private static boolean valid(Integer value) {
		return value != null && value >= 0 && value <= 99;
	}

	private static int apply(int left, int right, Operator operator) {
		return switch (operator) {
			case ADD -> left + right;
			case SUBTRACT -> left - right;
			case MULTIPLY -> left * right;
		};
	}
}
