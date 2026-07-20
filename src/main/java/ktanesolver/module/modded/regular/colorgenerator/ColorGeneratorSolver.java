package ktanesolver.module.modded.regular.colorgenerator;

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
	type = ModuleType.COLOR_GENERATOR,
	id = "Color Generator",
	name = "Color Generator",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Convert the bomb serial number into red, green, and blue values.",
	tags = {"colors", "serial number", "math", "modded"},
	hasInput = false
)
public class ColorGeneratorSolver extends AbstractModuleSolver<ColorGeneratorInput, ColorGeneratorOutput> {
	@Override
	protected SolveResult<ColorGeneratorOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, ColorGeneratorInput input
	) {
		String serial = bomb.getSerialNumber();
		if (serial == null || !serial.matches("[A-Za-z0-9]{6}")) return failure("Enter a valid six-character serial number");

		int[] values = serial.toUpperCase(Locale.ROOT).chars()
			.map(character -> (Character.isLetter(character) ? character - 'A' + 1 : character - '0') % 16)
			.toArray();
		return success(new ColorGeneratorOutput(
			values[0] * 16 + values[1],
			values[2] * 16 + values[3],
			values[4] * 16 + values[5]
		));
	}
}
