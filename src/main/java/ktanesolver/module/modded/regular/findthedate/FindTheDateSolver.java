package ktanesolver.module.modded.regular.findthedate;

import java.util.ArrayList;
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
	type = ModuleType.FIND_THE_DATE,
	id = "DateFinder",
	name = "Find The Date",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Use the module's simplified calendar tables to solve three displayed dates.",
	tags = {"dates", "calendar", "multi-stage", "souvenir"}
)
public class FindTheDateSolver extends AbstractModuleSolver<FindTheDateInput, FindTheDateOutput> {
	private static final String[] MONTHS = {"JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"};
	private static final int[] MONTH_GROUP = {1,4,4,7,2,5,7,3,6,1,4,6};
	private static final String[] WEEKDAYS = {"Saturday","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday"};
	private static final Map<Integer, Integer> CENTURY_GROUP = Map.ofEntries(
		Map.entry(0,7),Map.entry(7,7),Map.entry(14,7),Map.entry(17,7),Map.entry(21,7),Map.entry(25,7),
		Map.entry(1,6),Map.entry(8,6),Map.entry(15,6),Map.entry(2,5),Map.entry(9,5),Map.entry(18,5),Map.entry(22,5),Map.entry(26,5),
		Map.entry(3,4),Map.entry(10,4),Map.entry(4,3),Map.entry(11,3),Map.entry(19,3),Map.entry(23,3),Map.entry(27,3),
		Map.entry(5,2),Map.entry(12,2),Map.entry(16,2),Map.entry(20,2),Map.entry(24,2),Map.entry(28,2),Map.entry(6,1),Map.entry(13,1));
	private static final int[][] YEAR_GROUPS = {
		{0,6,17,23,28,34,45,51,56,62,73,79,84,90}, {1,7,12,18,29,35,40,46,57,63,68,74,85,91,96},
		{2,13,19,24,30,41,47,52,58,69,75,80,86,97}, {3,8,14,25,31,36,42,53,59,64,70,81,87,92,98},
		{9,15,20,26,37,43,48,54,65,71,76,82,93,99}, {4,10,21,27,32,38,49,55,60,66,77,83,88,94},
		{5,11,16,22,33,39,44,50,61,67,72,78,89,95}
	};

	@Override
	protected SolveResult<FindTheDateOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, FindTheDateInput input) {
		if (input == null || input.month() == null || input.day() < 1 || input.day() > 30 || input.year() < 0 || input.year() > 2899) return failure("Enter the displayed day, month, and three- or four-digit year");
		String month = input.month().trim().toUpperCase(Locale.ROOT); int monthIndex = indexOf(MONTHS, month);
		if (monthIndex < 0) return failure("The displayed month is invalid");
		int century = input.year() / 100, year = input.year() % 100;
		Integer centuryGroup = CENTURY_GROUP.get(century); if (centuryGroup == null) return failure("The displayed year must be from 000 through 2899");
		int yearGroup = yearGroup(year);
		int dayMonth = (input.day() + 6) % 7 + MONTH_GROUP[monthIndex]; if (dayMonth > 7) dayMonth -= 7;
		int yearCentury = centuryGroup + yearGroup; if (yearCentury > 7) yearCentury -= 7;
		int weekday = dayMonth + yearCentury - 2; if (weekday > 6) weekday -= 7; if (weekday == -1) weekday = 6;
		int stage = module.getState().get("findTheDateNextStage") instanceof Number value ? value.intValue() : 1;
		if (stage < 1 || stage > 3) return failure("The saved Find The Date stage is invalid");
		List<Map<String, Object>> history = new ArrayList<>(); Object saved = module.getState().get("findTheDateDates");
		if (saved instanceof List<?> list) for (Object value : list) if (value instanceof Map<?, ?> map) history.add(Map.of("day", map.get("day"), "month", map.get("month"), "year", map.get("year")));
		while (history.size() < stage) history.add(Map.of());
		history.set(stage - 1, Map.of("day", input.day(), "month", MONTHS[monthIndex].substring(0,1) + MONTHS[monthIndex].substring(1).toLowerCase(Locale.ROOT), "year", String.format(Locale.ROOT, "%03d", input.year())));
		storeState(module, "findTheDateDates", List.copyOf(history)); storeState(module, "findTheDateNextStage", Math.min(3, stage + 1));
		FindTheDateOutput output = new FindTheDateOutput(stage, WEEKDAYS[weekday], Math.min(3, stage + 1));
		return stage == 3 ? success(output) : success(output, false);
	}
	private static int yearGroup(int year) { for (int group = 0; group < YEAR_GROUPS.length; group++) for (int value : YEAR_GROUPS[group]) if (value == year) return group; throw new IllegalArgumentException(); }
	private static int indexOf(String[] values, String value) { for (int i = 0; i < values.length; i++) if (values[i].equals(value)) return i; return -1; }
}
