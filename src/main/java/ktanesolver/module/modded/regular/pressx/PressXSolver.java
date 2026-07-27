package ktanesolver.module.modded.regular.pressx;

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

@Service
@ModuleInfo(
	type = ModuleType.PRESS_X,
	id = "PressX",
	name = "Press X",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Determine which controller button to press and the valid countdown seconds.",
	tags = {"modded", "regular", "timing", "edgework"}
)
public class PressXSolver extends AbstractModuleSolver<PressXInput, PressXOutput> {
	private static final String[][] BUTTONS = {
		{"A", "B", "Y"},
		{"X", "Y", "A"},
		{"B", "A", "X"},
		{"Y", "X", "B"}
	};

	@Override
	public SolveResult<PressXOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, PressXInput input
	) {
		String serial = bomb.getSerialNumber();
		if (serial == null) return failure("Serial number is required");

		int firstSerialDigit = serial.chars()
			.filter(Character::isDigit)
			.map(Character::getNumericValue)
			.findFirst()
			.orElse(-1);
		if (firstSerialDigit < 0) return failure("Serial number must contain a digit");

		long lit = bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count();
		long unlit = bomb.getIndicators().size() - lit;
		int column = unlit > lit ? 0 : lit > unlit ? 1 : 2;
		int solved = (int) bomb.getModules().stream().filter(ModuleEntity::isSolved).count();
		String button = BUTTONS[solved % 4][column];

		if ("X".equals(button) && bomb.isIndicatorLit("CAR") && bomb.getBatteryCount() < 2) {
			return success(output("ANY", "Any time", List.of(), true));
		}
		if (bomb.getBatteryCount() >= 3) {
			return success(output(button, "Last timer digit equals the first serial digit",
				List.of(firstSerialDigit, 10 + firstSerialDigit, 20 + firstSerialDigit,
					30 + firstSerialDigit, 40 + firstSerialDigit, 50 + firstSerialDigit), false));
		}
		if ("A".equals(button) && (serial.indexOf('2') >= 0 || serial.indexOf('5') >= 0)) {
			return success(output("A", "Seconds read 05 or 30", List.of(5, 30), false));
		}
		if (!"Y".equals(button) && bomb.isIndicatorLit("NSA")) {
			return success(output(button, "The two seconds digits are equal", List.of(0, 11, 22, 33, 44, 55), false));
		}
		return success(output(button, "The two seconds digits add up to 9", List.of(9, 18, 27, 36, 45, 54), false));
	}

	private PressXOutput output(String button, String timing, List<Integer> validSeconds, boolean anyTime) {
		String instruction = anyTime
			? "Press any button at any time."
			: "Press %s when %s. Valid seconds: %s.".formatted(
				button, timing.toLowerCase(),
				validSeconds.stream().map(second -> "%02d".formatted(second)).toList());
		return new PressXOutput(button, timing, validSeconds, anyTime, instruction);
	}
}
