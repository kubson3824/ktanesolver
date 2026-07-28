package ktanesolver.module.modded.regular.superlogic;

import java.util.ArrayList;
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
import ktanesolver.module.modded.regular.superlogic.SuperlogicInput.Equation;

@Service
@ModuleInfo(
	type = ModuleType.SUPERLOGIC,
	id = "SuperlogicModule",
	name = "Superlogic",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Solve the three simultaneous Boolean equations and submit the values of A, B, and C.",
	tags = { "logic", "boolean", "equations", "modded" }
)
public class SuperlogicSolver extends AbstractModuleSolver<SuperlogicInput, SuperlogicOutput> {
	private static final int VARIABLE_COUNT = 3;

	@Override
	protected SolveResult<SuperlogicOutput> doSolve(
		RoundEntity round,
		BombEntity bomb,
		ModuleEntity module,
		SuperlogicInput input
	) {
		if (input.equations() == null || input.equations().size() != VARIABLE_COUNT) {
			return failure("Enter exactly three equations, for A, B, and C");
		}

		for (int left = 0; left < VARIABLE_COUNT; left++) {
			Equation equation = input.equations().get(left);
			if (!isValid(equation, left)) {
				return failure("Each equation must use the other two variables, one connective, and at most one negator");
			}
		}

		List<List<Boolean>> solutions = new ArrayList<>();
		for (int assignment = 0; assignment < 1 << VARIABLE_COUNT; assignment++) {
			List<Boolean> values = List.of(
				(assignment & 1) != 0,
				(assignment & 2) != 0,
				(assignment & 4) != 0
			);
			if (satisfiesAll(input.equations(), values)) {
				solutions.add(values);
			}
		}

		if (solutions.size() != 1) {
			return failure("The equations must have exactly one solution");
		}

		storeState(module, "input", input);
		return success(new SuperlogicOutput(solutions.getFirst()));
	}

	private static boolean isValid(Equation equation, int left) {
		if (equation == null || equation.connective() == null) {
			return false;
		}
		int operand1 = Character.toUpperCase(equation.operand1()) - 'A';
		int operand2 = Character.toUpperCase(equation.operand2()) - 'A';
		int negatorCount = (equation.negated1() ? 1 : 0)
			+ (equation.negated2() ? 1 : 0)
			+ (equation.negatedExpression() ? 1 : 0);
		return operand1 >= 0 && operand1 < VARIABLE_COUNT
			&& operand2 >= 0 && operand2 < VARIABLE_COUNT
			&& operand1 != left
			&& operand2 != left
			&& operand1 != operand2
			&& negatorCount <= 1;
	}

	private static boolean satisfiesAll(List<Equation> equations, List<Boolean> values) {
		for (int left = 0; left < VARIABLE_COUNT; left++) {
			Equation equation = equations.get(left);
			boolean operand1 = values.get(Character.toUpperCase(equation.operand1()) - 'A');
			boolean operand2 = values.get(Character.toUpperCase(equation.operand2()) - 'A');
			if (equation.negated1()) operand1 = !operand1;
			if (equation.negated2()) operand2 = !operand2;
			boolean right = equation.connective().apply(operand1, operand2);
			if (equation.negatedExpression()) right = !right;
			if (values.get(left) != right) return false;
		}
		return true;
	}
}
