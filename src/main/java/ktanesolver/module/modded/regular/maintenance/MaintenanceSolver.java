package ktanesolver.module.modded.regular.maintenance;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
	type = ModuleType.MAINTENANCE,
	id = "maintenance",
	name = "Maintenance",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Determine the required car repairs and their order from the number plate and job count.",
	tags = { "modded", "car", "number plate", "ordering" }
)
public class MaintenanceSolver extends AbstractModuleSolver<MaintenanceInput, MaintenanceOutput> {
	private static final Pattern PLATE = Pattern.compile("([A-HJ-NP-RT-Y]{2})(\\d{2})([A-HJ-NP-RT-Y]{3})");
	private static final Map<String, CarModel> MODELS = Map.of(
		"HN", new CarModel("Honda", 2), "RN", new CarModel("Renault", 3),
		"FD", new CarModel("Ford", 4), "MA", new CarModel("Mazda", 5),
		"BM", new CarModel("BMW", 6), "AD", new CarModel("Audi", 7),
		"BN", new CarModel("Mercedes-Benz", 8), "PC", new CarModel("Porsche", 9),
		"FR", new CarModel("Ferrari", 10));
	private static final Map<Integer, Integer> BASE_VALUES = Map.ofEntries(
		Map.entry(2001, 50), Map.entry(2002, 60), Map.entry(2003, 70), Map.entry(2004, 80),
		Map.entry(2005, 90), Map.entry(2006, 100), Map.entry(2007, 125), Map.entry(2008, 150),
		Map.entry(2009, 175), Map.entry(2010, 200), Map.entry(2011, 250), Map.entry(2012, 300),
		Map.entry(2013, 400), Map.entry(2014, 500), Map.entry(2015, 600), Map.entry(2016, 700),
		Map.entry(2017, 800), Map.entry(2018, 900), Map.entry(2019, 1000));
	private static final Map<String, List<String>> JOBS = Map.ofEntries(
		jobs("A", "Brake fluid change", "Wash", "Two tyres", "Exhaust welding"),
		jobs("B", "Headlight bulb", "Head gasket replacement", "Windscreen replacement", "Four tyres"),
		jobs("C", "Wiper replacement", "Headlight bulb", "Wash", "Windscreen chip"),
		jobs("D", "Oil change", "Four tyres", "Windscreen chip", "Wash"),
		jobs("E", "Windscreen chip", "Oil change", "Four tyres", "Headlight bulb"),
		jobs("F", "Windscreen replacement", "Oil change", "Brake fluid change", "Head gasket replacement"),
		jobs("G", "Wash", "One tyre", "Wiper replacement", "Windscreen chip"),
		jobs("H", "Head gasket replacement", "Brake fluid change", "Wiper replacement", "Windscreen replacement"),
		jobs("I", "Wash", "One tyre", "Windscreen chip", "Exhaust welding"),
		jobs("J", "One tyre", "Exhaust welding", "Wash", "Headlight bulb"),
		jobs("K", "Wash", "Four tyres", "Exhaust welding", "Head gasket replacement"),
		jobs("L", "One tyre", "Wiper replacement", "Brake fluid change", "Windscreen replacement"),
		jobs("M", "Headlight bulb", "Two tyres", "Exhaust welding", "Wiper replacement"),
		jobs("N", "Wash", "Headlight bulb", "Wiper replacement", "Oil change"),
		jobs("O", "Exhaust welding", "Two tyres", "Headlight bulb", "Brake fluid change"),
		jobs("P", "Windscreen replacement", "One tyre", "Brake fluid change", "Wiper replacement"));
	private static final List<String> JOB_ORDER = List.of(
		"Windscreen chip", "Brake fluid change", "Headlight bulb", "Wiper replacement",
		"Windscreen replacement", "Exhaust welding", "Head gasket replacement",
		"One tyre", "Two tyres", "Four tyres", "Oil change", "Wash");
	private static final Map<String, Integer> PRICES = Map.ofEntries(
		price("Wash", 3), price("Headlight bulb", 6), price("Wiper replacement", 10),
		price("Oil change", 15), price("Brake fluid change", 25), price("Windscreen chip", 40),
		price("One tyre", 80), price("Windscreen replacement", 150), price("Two tyres", 160),
		price("Four tyres", 320), price("Exhaust welding", 500), price("Head gasket replacement", 750));
	private static final Map<String, Set<String>> COVERED = Map.of(
		"Admiral", Set.of("Brake fluid change"),
		"Swift", Set.of("Oil change", "One tyre"),
		"Axa", Set.of("Windscreen chip"),
		"Swinton", Set.of("Windscreen chip"),
		"Aviva", Set.of("One tyre", "Two tyres"),
		"RAC", Set.of("Windscreen chip", "Windscreen replacement"),
		"AA", Set.of("Oil change", "Windscreen chip", "Brake fluid change"),
		"Hastings Direct", Set.of("Oil change"));
	private static final String[] VENN_LETTERS = {
		"A", "B", "C", "F", "J", "M", "E", "H", "I", "D", "L", "G", "P", "O", "N", "K"
	};

