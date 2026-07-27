package ktanesolver.module.modded.regular.errorcodes;

import java.util.List;
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
	type = ModuleType.ERROR_CODES,
	id = "errorCodes",
	name = "Error Codes",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Convert the active hexadecimal error code into the required fix-code format",
	tags = {"hexadecimal", "conversion", "edgework", "modded"}
)
public class ErrorCodesSolver extends AbstractModuleSolver<ErrorCodesInput, ErrorCodesOutput> {

	@Override
	protected SolveResult<ErrorCodesOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, ErrorCodesInput input
	) {
		if (input == null || input.errorCodes() == null || input.errorCodes().size() != 4) {
			return failure("Enter all four displayed error codes");
		}

		List<String> codes = input.errorCodes().stream()
			.map(code -> code == null ? "" : code.toUpperCase(Locale.ROOT))
			.toList();
		if (codes.stream().anyMatch(code -> !code.matches("[0-9A-F]{2}") || Integer.parseInt(code, 16) > 101)) {
			return failure("Each error code must be a two-digit hexadecimal value from 00 to 65");
		}

		int branch = (bomb.serialHasVowel() ? 0 : 2) + bomb.getBatteryCount() % 2;
		String activeCode = codes.get(branch);
		int fix = 101 - Integer.parseInt(activeCode, 16);
		String format;
		String fixCode;
		switch (branch) {
			case 0 -> {
				format = "Decimal";
				fixCode = "%03d".formatted(fix);
			}
			case 1 -> {
				format = "Octal";
				fixCode = "%03o".formatted(fix);
			}
			case 2 -> {
				format = "Hexadecimal";
				fixCode = "%02X".formatted(fix);
			}
			default -> {
				format = "Binary";
				fixCode = "%7s".formatted(Integer.toBinaryString(fix)).replace(' ', '0');
			}
		}

		storeState(module, "activeErrorCode", activeCode);
		return success(new ErrorCodesOutput(activeCode, fix, format, fixCode));
	}
}
