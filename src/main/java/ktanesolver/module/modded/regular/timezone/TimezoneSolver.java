package ktanesolver.module.modded.regular.timezone;

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
	type = ModuleType.TIMEZONE,
	id = "timezone",
	name = "Timezone",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Convert an analog time from one fixed city timezone to another.",
	tags = {"clock", "timezones", "conversion", "Souvenir", "modded"}
)
public class TimezoneSolver extends AbstractModuleSolver<TimezoneInput, TimezoneOutput> {
	private static final Map<String, Integer> OFFSETS = Map.ofEntries(
		Map.entry("Alofi", -11),
		Map.entry("Papeete", -10),
		Map.entry("Unalaska", -9),
		Map.entry("Whitehorse", -8),
		Map.entry("Denver", -7),
		Map.entry("Managua", -6),
		Map.entry("Quito", -5),
		Map.entry("Manaus", -4),
		Map.entry("Buenos Aires", -3),
		Map.entry("Sao Paulo", -2),
		Map.entry("Praia", -1),
		Map.entry("Edinburgh", 0),
		Map.entry("Berlin", 1),
		Map.entry("Bujumbura", 2),
		Map.entry("Moscow", 3),
		Map.entry("Tbilisi", 4),
		Map.entry("Lahore", 5),
		Map.entry("Omsk", 6),
		Map.entry("Bangkok", 7),
		Map.entry("Beijing", 8),
		Map.entry("Tokyo", 9),
		Map.entry("Brisbane", 10),
		Map.entry("Sydney", 11),
		Map.entry("Tarawa", 12)
	);

	@Override
	protected SolveResult<TimezoneOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, TimezoneInput input
	) {
		if (input == null) return failure("Enter the displayed time and cities");
		if (input.departureCity() == null || input.destinationCity() == null
			|| !OFFSETS.containsKey(input.departureCity()) || !OFFSETS.containsKey(input.destinationCity())) {
			return failure("Select exact cities from the manual");
		}
		if (input.departureCity().equals(input.destinationCity())) return failure("Cities must be different");
		if (input.hour() == null || input.hour() < 1 || input.hour() > 12) {
			return failure("Hour must be between 1 and 12");
		}
		if (input.minute() == null || input.minute() < 0 || input.minute() > 55 || input.minute() % 5 != 0) {
			return failure("Minute must be between 00 and 55 in steps of 5");
		}
		if (!"AM".equals(input.period()) && !"PM".equals(input.period())) return failure("Select AM or PM");
		if (input.twelveHour() == null) return failure("Select 12- or 24-hour output");

		int sourceHour = input.hour() % 12 + (input.period().equals("PM") ? 12 : 0);
		int convertedHour = Math.floorMod(
			sourceHour - OFFSETS.get(input.departureCity()) + OFFSETS.get(input.destinationCity()),
			24
		);
		int submittedHour = input.twelveHour()
			? convertedHour % 12 == 0 ? 12 : convertedHour % 12
			: convertedHour;

		storeState(module, "input", input);
		return success(new TimezoneOutput("%02d%02d".formatted(submittedHour, input.minute())));
	}
}
