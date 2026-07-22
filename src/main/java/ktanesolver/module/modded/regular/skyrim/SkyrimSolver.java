package ktanesolver.module.modded.regular.skyrim;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
	type = ModuleType.SKYRIM,
	id = "skyrim",
	name = "Skyrim",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Choose the correct race, weapon, enemy, home city, and dragon shout.",
	tags = {"selection", "tables", "map", "Souvenir"}
)
public class SkyrimSolver extends AbstractModuleSolver<SkyrimInput, SkyrimOutput> {
	private static final List<String> RACES = List.of(
		"Nord", "Khajiit", "Breton", "Argonian", "Dunmer", "Altmer", "Redguard", "Orc", "Imperial");
	private static final List<String> WEAPONS = List.of(
		"Axe of Whiterun", "Blade of Woe", "Bow of the Hunt", "Chillrend", "Dawnbreaker",
		"Firiniel's End", "Mace of Molag Bal", "Volendrung", "Windshear");
	private static final List<String> ENEMIES = List.of(
		"Alduin", "Blood Dragon", "Cave Bear", "Dragon Priest", "Draugr", "Draugr Overlord",
		"Frost Troll", "Frostbite Spider", "Mudcrab");
	private static final List<String> CITIES = List.of(
		"Solitude", "Dawnstar", "Winterhold", "Windhelm", "Ivarstead", "Riverwood", "Whiterun", "Rorikstead", "Markarth");
	private static final List<String> SHOUTS = List.of(
		"Unrelenting Force", "Disarm", "Ice Form", "Whirlwind Sprint", "Dragonrend", "Dismay", "Fire Breath", "Kyne's Peace", "Slow Time");
	private static final Map<String, String> DRAGON_LANGUAGE = Map.ofEntries(
		Map.entry("Unrelenting Force", "fus ro dah"), Map.entry("Disarm", "zun hal vik"),
		Map.entry("Ice Form", "liz slen nus"), Map.entry("Whirlwind Sprint", "wuld nah kest"),
		Map.entry("Dragonrend", "jor zah frul"), Map.entry("Dismay", "fas ru mar"),
		Map.entry("Fire Breath", "yol tor shul"), Map.entry("Kyne's Peace", "kan drem ov"),
		Map.entry("Slow Time", "tid klo ul"));

	private static final List<List<String>> RACE_ORDERS = List.of(
		RACES,
		List.of("Imperial", "Orc", "Redguard", "Altmer", "Dunmer", "Argonian", "Breton", "Khajiit", "Nord"),
		List.of("Dunmer", "Orc", "Nord", "Altmer", "Khajiit", "Breton", "Redguard", "Imperial", "Argonian"));
	private static final List<List<String>> WEAPON_ORDERS = List.of(
		List.of("Axe of Whiterun", "Dawnbreaker", "Windshear", "Blade of Woe", "Firiniel's End", "Bow of the Hunt", "Volendrung", "Chillrend", "Mace of Molag Bal"),
		List.of("Blade of Woe", "Volendrung", "Mace of Molag Bal", "Axe of Whiterun", "Bow of the Hunt", "Chillrend", "Dawnbreaker", "Firiniel's End", "Windshear"),
		List.of("Chillrend", "Bow of the Hunt", "Dawnbreaker", "Volendrung", "Windshear", "Firiniel's End", "Axe of Whiterun", "Mace of Molag Bal", "Blade of Woe"),
		List.of("Mace of Molag Bal", "Firiniel's End", "Volendrung", "Windshear", "Axe of Whiterun", "Blade of Woe", "Dawnbreaker", "Bow of the Hunt", "Chillrend"));
	private static final List<List<String>> ENEMY_ORDERS = List.of(
		List.of("Dragon Priest", "Alduin", "Mudcrab", "Draugr Overlord", "Draugr", "Blood Dragon", "Frostbite Spider", "Frost Troll", "Cave Bear"),
		List.of("Frost Troll", "Mudcrab", "Frostbite Spider", "Draugr Overlord", "Draugr", "Dragon Priest", "Cave Bear", "Blood Dragon", "Alduin"),
		List.of("Draugr Overlord", "Cave Bear", "Blood Dragon", "Mudcrab", "Draugr", "Dragon Priest", "Alduin", "Frostbite Spider", "Frost Troll"),
		List.of("Cave Bear", "Frost Troll", "Frostbite Spider", "Blood Dragon", "Draugr", "Draugr Overlord", "Mudcrab", "Alduin", "Dragon Priest"),
		List.of("Blood Dragon", "Mudcrab", "Frostbite Spider", "Alduin", "Frost Troll", "Draugr Overlord", "Dragon Priest", "Cave Bear", "Draugr"));
	private static final Map<String, List<String>> STARTING_CITIES = Map.of(
		"Nord", List.of("Windhelm", "Whiterun"), "Khajiit", List.of("Rorikstead", "Ivarstead"),
		"Breton", List.of("Riverwood", "Dawnstar"), "Argonian", List.of("Dawnstar", "Markarth"),
		"Dunmer", List.of("Rorikstead", "Solitude"), "Altmer", List.of("Solitude", "Riverwood"),
		"Redguard", List.of("Markarth", "Windhelm"), "Orc", List.of("Ivarstead", "Winterhold"),
		"Imperial", List.of("Winterhold", "Rorikstead"));
	private static final List<Map<String, String>> SHOUT_STARTS = List.of(
		mapByShout(List.of("Draugr Overlord", "Frost Troll", "Blood Dragon", "Frostbite Spider", "Dragon Priest", "Mudcrab", "Cave Bear", "Draugr", "Alduin")),
		mapByShout(List.of("Draugr", "Dragon Priest", "Mudcrab", "Frost Troll", "Alduin", "Draugr Overlord", "Blood Dragon", "Cave Bear", "Frostbite Spider")),
		mapByShout(List.of("Alduin", "Mudcrab", "Cave Bear", "Draugr Overlord", "Blood Dragon", "Draugr", "Frostbite Spider", "Dragon Priest", "Frost Troll")));

