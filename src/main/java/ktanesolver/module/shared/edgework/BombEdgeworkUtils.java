package ktanesolver.module.shared.edgework;

import java.util.Set;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.enums.PortType;

public final class BombEdgeworkUtils {

	private BombEdgeworkUtils() {
	}

	public static boolean serialContains(BombEntity bomb, char character) {
		String serial = bomb.getSerialNumber();
		return serial != null && serial.toUpperCase().indexOf(Character.toUpperCase(character)) >= 0;
	}

	public static int countSerialDigits(BombEntity bomb) {
		String serial = bomb.getSerialNumber();
		return serial == null ? 0 : (int) serial.chars().filter(Character::isDigit).count();
	}

	public static int getFirstSerialDigit(BombEntity bomb) {
		String serial = bomb.getSerialNumber();
		if (serial == null) {
			return 0;
		}
		return serial.chars()
			.filter(Character::isDigit)
			.map(c -> c - '0')
			.findFirst()
			.orElse(0);
	}

	public static int getSerialDigitSum(BombEntity bomb) {
		String serial = bomb.getSerialNumber();
		if (serial == null) {
			return 0;
		}
		return serial.chars()
			.filter(Character::isDigit)
			.map(c -> c - '0')
			.sum();
	}

	public static boolean serialHasMoreLettersThanDigits(BombEntity bomb) {
		String serial = bomb.getSerialNumber();
		if (serial == null) {
			return false;
		}
		long letters = serial.chars().filter(Character::isLetter).count();
		long digits = serial.chars().filter(Character::isDigit).count();
		return letters > digits;
	}

	public static boolean hasDuplicateSerialCharacters(BombEntity bomb) {
		String serial = bomb.getSerialNumber();
		if (serial == null || serial.isEmpty()) {
			return false;
		}
		Set<Integer> seen = serial.toUpperCase().chars().boxed().collect(java.util.stream.Collectors.toSet());
		return serial.length() != seen.size();
	}

	public static long getLitIndicatorCount(BombEntity bomb) {
		return bomb.getIndicators().values().stream()
			.filter(Boolean::booleanValue)
			.count();
	}

	public static long getUnlitIndicatorCount(BombEntity bomb) {
		return bomb.getIndicators().values().stream()
			.filter(value -> !Boolean.TRUE.equals(value))
			.count();
	}

	public static boolean hasBothLitAndUnlitIndicators(BombEntity bomb) {
		boolean hasLit = bomb.getIndicators().values().stream().anyMatch(Boolean::booleanValue);
		boolean hasUnlit = bomb.getIndicators().values().stream().anyMatch(value -> !Boolean.TRUE.equals(value));
		return hasLit && hasUnlit;
	}

	public static boolean hasIndicatorWithNoVowels(BombEntity bomb) {
		return bomb.getIndicators().keySet().stream()
			.anyMatch(label -> label.chars().noneMatch(c -> "AEIOU".indexOf(Character.toUpperCase(c)) >= 0));
	}

	public static int getTotalPortCount(BombEntity bomb) {
		return bomb.getPortPlates().stream()
			.mapToInt(plate -> plate.getPorts().size())
			.sum();
	}

	public static int getDistinctPortTypeCount(BombEntity bomb) {
		return (int) bomb.getPortPlates().stream()
			.flatMap(plate -> plate.getPorts().stream())
			.distinct()
			.count();
	}

	public static boolean hasDuplicatePorts(BombEntity bomb) {
		long totalPorts = bomb.getPortPlates().stream()
			.flatMap(plate -> plate.getPorts().stream())
			.count();
		return totalPorts != getDistinctPortTypeCount(bomb);
	}

	public static long countPortPlatesWithPortType(BombEntity bomb, PortType portType) {
		return bomb.getPortPlates().stream()
			.filter(plate -> plate.getPorts().contains(portType))
			.count();
	}

	public static boolean hasTwoOrMoreOfAnyPortType(BombEntity bomb) {
		for (PortType type : PortType.values()) {
			if (countPortPlatesWithPortType(bomb, type) >= 2) {
				return true;
			}
		}
		return false;
	}

	public static boolean hasEmptyPortPlate(BombEntity bomb) {
		return bomb.getPortPlates().stream().anyMatch(plate -> plate.getPorts().isEmpty());
	}

	public static int countSolvedModules(BombEntity bomb) {
		return (int) bomb.getModules().stream()
			.filter(ModuleEntity::isSolved)
			.count();
	}

	public static int countUnsolvedRegularModules(BombEntity bomb) {
		return (int) bomb.getModules().stream()
			.filter(module -> !module.isSolved())
			.filter(module -> !module.getType().isNeedy())
			.count();
	}
}
