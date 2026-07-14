package ktanesolver.module.modded.regular.bitwiseoperations;

import java.util.Locale;

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
import ktanesolver.module.shared.edgework.BombEdgeworkUtils;

@Service
@ModuleInfo(
	type = ModuleType.BITWISE_OPERATIONS,
	id = "BitOps",
	name = "Bitwise Operations",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Combine two edgework bytes using the displayed bitwise operator.",
	tags = {"binary", "logic", "edgework", "modded"}
)
public class BitwiseOperationsSolver extends AbstractModuleSolver<BitwiseOperationsInput, BitwiseOperationsOutput> {
	@Override
	protected SolveResult<BitwiseOperationsOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, BitwiseOperationsInput input
	) {
		if (input == null || input.operator() == null) return failure("Select the displayed operator");
		if (input.startingTimeMinutes() == null || !Double.isFinite(input.startingTimeMinutes())
			|| input.startingTimeMinutes() < 0) return failure("Enter a valid starting time in minutes");

		String operator = input.operator().trim().toUpperCase(Locale.ROOT);
		if (!operator.matches("AND|OR|XOR|NOT")) return failure("Operator must be AND, OR, XOR, or NOT");

		int modules = bomb.getModules().size();
		int ports = BombEdgeworkUtils.getTotalPortCount(bomb);
		long lit = BombEdgeworkUtils.getLitIndicatorCount(bomb);
		long unlit = BombEdgeworkUtils.getUnlitIndicatorCount(bomb);
		int byte1 = bits(
			bomb.getAaBatteryCount() == 0,
			bomb.hasPort(PortType.PARALLEL),
			bomb.isIndicatorLit("NSA"),
			modules > input.startingTimeMinutes(),
			lit > 1,
			modules % 3 == 0,
			bomb.getDBatteryCount() < 2,
			ports < 4
		);
		int byte2 = bits(
			bomb.getDBatteryCount() >= 1,
			ports >= 3,
			bomb.getBatteryHolders() >= 2,
			bomb.isIndicatorLit("BOB"),
			unlit > 1,
			bomb.isLastDigitOdd(),
			modules % 2 == 0,
			bomb.getBatteryCount() >= 2
		);
		int answer = switch (operator) {
			case "AND" -> byte1 & byte2;
			case "OR" -> byte1 | byte2;
			case "XOR" -> byte1 ^ byte2;
			case "NOT" -> ~byte1 & 0xff;
			default -> throw new IllegalStateException();
		};

		storeState(module, "operator", operator);
		storeState(module, "startingTimeMinutes", input.startingTimeMinutes());
		storeState(module, "byte1", binary(byte1));
		storeState(module, "byte2", binary(byte2));
		return success(new BitwiseOperationsOutput(binary(byte1), binary(byte2), binary(answer)));
	}

	private static int bits(boolean... values) {
		int result = 0;
		for (boolean value : values) result = result << 1 | (value ? 1 : 0);
		return result;
	}

	private static String binary(int value) {
		return String.format("%8s", Integer.toBinaryString(value)).replace(' ', '0');
	}
}