	@Override
	protected SolveResult<SkyrimOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, SkyrimInput input
	) {
		if(input == null || !valid(input.races(), RACES) || !valid(input.weapons(), WEAPONS)
			|| !valid(input.enemies(), ENEMIES) || !valid(input.cities(), CITIES) || !valid(input.dragonShouts(), SHOUTS)) {
			return failure("Select exactly three different races, weapons, enemies, cities, and dragon shouts");
		}
		String serial = bomb.getSerialNumber();
		if(serial == null || serial.isBlank() || !Character.isLetterOrDigit(serial.charAt(0))) return failure("Enter a valid serial number");

		int batteries = bomb.getBatteryCount();
		String race = highest(input.races(), RACE_ORDERS.get(batteries < 3 ? 0 : batteries < 6 ? 1 : 2));
		int weaponColumn = input.races().contains("Breton") && !race.equals("Breton") ? 0
			: input.races().contains("Orc") && !race.equals("Orc") ? 1 : race.equals("Redguard") ? 2 : 3;
		String weapon = highest(input.weapons(), WEAPON_ORDERS.get(weaponColumn));
		int enemyColumn = List.of("Bow of the Hunt", "Firiniel's End").contains(weapon) ? 0
			: List.of("Volendrung", "Dawnbreaker", "Mace of Molag Bal").contains(weapon) ? 1
			: List.of("Windshear", "Chillrend").contains(weapon) ? 2 : weapon.equals("Axe of Whiterun") ? 3 : 4;
		String enemy = highest(input.enemies(), ENEMY_ORDERS.get(enemyColumn));

		boolean cityException = switch(race) {
			case "Nord" -> input.races().contains("Argonian");
			case "Khajiit" -> input.enemies().contains("Frost Troll");
			case "Breton" -> weapon.equals("Blade of Woe");
			case "Argonian" -> enemy.equals("Draugr Overlord");
			case "Dunmer" -> input.enemies().contains("Mudcrab");
			case "Altmer" -> weapon.equals("Windshear");
			case "Redguard" -> input.weapons().stream().noneMatch(List.of("Dawnbreaker", "Volendrung", "Mace of Molag Bal")::contains);
			case "Orc" -> enemy.equals("Cave Bear");
			case "Imperial" -> input.weapons().contains("Volendrung");
			default -> false;
		};
		String city = clockwise(input.cities(), CITIES, STARTING_CITIES.get(race).get(cityException ? 1 : 0));

		char first = serial.charAt(0);
		int serialColumn = Character.isLetter(first) ? 0 : Character.digit(first, 10) % 2 == 1 ? 1 : 2;
		String dragonShout = clockwise(input.dragonShouts(), SHOUTS, SHOUT_STARTS.get(serialColumn).get(enemy));
		List<String> souvenirWeapons = input.weapons().stream().map(value -> value.replace("'", "’")).toList();
		List<String> souvenirShouts = input.dragonShouts().stream().map(DRAGON_LANGUAGE::get).toList();
		storeState(module, Map.ofEntries(
			Map.entry("races", input.races()), Map.entry("weapons", souvenirWeapons), Map.entry("enemies", input.enemies()),
			Map.entry("cities", input.cities()), Map.entry("dragonShouts", souvenirShouts),
			Map.entry("correctRace", race), Map.entry("correctWeapon", weapon.replace("'", "’")),
			Map.entry("correctEnemy", enemy), Map.entry("correctCity", city),
			Map.entry("correctDragonShout", DRAGON_LANGUAGE.get(dragonShout))));
		return success(new SkyrimOutput(race, weapon, enemy, city, dragonShout));
	}

	private static boolean valid(List<String> values, List<String> allowed) {
		return values != null && values.size() == 3 && new HashSet<>(values).size() == 3 && allowed.containsAll(values);
	}

	private static String highest(List<String> options, List<String> order) {
		return order.stream().filter(options::contains).findFirst().orElseThrow();
	}

	private static String clockwise(List<String> options, List<String> wheel, String start) {
		int startIndex = wheel.indexOf(start);
		for(int offset = 0; offset < wheel.size(); offset++) {
			String candidate = wheel.get((startIndex + offset) % wheel.size());
			if(options.contains(candidate)) return candidate;
		}
		throw new IllegalStateException("No displayed option");
	}

	private static Map<String, String> mapByShout(List<String> enemiesByShout) {
		return java.util.stream.IntStream.range(0, SHOUTS.size()).boxed()
			.collect(Collectors.toUnmodifiableMap(enemiesByShout::get, SHOUTS::get));
	}
}
