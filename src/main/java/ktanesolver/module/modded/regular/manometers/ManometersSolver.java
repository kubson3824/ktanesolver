package ktanesolver.module.modded.regular.manometers;

import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
	type = ModuleType.MANOMETERS,
	id = "manometers",
	name = "Manometers",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Calculate the target pressure, then set three color-dependent manometers.",
	tags = {"pressure", "colors", "edgework", "timed", "stages"}
)
public class ManometersSolver extends AbstractModuleSolver<ManometersInput, ManometersOutput> {
	private static final List<String> MANOMETER_COLORS = List.of("BLUE", "GREEN", "RED");
	private static final int[][] COMBINATIONS = {
		{2,0,2},{1,1,1},{0,2,1},{1,0,2},{0,0,2},{2,1,0},{1,1,2},{1,0,1},{1,2,0},
		{2,2,1},{0,0,0},{0,1,2},{2,0,1},{0,2,2},{1,1,0},{2,1,1},{2,2,2},{0,0,1},
		{1,2,1},{0,1,0},{0,1,1},{2,1,2},{1,0,0},{2,0,0},{2,2,0},{1,2,2},{0,2,0}
	};
	private static final int[][] PRESSURES = {
		{3,4,4},{10,9,9},{2,10,5},{6,10,7},{2,6,3},{8,10,2},{10,10,10},{7,9,9},{4,2,2},
		{8,6,7},{6,5,1},{4,6,2},{9,10,8},{3,4,2},{8,6,9},{7,2,6},{5,3,2},{6,7,10},
		{8,10,10},{6,10,4},{7,9,5},{5,6,9},{8,6,2},{1,5,3},{9,8,7},{8,8,9},{2,4,5}
	};