	@Override
	protected SolveResult<MaintenanceOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, MaintenanceInput input
	) {
		if (input == null || input.numberPlate() == null) return failure("Enter the displayed number plate");
		if (input.numberOfJobs() == null || input.numberOfJobs() < 2 || input.numberOfJobs() > 4) {
			return failure("The memo must show 2, 3, or 4 jobs");
		}

		String plate = input.numberPlate().replaceAll("\\s", "").toUpperCase(Locale.ROOT);
		Matcher match = PLATE.matcher(plate);
		if (!match.matches()) return failure("Enter a valid UK plate in the format AB12 CDE");

		CarModel model = MODELS.get(match.group(1));
		if (model == null) return failure("Unknown Maintenance car model code: " + match.group(1));
		int dateCode = Integer.parseInt(match.group(2));
		boolean september = dateCode >= 51 && dateCode <= 69;
		int year = september ? 1950 + dateCode : 2000 + dateCode;
		if ((!september && (dateCode < 2 || dateCode > 19)) || !BASE_VALUES.containsKey(year)) {
			return failure("The plate date must be from March 2002 through September 2019, or September 2001");
		}

		String insurer = insurance(plate.charAt(plate.length() - 1));
		boolean heavyModel = Set.of("Mercedes-Benz", "Porsche", "Ferrari").contains(model.name());
		int vennMask = (insurer.startsWith("A") ? 8 : 0) + (september ? 4 : 0)
			+ (plate.indexOf('M') >= 0 ? 2 : 0) + (heavyModel ? 1 : 0);
		String vennLetter = VENN_LETTERS[vennMask];

		List<String> required = new ArrayList<>(JOBS.get(vennLetter).subList(0, input.numberOfJobs()));
		int uncoveredCost = required.stream()
			.filter(job -> !COVERED.get(insurer).contains(job))
			.mapToInt(PRICES::get)
			.sum();
		int carValue = BASE_VALUES.get(year) * model.multiplier();
		boolean writeOff = model.name().equals("Honda") && year < 2004 || uncoveredCost > carValue;
		required.sort((left, right) -> Integer.compare(JOB_ORDER.indexOf(left), JOB_ORDER.indexOf(right)));

		return success(new MaintenanceOutput(
			match.group(1) + match.group(2) + " " + match.group(3),
			model.name(), (september ? "September " : "March ") + year, insurer, vennLetter,
			carValue, uncoveredCost, writeOff, writeOff ? List.of("Write-off") : List.copyOf(required)));
	}

	private static String insurance(char lastLetter) {
		return switch (lastLetter) {
			case 'A', 'B', 'C' -> "Admiral";
			case 'D', 'E', 'F' -> "Swift";
			case 'G', 'H', 'J' -> "Axa";
			case 'K', 'L', 'M' -> "Swinton";
			case 'N', 'P', 'R' -> "Aviva";
			case 'S', 'T', 'U' -> "RAC";
			case 'V', 'W' -> "AA";
			case 'X', 'Y' -> "Hastings Direct";
			default -> throw new IllegalArgumentException("Invalid UK number plate letter");
		};
	}

	private static Map.Entry<String, List<String>> jobs(String letter, String... values) {
		return Map.entry(letter, List.of(values));
	}

	private static Map.Entry<String, Integer> price(String job, int value) {
		return Map.entry(job, value);
	}

	private record CarModel(String name, int multiplier) {
	}
}
