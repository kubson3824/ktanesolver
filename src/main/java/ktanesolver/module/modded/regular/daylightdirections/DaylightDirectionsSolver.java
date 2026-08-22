package ktanesolver.module.modded.regular.daylightdirections;

import java.util.Locale;
import java.util.Map;

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
	type = ModuleType.DAYLIGHT_DIRECTIONS,
	id = "daylightDirections",
	name = "Daylight Directions",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Orient the colored compass arrow using the active sun and bomb edgework.",
	tags = {"directions", "colors", "ports", "serial number"}
)
public class DaylightDirectionsSolver extends AbstractModuleSolver<DaylightDirectionsInput, DaylightDirectionsOutput> {
	private static final String[] DIRECTIONS = {"RIGHT", "DOWN_RIGHT", "DOWN", "DOWN_LEFT", "LEFT", "UP_LEFT", "UP", "UP_RIGHT"};
	private static final Map<String, Integer> COLOR_ROTATIONS = Map.of("RED", 0, "BLUE", 4, "YELLOW", 2, "GREEN", 5, "PURPLE", 1);

	@Override
	protected SolveResult<DaylightDirectionsOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, DaylightDirectionsInput input) {
		if (input == null || input.activeSun() == null || input.arrowColor() == null || input.currentDirection() == null) {
			return failure("Enter the active sun, arrow color, and current arrow direction");
		}
		String sun = normalize(input.activeSun());
		String color = normalize(input.arrowColor());
		String current = normalize(input.currentDirection());
		int currentIndex = indexOf(DIRECTIONS, current);
		if (!(sun.equals("LEFT") || sun.equals("RIGHT")) || !COLOR_ROTATIONS.containsKey(color) || currentIndex < 0) {
			return failure("The active sun, arrow color, or current direction is invalid");
		}
		String serial = bomb.getSerialNumber();
		if (serial == null || serial.isBlank()) return failure("A serial number is required");

		int target = startingRotation(bomb, serial);
		boolean flipForSun = sun.equals("RIGHT") != bomb.isLastDigitEven();
		if (flipForSun) target = (target + 4) % 8;
		target = (target + COLOR_ROTATIONS.get(color)) % 8;
		int clockwise = Math.floorMod(target - currentIndex, 8);
		int counterclockwise = Math.floorMod(currentIndex - target, 8);
		String turn = clockwise <= counterclockwise ? "CLOCKWISE" : "COUNTERCLOCKWISE";
		int count = Math.min(clockwise, counterclockwise);
		return success(new DaylightDirectionsOutput(DIRECTIONS[target], turn, count));
	}

	private static int startingRotation(BombEntity bomb, String serial) {
		if (BombEdgeworkUtils.hasDuplicatePorts(bomb)) return 0;
		if ((bomb.hasPort(PortType.SERIAL) || bomb.hasPort(PortType.DVI)) && !bomb.hasPort(PortType.PARALLEL)) return 3;
		if (serial.chars().filter(Character::isLetter).count() == 4) return 1;
		if (BombEdgeworkUtils.getLitIndicatorCount(bomb) >= 2) return 5;
		if (bomb.getDBatteryCount() >= 1) return 6;
		if (bomb.serialHasVowel()) return 4;
		if (bomb.getBatteryCount() > 4) return 2;
		return 7;
	}

	private static String normalize(String value) { return value.trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_'); }
	private static int indexOf(String[] values, String value) { for (int i = 0; i < values.length; i++) if (values[i].equals(value)) return i; return -1; }
}
