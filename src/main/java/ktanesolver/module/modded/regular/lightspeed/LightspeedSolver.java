package ktanesolver.module.modded.regular.lightspeed;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.lightspeed.LightspeedInput.Point;
import ktanesolver.module.modded.regular.lightspeed.LightspeedInput.Symbol;
import ktanesolver.module.modded.regular.lightspeed.LightspeedInput.SymbolColor;

@Service
@ModuleInfo(
	type = ModuleType.LIGHTSPEED,
	id = "lightspeed",
	name = "Lightspeed",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Calculate the warp speed, destination, officer, and encryption code.",
	tags = {"Star Trek", "warp", "planets", "officers", "encryption"}
)
public class LightspeedSolver extends AbstractModuleSolver<LightspeedInput, LightspeedOutput> {
	private record Planet(String name, String quadrant, int dilithium, String classification) {}
	private enum Rank { CREWMAN, ENSIGN, LIEUTENANT, LIEUTENANT_COMMANDER, COMMANDER, CAPTAIN }
	private record Officer(String name, Rank rank, String dates) {}

	private static final Map<String, Planet> PLANETS = new LinkedHashMap<>();
	private static final Map<String, Officer> OFFICERS = new LinkedHashMap<>();
	private static final Map<SymbolColor, Map<Symbol, String>> QUADRANTS = Map.of(
		SymbolColor.YELLOW, Map.of(Symbol.C, "GDBA", Symbol.L, "DGBA", Symbol.P, "BDAG"),
		SymbolColor.ORANGE, Map.of(Symbol.C, "ADBG", Symbol.L, "BADG", Symbol.P, "DBAG"),
		SymbolColor.PURPLE, Map.of(Symbol.C, "ABGD", Symbol.L, "BGDA", Symbol.P, "DAGB")
	);

	static {
		planet("Andor","Beta",58,"Y"); planet("Avery III","Delta",34,"H"); planet("Ba’ku","Beta",83,"H");
		planet("Bajor XI","Alpha",74,"Y"); planet("Batrus","Gamma",56,"L"); planet("Bolarus IX","Alpha",47,"H");
		planet("Brax","Gamma",64,"H"); planet("Callinon VII","Gamma",13,"H"); planet("Cardassia Prime","Alpha",26,"K");
		planet("Ceti Alpha V","Beta",75,"L"); planet("Dosa II","Gamma",24,"K"); planet("Dryan II","Delta",84,"L");
		planet("Eridon Prime","Beta",34,"H"); planet("Ferasa Prime","Alpha",31,"K"); planet("Gaia IV","Gamma",31,"L");
		planet("Galor IV","Alpha",58,"L"); planet("Hemikek IV","Delta",53,"Y"); planet("Iconia","Beta",21,"L");
		planet("Ilidaria","Delta",62,"L"); planet("Kyana Prime","Delta",19,"H"); planet("Ledos","Delta",70,"K");
		planet("Malcor III","Alpha",39,"L"); planet("Merakord II","Gamma",81,"Y"); planet("Ocampa","Delta",27,"K");
		planet("Qo’noS","Beta",42,"M"); planet("Rakosa V","Delta",93,"M"); planet("Rigel VIII","Beta",50,"K");
		planet("Risa","Alpha",88,"M"); planet("Romulus","Beta",67,"K"); planet("Skovar VI","Gamma",73,"M");
		planet("Sol III","Alpha",15,"M"); planet("T-Rogoran Prime","Gamma",92,"M"); planet("Talax","Delta",46,"M");
		planet("Talos IV","Alpha",66,"H"); planet("Vandros IV","Gamma",40,"K"); planet("Vulcan","Beta",13,"M");

		officer("Barclay, R",Rank.LIEUTENANT,"2356"); officer("Brownfield, D",Rank.LIEUTENANT_COMMANDER,"12569");
		officer("Cavit",Rank.LIEUTENANT_COMMANDER,"24680"); officer("Chakotay",Rank.COMMANDER,"246890");
		officer("Darwin, F",Rank.CREWMAN,"9"); officer("Data",Rank.LIEUTENANT_COMMANDER,"12345");
		officer("Howard, M",Rank.LIEUTENANT_COMMANDER,"13579"); officer("Janeway, K",Rank.CAPTAIN,"ANY");
		officer("Jetal, A",Rank.ENSIGN,"46"); officer("Kaplan, M",Rank.ENSIGN,"58"); officer("Kim, H",Rank.ENSIGN,"13");
		officer("La Forge, G",Rank.LIEUTENANT_COMMANDER,"67890"); officer("Lang, T",Rank.CREWMAN,"4");
		officer("McKenzie, W",Rank.CREWMAN,"7"); officer("Nesterowicz, J",Rank.LIEUTENANT,"2468");
		officer("Paris, T",Rank.LIEUTENANT,"1790"); officer("Picard, J",Rank.CAPTAIN,"ANY");
		officer("Riker, W",Rank.COMMANDER,"123670"); officer("Sisko, B",Rank.COMMANDER,"135789");
		officer("Suder, L",Rank.CREWMAN,"2"); officer("Telfer, W",Rank.CREWMAN,"1");
		officer("Torres, B",Rank.LIEUTENANT,"3569"); officer("Tuvok",Rank.LIEUTENANT,"1457");
		officer("Wildman, S",Rank.ENSIGN,"29"); officer("Young, C",Rank.ENSIGN,"70");
	}

