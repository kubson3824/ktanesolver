package ktanesolver.module.modded.regular.calendar;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;

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
	type = ModuleType.CALENDAR,
	id = "calendar",
	name = "Calendar",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Use the activation date, LED, holiday, and serial number to find the target calendar date.",
	tags = {"dates", "holidays", "edgework", "calendar"}
)
public class CalendarSolver extends AbstractModuleSolver<CalendarInput, CalendarOutput> {
	private static final Map<String, int[]> MONTHS = Map.of(
		"GREEN", new int[] {1, 11, 8, 6, 3, 12, 2, 7, 9, 5, 10, 4},
		"YELLOW", new int[] {12, 6, 4, 10, 5, 2, 8, 11, 3, 7, 1, 9},
		"RED", new int[] {2, 7, 10, 1, 9, 8, 12, 4, 7, 3, 11, 6},
		"BLUE", new int[] {5, 3, 9, 4, 7, 11, 6, 10, 1, 12, 8, 2}
	);
	private static final Map<String, String[]> HOLIDAYS = Map.ofEntries(
		row("Christmas Eve", "12", "2", "11", "7", "18", "24", "4", "14", "10", "20"),
		row("Day of the Dead", "4", "16", "21", "15", "27", "6", "25", "13", "2", "9"),
		row("Bastille Day", "22", "14", "6", "11", "8", "19", "31/7", "23", "28", "26"),
		row("Golden Week", "8", "20", "17", "16", "23", "16", "1", "22", "24", "5"),
		row("Australia Day", "19", "5", "24", "3", "29/1", "28", "18", "30/4", "13", "12"),
		row("Republic Day", "10", "29/2", "12", "24", "15", "20", "5", "27", "25", "7"),
		row("Epiphany", "15", "1", "31/7", "17", "26", "30/8", "24", "9", "3", "25"),
		row("Earth Day", "23", "13", "25", "30/3", "4", "11", "27", "15", "21", "31/5"),
		row("Day of German Unity", "4", "27", "8", "22", "10", "14", "13", "28", "13", "21"),
		row("Cinco de Mayo", "29/3", "19", "27", "15", "9", "16", "19", "14", "9", "3"),
		row("Veterans Day", "14", "7", "23", "17", "5", "31/1", "2", "25", "17", "11"),
		row("Guy Fawkes Night", "26", "16", "3", "26", "29/7", "18", "22", "25", "17", "11"),
		row("Saint Patrick’s Day", "2", "28", "18", "13", "21", "12", "3", "10", "20", "1"),
		row("World Braille Day", "17", "24", "15", "20", "1", "30/9", "28", "6", "7", "14"),
		row("Kwanzaa", "21", "9", "30/6", "24", "28", "6", "21", "26", "31/2", "8"),
		row("Valentine’s Day", "11", "6", "22", "14", "19", "27", "20", "7", "16", "23"),
		row("April Fools’", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10")
	);
	private static final List<String> HOLIDAY_NAMES = List.of(
		"Christmas Eve", "Day of the Dead", "Bastille Day", "Golden Week", "Australia Day", "Republic Day",
		"Epiphany", "Earth Day", "Day of German Unity", "Cinco de Mayo", "Veterans Day", "Guy Fawkes Night",
		"Saint Patrick’s Day", "World Braille Day", "Kwanzaa", "Valentine’s Day", "April Fools’", "Groundhog Day"
	);

	@Override
	protected SolveResult<CalendarOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, CalendarInput input
	) {
		if (input == null || input.activationMonth() == null || input.activationDay() == null
			|| input.ledColor() == null || input.holiday() == null || input.leapYear() == null) {
			return failure("Enter the activation date, LED color, holiday, and leap-year status");
		}
		if (input.activationMonth() < 1 || input.activationMonth() > 12
			|| input.activationDay() < 1 || input.activationDay() > daysInMonth(input.activationMonth(), input.leapYear())) {
			return failure("Enter a valid activation date");
		}
		String color = input.ledColor().trim().toUpperCase(Locale.ROOT);
		if (!MONTHS.containsKey(color)) return failure("LED color must be green, yellow, red, or blue");
		String holiday = canonicalHoliday(input.holiday());
		if (holiday == null) return failure("Select one of the 18 holidays from the manual");
		int[] serialDigits = bomb.getSerialNumber() == null ? new int[0]
			: bomb.getSerialNumber().chars().filter(Character::isDigit).map(character -> character - '0').toArray();
		if (serialDigits.length == 0) return failure("The bomb serial number must contain a digit");

		int targetMonth = targetMonth(input.activationMonth(), input.activationDay(), color);
		int pressCount = holiday.equals("Groundhog Day") ? 3 : 1;
		int targetDay;
		if (pressCount == 3) {
			targetDay = 1;
		} else {
			int serialDigit = holiday.equals("April Fools’") ? serialDigits[0] : serialDigits[serialDigits.length - 1];
			targetDay = targetDay(HOLIDAYS.get(holiday)[serialDigit], targetMonth, input.leapYear());
		}

		storeState(module, Map.of(
			"holiday", holiday,
			"souvenirHoliday", holiday,
			"souvenirEligible", !holidayOccursInMonth(holiday, targetMonth),
			"targetMonth", targetMonth,
			"input", new CalendarInput(input.activationMonth(), input.activationDay(), color, holiday, input.leapYear())
		));
		return success(new CalendarOutput(targetMonth, targetDay, pressCount, holiday));
	}

