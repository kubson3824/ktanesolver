package ktanesolver.module.modded.needy.determinants;

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
	type = ModuleType.DETERMINANTS,
	id = "determinant",
	name = "Determinants",
	category = ModuleCatalogDto.ModuleCategory.MODDED_NEEDY,
	description = "Calculate the determinant of the active two-by-two matrix.",
	tags = {"needy", "matrix", "math", "keypad"}
)
public class DeterminantsSolver extends AbstractModuleSolver<DeterminantsInput, DeterminantsOutput> {
	@Override
	protected SolveResult<DeterminantsOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, DeterminantsInput input
	) {
		if (input == null || input.a() == null || input.b() == null || input.c() == null || input.d() == null) {
			return failure("Enter all four matrix values");
		}
		if (!valid(input.a()) || !valid(input.b()) || !valid(input.c()) || !valid(input.d())) {
			return failure("Every matrix value must be an integer from -9 through 9");
		}
		return success(new DeterminantsOutput(input.a() * input.d() - input.b() * input.c()), false);
	}

	private static boolean valid(int value) { return value >= -9 && value <= 9; }
}