	@Override
	protected SolveResult<LightspeedOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, LightspeedInput input
	) {
		if (input == null || input.symbol() == null || input.symbolColor() == null || input.greenPoint() == null
			|| input.antimatter() == null || input.dilithium() == null || input.shields() == null
			|| input.stardate() == null || input.subStardate() == null || input.planets() == null || input.officers() == null) {
			return failure("Enter all Lightspeed display values");
		}
		if (!percent(input.antimatter()) || !percent(input.dilithium()) || !percent(input.shields())) {
			return failure("Resource levels must be between 0 and 100");
		}
		if (input.stardate() < 10000 || input.stardate() > 99999 || input.subStardate() < 0 || input.subStardate() > 9) {
			return failure("Enter a five-digit stardate and one-digit sub-stardate");
		}
		String quadrant = quadrant(input.symbolColor(), input.symbol(), input.greenPoint());
		if (input.planets().size() != 3 || input.planets().stream().map(LightspeedSolver::key).distinct().count() != 3) {
			return failure("Enter three distinct planets from the current quadrant");
		}
		List<Planet> planets = input.planets().stream().map(name -> PLANETS.get(key(name))).toList();
		if (planets.stream().anyMatch(planet -> planet == null || !planet.quadrant().equals(quadrant))) {
			return failure("Every planet must belong to the calculated quadrant");
		}
		Planet destination = planets.stream().filter(planet -> planet.dilithium() <= input.dilithium())
			.max(java.util.Comparator.comparingInt(Planet::dilithium)).orElse(null);
		if (destination == null) return failure("There is not enough dilithium for any entered planet");

		Rank[] slots = {Rank.CREWMAN, Rank.CREWMAN, Rank.ENSIGN, Rank.ENSIGN, Rank.LIEUTENANT,
			Rank.LIEUTENANT_COMMANDER, Rank.COMMANDER, Rank.CAPTAIN};
		if (input.officers().size() != 8 || input.officers().stream().map(LightspeedSolver::key).distinct().count() != 8) {
			return failure("Enter eight distinct officers in rank order");
		}
		Officer selected = null;
		for (int index = 0; index < slots.length; index++) {
			Officer officer = OFFICERS.get(key(input.officers().get(index)));
			if (officer == null || officer.rank() != slots[index]) return failure("Officers must match their displayed rank slots");
			if (selected == null && available(officer, input.subStardate(), destination.classification())) selected = officer;
		}
		if (selected == null) return failure("No entered officer is eligible");

		int warp = input.antimatter() / 10 - ("Alpha".equals(quadrant) ? 2 : 0);
		warp -= (100 - input.shields()) / ("Delta".equals(quadrant) ? 15 : 25);
		warp = Math.max(1, warp);
		String code = encryption(input.stardate(), input.subStardate(), bomb, selected.rank(), quadrant);
		return success(new LightspeedOutput(
			quadrant, warp, destination.name(), destination.classification(), selected.name(),
			rankName(selected.rank()), code
		));
	}

	private static String quadrant(SymbolColor color, Symbol symbol, Point point) {
		char letter = QUADRANTS.get(color).get(symbol).charAt(point.ordinal());
		return Map.of('A',"Alpha",'B',"Beta",'G',"Gamma",'D',"Delta").get(letter);
	}

	private static boolean available(Officer officer, int subStardate, String planetClass) {
		Set<String> forbidden = switch (officer.rank()) {
			case CREWMAN -> Set.of("L","H","Y");
			case ENSIGN -> Set.of("H","Y");
			case LIEUTENANT -> Set.of("Y");
			default -> Set.of();
		};
		return !forbidden.contains(planetClass)
			&& ("ANY".equals(officer.dates()) || officer.dates().indexOf((char) ('0' + subStardate)) >= 0);
	}

	private static String encryption(int stardate, int sub, BombEntity bomb, Rank rank, String quadrant) {
		int first = stardate / 10000;
		int second = (stardate / 1000 + stardate / 100 % 10 + stardate / 10 % 10 + stardate % 10) % 10;
		int third = (sub + bomb.getPortPlates().size()
			+ (int) bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count()) % 10;
		String fourth;
		int batteries = bomb.getBatteryCount();
		if (batteries <= 3) {
			boolean high = rank == Rank.COMMANDER || rank == Rank.CAPTAIN;
			fourth = high ? ("Alpha".equals(quadrant) || "Delta".equals(quadrant) ? "3" : "5")
				: ("Gamma".equals(quadrant) || "Delta".equals(quadrant) ? "1" : "7");
		} else if (batteries >= 8) {
			boolean high = rank.ordinal() >= Rank.LIEUTENANT_COMMANDER.ordinal();
			fourth = high ? ("Gamma".equals(quadrant) || "Delta".equals(quadrant) ? "4" : "9")
				: ("Alpha".equals(quadrant) || "Delta".equals(quadrant) ? "2" : Integer.toString(second));
		} else {
			boolean low = rank == Rank.CREWMAN || rank == Rank.ENSIGN;
			fourth = low ? ("Alpha".equals(quadrant) || "Gamma".equals(quadrant) ? "0" : Integer.toString(first))
				: ("Alpha".equals(quadrant) || "Gamma".equals(quadrant) ? "6" : "8");
		}
		return Integer.toString(first) + second + third + fourth;
	}

	private static String rankName(Rank rank) {
		return switch (rank) {
			case CREWMAN -> "Crewman"; case ENSIGN -> "Ensign"; case LIEUTENANT -> "Lieutenant";
			case LIEUTENANT_COMMANDER -> "Lieutenant Commander"; case COMMANDER -> "Commander"; case CAPTAIN -> "Captain";
		};
	}
	private static boolean percent(int value) { return value >= 0 && value <= 100; }
	private static String key(String value) { return value == null ? "" : value.trim().replace('’','\'').toUpperCase(); }
	private static void planet(String name, String quadrant, int dilithium, String classification) {
		PLANETS.put(key(name), new Planet(name, quadrant, dilithium, classification));
	}
	private static void officer(String name, Rank rank, String dates) { OFFICERS.put(key(name), new Officer(name, rank, dates)); }
}
