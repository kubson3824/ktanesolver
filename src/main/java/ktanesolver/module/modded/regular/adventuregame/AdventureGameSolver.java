package ktanesolver.module.modded.regular.adventuregame;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

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
import org.springframework.stereotype.Service;

@Service
@ModuleInfo(
	type = ModuleType.ADVENTURE_GAME,
	id = "adventure_game",
	name = "Adventure Game",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Decide which items to use and which weapon to fight the enemy based on stats and bomb.",
	tags = { "modded", "adventure" }
)
public class AdventureGameSolver extends AbstractModuleSolver<AdventureGameInput, AdventureGameOutput> {

	private static final Set<String> ENEMIES = Set.of(
		"DEMON", "DRAGON", "EAGLE", "GOBLIN", "GOLEM", "TROLL", "LIZARD", "WIZARD"
	);

	private static final Map<String, int[]> ENEMY_STATS = Map.ofEntries(
		Map.entry("DEMON", new int[] { 50, 50, 50 }),
		Map.entry("DRAGON", new int[] { 10, 11, 13 }),
		Map.entry("EAGLE", new int[] { 4, 7, 3 }),
		Map.entry("GOBLIN", new int[] { 3, 6, 5 }),
		Map.entry("GOLEM", new int[] { 9, 4, 7 }),
		Map.entry("TROLL", new int[] { 8, 5, 4 }),
		Map.entry("LIZARD", new int[] { 4, 6, 3 }),
		Map.entry("WIZARD", new int[] { 4, 3, 8 })
	);

	private static final Set<String> WEAPON_NAMES = Set.of(
		"BROADSWORD", "CABER", "NASTY KNIFE", "LONGBOW", "MAGIC ORB", "GRIMOIRE"
	);

	private static final Map<String, WeaponStat> WEAPON_STATS = Map.ofEntries(
		Map.entry("BROADSWORD", new WeaponStat(0, 0)),   // STR, +0
		Map.entry("CABER", new WeaponStat(0, 2)),       // STR, +2
		Map.entry("NASTY KNIFE", new WeaponStat(1, 0)), // DEX, +0
		Map.entry("LONGBOW", new WeaponStat(1, 2)),     // DEX, +2
		Map.entry("MAGIC ORB", new WeaponStat(2, 0)),  // INT, +0
		Map.entry("GRIMOIRE", new WeaponStat(2, 2))     // INT, +2
	);

	private static final Set<String> MISC_ITEM_NAMES = Set.of(
		"BALLOON", "BATTERY", "BELLOWS", "CHEAT CODE", "CRYSTAL BALL", "FEATHER",
		"HARD DRIVE", "LAMP", "MOONSTONE", "POTION", "SMALL DOG", "STEPLADDER",
		"SUNSTONE", "SYMBOL", "TICKET", "TROPHY"
	);

	private static String norm(String s) {
		return s == null ? "" : s.trim().toUpperCase();
	}

	private static int getFirstNumericDigit(BombEntity bomb) {
		String serial = bomb.getSerialNumber();
		if (serial == null) return 0;
		for (int i = 0; i < serial.length(); i++) {
			char c = serial.charAt(i);
			if (Character.isDigit(c)) return c - '0';
		}
		return 0;
	}

	private static boolean hasTwoOrMoreOfSamePort(BombEntity bomb) {
		List<PortType> all = bomb.getPortPlates().stream()
			.flatMap(p -> p.getPorts().stream())
			.toList();
		return all.size() != all.stream().distinct().count();
	}

	private static long litIndicatorCount(BombEntity bomb) {
		return bomb.getIndicators().values().stream()
			.filter(Boolean::booleanValue)
			.count();
	}

	private static long unlitIndicatorCount(BombEntity bomb) {
		return bomb.getIndicators().values().stream()
			.filter(b -> !Boolean.TRUE.equals(b))
			.count();
	}

