package ktanesolver.module.modded.regular.icecream;

import static ktanesolver.module.modded.regular.icecream.IceCreamSolver.Allergy.*;
import static ktanesolver.module.modded.regular.icecream.IceCreamSolver.Flavor.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
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

@Service
@ModuleInfo(
	type = ModuleType.ICE_CREAM,
	id = "iceCreamModule",
	name = "Ice Cream",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Choose the first offered flavor safe for each customer's allergies",
	tags = {"allergies", "flavors", "edgework", "multi-stage", "souvenir", "modded"}
)
public class IceCreamSolver extends AbstractModuleSolver<IceCreamInput, IceCreamOutput> {
	private static final Map<String, String[]> ALLERGIES = Map.ofEntries(
		Map.entry("Mike", new String[]{"150", "683", "071", "432", "361"}),
		Map.entry("Tim", new String[]{"083", "214", "435", "267", "143"}),
		Map.entry("Tom", new String[]{"845", "167", "256", "375", "361"}),
		Map.entry("Dave", new String[]{"267", "014", "823", "781", "573"}),
		Map.entry("Adam", new String[]{"341", "362", "021", "247", "856"}),
		Map.entry("Cheryl", new String[]{"163", "752", "145", "420", "375"}),
		Map.entry("Sean", new String[]{"461", "236", "157", "682", "274"}),
		Map.entry("Ashley", new String[]{"625", "417", "082", "126", "367"}),
		Map.entry("Jessica", new String[]{"426", "123", "034", "650", "478"}),
		Map.entry("Taylor", new String[]{"635", "512", "426", "710", "372"}),
		Map.entry("Simon", new String[]{"035", "164", "548", "207", "736"}),
		Map.entry("Sally", new String[]{"463", "102", "674", "258", "031"}),
		Map.entry("Jade", new String[]{"371", "082", "713", "678", "451"}),
		Map.entry("Sam", new String[]{"241", "780", "346", "103", "652"}),
		Map.entry("Gary", new String[]{"125", "680", "321", "745", "184"}),
		Map.entry("Victor", new String[]{"031", "257", "346", "671", "530"}),
		Map.entry("George", new String[]{"812", "648", "043", "164", "325"}),
		Map.entry("Jacob", new String[]{"732", "156", "547", "340", "621"}),
		Map.entry("Pat", new String[]{"562", "136", "347", "205", "813"}),
		Map.entry("Bob", new String[]{"568", "210", "482", "425", "051"})
	);
	private static final List<List<Flavor>> PRIORITIES = List.of(
		List.of(COOKIES_AND_CREAM, NEAPOLITAN, TUTTI_FRUTTI, THE_CLASSIC, ROCKY_ROAD, DOUBLE_CHOCOLATE, MINT_CHOCOLATE_CHIP, DOUBLE_STRAWBERRY, RASPBERRY_RIPPLE, VANILLA),
		List.of(DOUBLE_CHOCOLATE, MINT_CHOCOLATE_CHIP, NEAPOLITAN, ROCKY_ROAD, TUTTI_FRUTTI, DOUBLE_STRAWBERRY, COOKIES_AND_CREAM, RASPBERRY_RIPPLE, THE_CLASSIC, VANILLA),
		List.of(NEAPOLITAN, TUTTI_FRUTTI, COOKIES_AND_CREAM, RASPBERRY_RIPPLE, DOUBLE_STRAWBERRY, MINT_CHOCOLATE_CHIP, DOUBLE_CHOCOLATE, THE_CLASSIC, ROCKY_ROAD, VANILLA),
		List.of(DOUBLE_STRAWBERRY, COOKIES_AND_CREAM, ROCKY_ROAD, THE_CLASSIC, NEAPOLITAN, DOUBLE_CHOCOLATE, TUTTI_FRUTTI, RASPBERRY_RIPPLE, MINT_CHOCOLATE_CHIP, VANILLA)
	);