	@Override
	protected SolveResult<ManometersOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, ManometersInput input
	) {
		if (input == null || (input.stage() != 1 && input.stage() != 2)) return failure("Select stage 1 or stage 2");
		if (input.stage() == 1) return solveTarget(module, input);
		return solveManometers(round, bomb, module, input);
	}

	private SolveResult<ManometersOutput> solveTarget(ModuleEntity module, ManometersInput input) {
		String screen = color(input.screenColor()), minus = color(input.minusColor()), plus = color(input.plusColor());
		Integer screenValue = Map.of("BLUE", 5, "ORANGE", 7, "BLACK", 8, "YELLOW", 9, "MAGENTA", 6).get(screen);
		Integer minusValue = Map.of("BLUE", 2, "ORANGE", 3, "YELLOW", 4).get(minus);
		Integer plusValue = Map.of("BLUE", 1, "ORANGE", 2, "YELLOW", 1).get(plus);
		if (screenValue == null || minusValue == null || plusValue == null)
			return failure("Select valid screen, minus-button, and plus-button colors");
		int target = normalizeTarget(minusValue * screenValue / plusValue);
		boolean everBlue = Boolean.TRUE.equals(module.getState().get("everBlueScreen"))
			|| Boolean.TRUE.equals(input.blueScreenSeenPreviously()) || "BLUE".equals(screen);
		boolean everOrange = Boolean.TRUE.equals(module.getState().get("everOrangeScreen"))
			|| Boolean.TRUE.equals(input.orangeScreenSeenPreviously()) || "ORANGE".equals(screen);
		storeState(module, Map.of("targetPressure", target, "screenColor", screen,
			"minusColor", minus, "plusColor", plus, "everBlueScreen", everBlue, "everOrangeScreen", everOrange));
		return success(new ManometersOutput(1, target, null, null, null, null, null, null, false), false);
	}

	private SolveResult<ManometersOutput> solveManometers(
		RoundEntity round, BombEntity bomb, ModuleEntity module, ManometersInput input
	) {
		Object storedTarget = module.getState().get("targetPressure");
		Object storedScreen = module.getState().get("screenColor");
		if (!(storedTarget instanceof Number number) || storedScreen == null)
			return failure("Complete and submit stage 1 before entering the manometers");
		String top = color(input.topColor()), bottomLeft = color(input.bottomLeftColor()), bottomRight = color(input.bottomRightColor());
		if (!MANOMETER_COLORS.contains(top) || !MANOMETER_COLORS.contains(bottomLeft) || !MANOMETER_COLORS.contains(bottomRight))
			return failure("Select blue, green, or red for all three manometers");
		if (input.underFiveMinutes() == null || !validClock(input))
			return failure("Current date, hour, and under-five-minutes state are required");

		int base = combination(colorCode(bottomLeft), colorCode(top), colorCode(bottomRight));
		int shifted = Math.floorMod(base + shift(base, bomb, input,
			Boolean.TRUE.equals(module.getState().get("everBlueScreen")),
			Boolean.TRUE.equals(module.getState().get("everOrangeScreen"))), 27);
		int topMaximum = PRESSURES[shifted][1], bottomLeftMaximum = PRESSURES[shifted][0], bottomRightMaximum = PRESSURES[shifted][2];
		int target = number.intValue(), remaining = target;
		int topPressure = Math.min(remaining, topMaximum); remaining -= topPressure;
		int bottomLeftPressure = Math.min(remaining, bottomLeftMaximum); remaining -= bottomLeftPressure;
		int bottomRightPressure = Math.min(remaining, bottomRightMaximum); remaining -= bottomRightPressure;
		boolean valve = remaining > 0;
		if (valve) {
			topPressure = topMaximum; bottomLeftPressure = bottomLeftMaximum; bottomRightPressure = bottomRightMaximum;
		}
		storeState(module, Map.of("topColor", top, "bottomLeftColor", bottomLeft, "bottomRightColor", bottomRight));
		return success(new ManometersOutput(2, target, topMaximum, bottomLeftMaximum, bottomRightMaximum,
			topPressure, bottomLeftPressure, bottomRightPressure, valve));
	}

	static int normalizeTarget(int target) {
		while (target > 35 || target < 11) target += target < 11 ? 4 : -6;
		return target;
	}

	private static boolean validClock(ManometersInput input) {
		return input.month() != null && input.month() >= 1 && input.month() <= 12
			&& input.day() != null && input.day() >= 1 && input.day() <= 31
			&& input.dayOfWeek() != null && input.dayOfWeek() >= 1 && input.dayOfWeek() <= 7
			&& input.hour() != null && input.hour() >= 0 && input.hour() <= 23;
	}

	static int shift(int base, BombEntity bomb, ManometersInput input, boolean blueScreenSeen, boolean orangeScreenSeen) {
		int aa = bomb.getAaBatteryCount(), d = bomb.getDBatteryCount(), batteries = bomb.getBatteryCount();
		int indicators = bomb.getIndicators().size(), strikes = bomb.getStrikes();
		return switch (base) {
			case 10 -> batteries >= 2 ? 2 : bomb.hasPort(PortType.RJ45) ? -2 : input.month() == 8 ? 3 : -1;
			case 17 -> portCount(bomb) >= 3 ? 5 : bomb.isIndicatorUnlit("FRQ") ? -4 : orangeScreenSeen ? 1 : 4;
			case 22 -> bomb.hasPort(PortType.RJ45) ? 2 : d == 1 ? -2 : batteries > 2 ? 3 : 5;
			case 4 -> input.dayOfWeek() == 1 ? 3 : bomb.getBatteryHolders() >= 2 ? -1 : input.dayOfWeek() == 5 && input.day() == 13 ? 10 : 2;
			case 23 -> bomb.isIndicatorLit("SIG") ? 3 : bomb.isIndicatorUnlit("NSA") ? 2 : indicators > 2 ? 5 : -2;
			case 12 -> bomb.hasPort(PortType.DVI) ? -1 : bomb.hasPort(PortType.PS2) ? -3 : bomb.hasPort(PortType.PARALLEL) ? 4 : 2;
			case 3 -> input.month() == 5 ? 3 : bomb.isIndicatorUnlit("FRK") ? -8 : aa > d ? 2 : -2;
			case 0 -> aa <= d ? 2 : bomb.isIndicatorLit("TRN") ? 1 : input.month() == 2 ? 4 : 2;
			case 7 -> bomb.isIndicatorLit("MSA") ? 2 : bomb.hasPort(PortType.STEREO_RCA) ? -2 : batteries == 0 ? 3 : -3;
			case 1 -> bomb.isIndicatorLit("CAR") ? 2 : bomb.isIndicatorUnlit("CLR") ? -5 : bomb.serialHasVowel() ? 1 : 5;
			case 14 -> input.dayOfWeek() == 4 ? 5 : bomb.getPortPlates().size() > 2 ? -1 : portCount(bomb, PortType.RJ45) >= 2 ? -3 : -3;
			case 20 -> input.month() % 2 == 0 ? 1 : bomb.isIndicatorLit("IND") ? -8 : hasModule(bomb, ModuleType.DR_DOCTOR) ? 2 : -4;
			case 6 -> d < aa ? 2 : indicators > 2 ? -1 : bomb.isLastDigitOdd() ? 1 : 4;
			case 15 -> input.hour() >= 17 ? 2 : aa == indicators ? -2 : bomb.isIndicatorLit("FRQ") ? 3 : 5;
			case 5 -> bomb.hasPort(PortType.DVI) ? 2 : bomb.isIndicatorLit("NSA") ? -2 : input.dayOfWeek() == 2 ? 3 : 3;
			case 11 -> input.month() == 3 ? -1 : bomb.isIndicatorUnlit("CLR") ? 3 : bomb.hasPort(PortType.SERIAL) ? 2 : -3;
			case 19 -> blueScreenSeen ? 1 : input.month() == 1 ? 6 : strikes == 2 ? -4 : 2;
			case 21 -> strikes > indicators ? 2 : bomb.isIndicatorLit("CLR") ? -2 : aa == strikes ? 3 : 2;
			case 16 -> input.hour() >= 20 ? 9 : bomb.isIndicatorLit("SND") ? -15 : bomb.isIndicatorUnlit("CAR") ? 3 : 2;
			case 24 -> bomb.isIndicatorLit("SIG") ? 5 : bomb.isIndicatorUnlit("SIG") ? -1 : d == portCount(bomb, PortType.SERIAL) ? -6 : 4;
			case 13 -> bomb.isIndicatorLit("BOB") ? 21 : input.month() == 7 ? -5 : bomb.hasPort(PortType.PARALLEL) ? 1 : -3;
			case 9 -> bomb.isIndicatorUnlit("CLR") ? 1 : bomb.hasPort(PortType.STEREO_RCA) ? -9 : input.month() == 10 ? 5 : 5;
			case 25 -> input.underFiveMinutes() ? -3 : bomb.isIndicatorUnlit("NSA") ? -1 : input.dayOfWeek() == 7 ? 4 : 4;
			case 2 -> input.dayOfWeek() == 3 ? 3 : hasModule(bomb, ModuleType.LEGOS) ? -2 : aa > 2 ? 2 : -5;
			case 8 -> bomb.serialHasCharacter('Q') ? 6 : bomb.hasPort(PortType.SERIAL) ? -1 : d == aa ? -2 : -5;
			case 26 -> bomb.isIndicatorLit("TRN") ? 1 : bomb.hasPort(PortType.PS2) ? -2 : input.day() == 25 && input.month() == 12 ? 5 : 1;
			case 18 -> bomb.isIndicatorUnlit("BOB") ? 3 : input.month() == 4 ? 2 : input.dayOfWeek() == 6 ? 1 : -2;
			default -> throw new IllegalArgumentException("Unknown combination " + base);
		};
	}

	private static String color(String value) { return value == null ? "" : value.trim().toUpperCase(Locale.ROOT); }
	private static int colorCode(String color) { return MANOMETER_COLORS.indexOf(color); }
	private static int combination(int bottomLeft, int top, int bottomRight) {
		for (int i = 0; i < COMBINATIONS.length; i++)
			if (COMBINATIONS[i][0] == bottomLeft && COMBINATIONS[i][1] == top && COMBINATIONS[i][2] == bottomRight) return i;
		throw new IllegalArgumentException("Unknown color combination");
	}
	private static int portCount(BombEntity bomb) { return bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum(); }
	private static int portCount(BombEntity bomb, PortType type) { return (int) bomb.getPortPlates().stream().map(PortPlateEntity::getPorts).filter(ports -> ports.contains(type)).count(); }
	private static boolean hasModule(BombEntity bomb, ModuleType type) { return bomb.getModules().stream().anyMatch(module -> module.getType() == type); }
}
