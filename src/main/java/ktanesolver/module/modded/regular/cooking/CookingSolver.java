package ktanesolver.module.modded.regular.cooking;

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
	type = ModuleType.COOKING,
	id = "cooking",
	name = "Cooking",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Derive the meal, oven settings, lamp state, and cooking time from the bomb edgework.",
	tags = { "cooking", "edgework", "oven", "modded" },
	hasInput = false,
	hasOutput = true
)
public class CookingSolver extends AbstractModuleSolver<CookingInput, CookingOutput> {
	private static final String[] MEALS = {
		"Pizza", "Spaghetti Bolognese", "Chicken Casserole", "Chilli Con Carne", "Chicken Pie"
	};
	private static final int[] TEMPERATURES = { 250, 160, 200, 180, 180 };
	private static final String[] SETTINGS = {
		"BOTTOM_ELEMENT_HEAT", "BOTTOM_ELEMENT_HEAT_WITH_GRILL", "CONVENTIONAL_HEATING",
		"FAN_OVEN", "GRILL", "FAN_WITH_GRILL"
	};
	private static final String[] PEOPLE = { "James", "Bob", "Markus", "Erik", "Harry", "Tom" };
	private static final int[][] TIMES = {
		{ 10, 15, 20, 5, 30, 50 },
		{ 75, 70, 80, 75, 65, 10 },
		{ 55, 70, 65, 50, 45, 60 },
		{ 95, 90, 75, 85, 70, 35 },
		{ 25, 30, 35, 20, 40, 10 }
	};

	@Override
	protected SolveResult<CookingOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, CookingInput input
	) {
		String serial = bomb.getSerialNumber();
		if (serial == null || !serial.matches("[A-Za-z0-9]{6}"))
			return failure("Enter a valid six-character serial number");

		int litIndicators = Math.toIntExact(BombEdgeworkUtils.getLitIndicatorCount(bomb));
		int unlitIndicators = Math.toIntExact(BombEdgeworkUtils.getUnlitIndicatorCount(bomb));
		int mealIndex = Math.floorMod(
			bomb.getBatteryHolders() - bomb.getIndicators().size()
				+ bomb.getBatteryCount() * BombEdgeworkUtils.getTotalPortCount(bomb)
				- bomb.getPortPlates().size() - 1,
			MEALS.length
		);
		int settingIndex = Math.floorMod(
			litIndicators - unlitIndicators + (int) serial.chars().filter(Character::isLetter).count() - 1,
			SETTINGS.length
		);
		int personIndex = personIndex(bomb, serial);

		return success(new CookingOutput(
			MEALS[mealIndex],
			TEMPERATURES[mealIndex],
			SETTINGS[settingIndex],
			serial.toUpperCase(Locale.ROOT).chars().anyMatch(character -> "AEIOUY".indexOf(character) >= 0)
				|| bomb.hasPort(PortType.PS2),
			PEOPLE[personIndex],
			TIMES[mealIndex][personIndex]
		));
	}

	private static int personIndex(BombEntity bomb, String serial) {
		if (bomb.isIndicatorLit("FRK") || bomb.hasPort(PortType.SERIAL)) return 4;
		if (BombEdgeworkUtils.hasEmptyPortPlate(bomb) || bomb.isIndicatorLit("FRQ")) return 0;

		long letters = serial.chars().filter(Character::isLetter).count();
		long digits = serial.chars().filter(Character::isDigit).count();
		if (digits > letters || bomb.isIndicatorUnlit("SND")) return 5;
		if (bomb.hasPort(PortType.HDMI) || bomb.hasPort(PortType.COMPOSITE_VIDEO) || bomb.hasPort(PortType.USB))
			return 3;
		if (bomb.hasIndicator("BOB")) return 1;
		return 2;
	}
}