	@Override
	protected SolveResult<AdventureGameOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, AdventureGameInput input) {
		String enemy = norm(input.enemy());
		if (!ENEMIES.contains(enemy)) {
			return failure("Unknown enemy: " + input.enemy());
		}
		if (input.weapons() == null || input.weapons().size() != 3) {
			return failure("Exactly 3 weapons are required");
		}
		boolean itemsOnly = Boolean.TRUE.equals(input.itemsAlreadyUsed());
		boolean potionFirst = Boolean.TRUE.equals(input.potionUsedFirst());
		if (!itemsOnly && (input.miscItems() == null || input.miscItems().size() != 5)) {
			return failure("Exactly 5 miscellaneous items are required");
		}

		for (String w : input.weapons()) {
			if (!WEAPON_NAMES.contains(norm(w))) {
				return failure("Unknown weapon: " + w);
			}
		}
		if (!itemsOnly) {
			for (String m : input.miscItems()) {
				if (!MISC_ITEM_NAMES.contains(norm(m))) {
					return failure("Unknown item: " + m);
				}
			}
		}

		int[] enemyStats = ENEMY_STATS.get(enemy);
		int eStr = enemyStats[0], eDex = enemyStats[1], eInt = enemyStats[2];
		int pStr = input.str(), pDex = input.dex(), pInt = input.intelligence();

		List<String> itemsToUse = new ArrayList<>();
		if (!itemsOnly) {
			double temp = input.temperatureCelsius();
			double gravity = input.gravityMs2();
			double pressure = input.pressureKpa();
			int heightInches = input.heightFeet() * 12 + input.heightInches();
			boolean hasPotion = input.miscItems().stream().anyMatch(m -> "POTION".equals(norm(m)));
			if (potionFirst) {
				// Potion first: already used; reevaluate other items with current (post-Potion) stats. Never include Potion.
				for (String item : input.miscItems()) {
					String n = norm(item);
					if ("CHEAT CODE".equals(n) || "POTION".equals(n)) continue;
					if (useItem(n, bomb, enemy, pStr, pDex, pInt, temp, gravity, pressure, heightInches)) {
						itemsToUse.add(item);
					}
				}
				// Ensure Potion is never returned when user already used it first
				itemsToUse.removeIf(item -> "POTION".equals(norm(item)));
			} else {
				// Normal or Potion last: evaluate all items; put Potion last in the list.
				for (String item : input.miscItems()) {
					String n = norm(item);
					if ("CHEAT CODE".equals(n)) continue;
					if ("POTION".equals(n)) continue; // add Potion at the end below
					if (useItem(n, bomb, enemy, pStr, pDex, pInt, temp, gravity, pressure, heightInches)) {
						itemsToUse.add(item);
					}
				}
				if (hasPotion) {
					itemsToUse.add(input.miscItems().stream().filter(m -> "POTION".equals(norm(m))).findFirst().orElseThrow());
				}
			}
		}

		String bestWeapon = chooseWeapon(input.weapons(), pStr, pDex, pInt, eStr, eDex, eInt);
		if (bestWeapon == null) {
			return failure("Could not determine weapon from inventory");
		}

		storeState(module, "input", input);
		return success(new AdventureGameOutput(itemsToUse, bestWeapon));
	}

	private boolean useItem(String item, BombEntity bomb, String enemy,
		int pStr, int pDex, int pInt, double temp, double gravity, double pressure, int heightInches) {
		return switch (item) {
			case "BALLOON" -> (gravity < 9.3 || pressure > 110) && !"EAGLE".equals(enemy);
			case "BATTERY" -> bomb.getBatteryCount() <= 1 && !"GOLEM".equals(enemy) && !"WIZARD".equals(enemy);
			case "BELLOWS" -> ("DRAGON".equals(enemy) || "EAGLE".equals(enemy)) ? pressure > 105 : pressure < 95;
			case "CRYSTAL BALL" -> pInt > bomb.getLastDigit() && !"WIZARD".equals(enemy);
			case "FEATHER" -> pDex > pStr && pDex > pInt;
			case "HARD DRIVE" -> hasTwoOrMoreOfSamePort(bomb);
			case "LAMP" -> temp < 12 && !"LIZARD".equals(enemy);
			case "MOONSTONE" -> unlitIndicatorCount(bomb) >= 2;
			case "SMALL DOG" -> !"DEMON".equals(enemy) && !"DRAGON".equals(enemy) && !"TROLL".equals(enemy);
			case "STEPLADDER" -> heightInches < 48 && !"GOBLIN".equals(enemy) && !"LIZARD".equals(enemy);
			case "SUNSTONE" -> litIndicatorCount(bomb) >= 2;
			case "SYMBOL" -> "DEMON".equals(enemy) || "GOLEM".equals(enemy) || temp > 31;
			case "TICKET" -> heightInches >= 54 && gravity >= 9.2 && gravity <= 10.4;
			case "TROPHY" -> pStr > getFirstNumericDigit(bomb) || "TROLL".equals(enemy);
			default -> false;
		};
	}

	private String chooseWeapon(List<String> weapons, int pStr, int pDex, int pInt, int eStr, int eDex, int eInt) {
		String best = null;
		int bestAdvantage = Integer.MIN_VALUE;
		for (String w : weapons) {
			WeaponStat ws = WEAPON_STATS.get(norm(w));
			if (ws == null) continue;
			int playerStat = switch (ws.statIndex) {
				case 0 -> pStr;
				case 1 -> pDex;
				default -> pInt;
			};
			int enemyStat = switch (ws.statIndex) {
				case 0 -> eStr;
				case 1 -> eDex;
				default -> eInt;
			};
			int advantage = (playerStat + ws.bonus) - enemyStat;
			if (advantage > bestAdvantage) {
				bestAdvantage = advantage;
				best = w;
			}
		}
		return best;
	}

	private record WeaponStat(int statIndex, int bonus) {}
}