	@Override
	protected SolveResult<IceCreamOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, IceCreamInput input
	) {
		if (input == null || input.customer() == null) return failure("Select the customer");
		String customer = ALLERGIES.keySet().stream()
			.filter(name -> name.equalsIgnoreCase(input.customer().trim())).findFirst().orElse(null);
		if (customer == null) return failure("Select a valid customer");
		if (input.flavors() == null || input.flavors().size() != 5) return failure("Enter the five offered flavors");

		List<Flavor> offered = input.flavors().stream().map(Flavor::fromDisplay).toList();
		if (offered.contains(null)) return failure("Select only valid ice cream flavors");
		if (new HashSet<>(offered).size() != 5) return failure("The five offered flavors must be different");
		if (!offered.contains(VANILLA)) return failure("Vanilla is always one of the five offered flavors");

		Set<Allergy> allergies = new HashSet<>();
		ALLERGIES.get(customer)[bomb.getLastDigit() / 2].chars()
			.map(digit -> digit - '0').mapToObj(index -> Allergy.values()[index]).forEach(allergies::add);
		List<Flavor> priority = PRIORITIES.get(priorityIndex(bomb));
		Flavor answer = priority.stream()
			.filter(offered::contains)
			.filter(flavor -> Collections.disjoint(flavor.allergies, allergies))
			.findFirst().orElse(VANILLA);

		List<Map<String, Object>> stages = stages(module);
		if (input.resetStage() && !stages.isEmpty()) stages.removeLast();
		int stage = stages.size() + 1;
		if (stage > 3) return failure("All three Ice Cream customers are already complete");
		stages.add(Map.of(
			"customer", customer,
			"offeredFlavors", offered.stream().map(flavor -> flavor.souvenirName).toList(),
			"soldFlavor", answer.souvenirName
		));
		storeState(module, "stages", stages);
		return success(new IceCreamOutput(stage, answer.displayName, offered.indexOf(answer) + 1), stage == 3);
	}

	private static int priorityIndex(BombEntity bomb) {
		long lit = bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count();
		long unlit = bomb.getIndicators().values().stream().filter(Boolean.FALSE::equals).count();
		if (lit > unlit) return 0;
		if (bomb.getPortPlates().stream().anyMatch(plate -> plate.getPorts().isEmpty())) return 1;
		return bomb.getBatteryCount() >= 3 ? 2 : 3;
	}

	@SuppressWarnings("unchecked")
	private static List<Map<String, Object>> stages(ModuleEntity module) {
		Object value = module.getState().get("stages");
		return value instanceof List<?> list ? new ArrayList<>((List<Map<String, Object>>) list) : new ArrayList<>();
	}

	enum Allergy { CHOCOLATE, STRAWBERRY, RASPBERRY, NUTS, COOKIES, MINT, FRUIT, CHERRY, MARSHMALLOWS }

	enum Flavor {
		TUTTI_FRUTTI("Tutti Frutti", FRUIT, RASPBERRY, CHERRY, STRAWBERRY),
		ROCKY_ROAD("Rocky Road", CHOCOLATE, NUTS, MARSHMALLOWS),
		RASPBERRY_RIPPLE("Raspberry Ripple", RASPBERRY, FRUIT),
		DOUBLE_CHOCOLATE("Double Chocolate", CHOCOLATE),
		DOUBLE_STRAWBERRY("Double Strawberry", STRAWBERRY, FRUIT),
		COOKIES_AND_CREAM("Cookies and Cream", "Cookies & Cream", COOKIES),
		NEAPOLITAN("Neapolitan", STRAWBERRY, CHOCOLATE, FRUIT),
		MINT_CHOCOLATE_CHIP("Mint Chocolate Chip", CHOCOLATE, MINT),
		THE_CLASSIC("The Classic", CHOCOLATE, CHERRY, FRUIT),
		VANILLA("Vanilla");

		private final String displayName;
		private final String souvenirName;
		private final Set<Allergy> allergies;

		Flavor(String displayName, Allergy... allergies) {
			this(displayName, displayName, allergies);
		}

		Flavor(String displayName, String souvenirName, Allergy... allergies) {
			this.displayName = displayName;
			this.souvenirName = souvenirName;
			this.allergies = Set.of(allergies);
		}

		private static Flavor fromDisplay(String value) {
			if (value == null) return null;
			String normalized = value.trim().replace("&", "and").replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
			for (Flavor flavor : values()) if (flavor.displayName.toLowerCase(Locale.ROOT).equals(normalized)) return flavor;
			return null;
		}
	}
}