	private static Map.Entry<String, String[]> row(String holiday, String... days) {
		return Map.entry(holiday, days);
	}

	private static String canonicalHoliday(String input) {
		String normalized = input.trim().replace('’', '\'');
		if (normalized.equalsIgnoreCase("April Fools' Day")) normalized = "April Fools'";
		String value = normalized;
		return HOLIDAY_NAMES.stream()
			.filter(name -> name.replace('’', '\'').equalsIgnoreCase(value))
			.findFirst().orElse(null);
	}

	private static int targetMonth(int month, int day, String color) {
		int date = month * 100 + day;
		int season = date >= 322 && date <= 621 ? 0
			: date >= 622 && date <= 921 ? 1
			: date >= 922 && date <= 1221 ? 2 : 3;
		int bucket = day <= 10 ? 0 : day <= 20 ? 1 : 2;
		return MONTHS.get(color)[season * 3 + bucket];
	}

	private static int targetDay(String entry, int targetMonth, boolean leapYear) {
		int[] choices = Arrays.stream(entry.split("/")).mapToInt(Integer::parseInt).toArray();
		return choices.length == 1 || choices[0] <= daysInMonth(targetMonth, leapYear) ? choices[0] : choices[1];
	}

	private static boolean holidayOccursInMonth(String holiday, int month) {
		return switch (holiday) {
			case "April Fools’", "Earth Day" -> month == 4;
			case "Australia Day", "Epiphany", "World Braille Day" -> month == 1;
			case "Bastille Day" -> month == 7;
			case "Christmas Eve" -> month == 12;
			case "Cinco de Mayo" -> month == 5;
			case "Day of German Unity", "Day of the Dead" -> month == 10;
			case "Golden Week" -> month == 4 || month == 5;
			case "Groundhog Day", "Valentine’s Day" -> month == 2;
			case "Guy Fawkes Night", "Veterans Day" -> month == 11;
			case "Kwanzaa" -> month == 12 || month == 1;
			case "Republic Day" -> month == 6;
			case "Saint Patrick’s Day" -> month == 3;
			default -> false;
		};
	}

	private static int daysInMonth(int month, boolean leapYear) {
		return switch (month) {
			case 2 -> leapYear ? 29 : 28;
			case 4, 6, 9, 11 -> 30;
			default -> 31;
		};
	}
}
