package ktanesolver.module.modded.regular.creation;

import static ktanesolver.module.modded.regular.creation.CreationInput.Element.*;

import java.util.EnumSet;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.creation.CreationInput.Element;
import ktanesolver.module.modded.regular.creation.CreationInput.Weather;

@Service
@ModuleInfo(
	type = ModuleType.CREATION,
	id = "creation",
	name = "Creation",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Combine elements across changing weather to create the target lifeform",
	tags = {"elements", "weather", "multi-stage", "souvenir", "modded"}
)
public class CreationSolver extends AbstractModuleSolver<CreationInput, CreationOutput> {
	private static final Set<Element> BASES = EnumSet.of(WATER, AIR, EARTH, FIRE);
	private static final Map<Element, List<Element>> RECIPES = recipes();

	@Override
	protected SolveResult<CreationOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, CreationInput input) {
		if (input == null || input.weather() == null) return failure("Select the current weather");

		boolean newRun = input.reset() || !module.getState().containsKey("target");
		Element target;
		Set<Element> created;
		int day;
		if (newRun) {
			if (!validBases(input.baseElements())) return failure("Enter Water, Air, Earth, and Fire once each in display order");
			target = target(bomb, permutation(input.weather(), input.baseElements()));
			created = EnumSet.noneOf(Element.class);
			day = 1;
			module.getState().clear();
			storeState(module, "firstWeather", display(input.weather()));
			storeState(module, "baseElements", input.baseElements());
			storeState(module, "target", target);
		} else {
			try {
				target = Element.valueOf(String.valueOf(module.getState().get("target")));
				created = readElements(module.getState().get("created"));
				day = ((Number) module.getState().getOrDefault("day", 1)).intValue();
			} catch (RuntimeException exception) {
				return failure("Saved Creation state is invalid; restart after a strike");
			}
		}

		Set<Element> required = EnumSet.noneOf(Element.class);
		collectRequired(target, required);
		Element next = RECIPES.keySet().stream()
			.filter(required::contains)
			.filter(element -> !created.contains(element))
			.filter(element -> RECIPES.get(element).stream().filter(ingredient -> !BASES.contains(ingredient)).allMatch(created::contains))
			.findFirst().orElse(null);
		if (next == null) return failure("No valid combination remains; restart after a strike");

		List<Element> pair = substitute(RECIPES.get(next), input.weather());
		created.add(next);
		storeState(module, "created", created.stream().map(Enum::name).toList());
		storeState(module, "day", next == target ? day : day + 1);
		return success(new CreationOutput(day, required.size(), target, pair.get(0), pair.get(1), next), next == target);
	}

	private static Map<Element, List<Element>> recipes() {
		Map<Element, List<Element>> recipes = new LinkedHashMap<>();
		recipes.put(SWAMP, List.of(WATER, EARTH));
		recipes.put(ENERGY, List.of(FIRE, AIR));
		recipes.put(LIFE, List.of(ENERGY, SWAMP));
		recipes.put(PLASMA, List.of(ENERGY, FIRE));
		recipes.put(BACTERIA, List.of(SWAMP, LIFE));
		recipes.put(EGG, List.of(EARTH, LIFE));
		recipes.put(GHOST, List.of(PLASMA, LIFE));
		recipes.put(WEEDS, List.of(WATER, LIFE));
		recipes.put(BIRD, List.of(EGG, AIR));
		recipes.put(DINOSAUR, List.of(EARTH, EGG));
		recipes.put(LIZARD, List.of(SWAMP, EGG));
		recipes.put(TURTLE, List.of(EGG, WATER));
		recipes.put(MUSHROOM, List.of(WEEDS, EARTH));
		recipes.put(WORM, List.of(BACTERIA, SWAMP));
		recipes.put(PLANKTON, List.of(WATER, BACTERIA));
		recipes.put(SEEDS, List.of(WEEDS, EGG));
		return recipes;
	}

	private static void collectRequired(Element element, Set<Element> required) {
		if (!RECIPES.containsKey(element) || !required.add(element)) return;
		RECIPES.get(element).forEach(ingredient -> collectRequired(ingredient, required));
	}

	private static List<Element> substitute(List<Element> recipe, Weather weather) {
		Element from = switch (weather) {
			case RAIN -> WATER;
			case WINDY -> AIR;
			case HEAT_WAVE -> FIRE;
			case METEOR_SHOWER -> EARTH;
			case CLEAR -> null;
		};
		Element to = switch (weather) {
			case RAIN -> FIRE;
			case WINDY -> EARTH;
			case HEAT_WAVE -> WATER;
			case METEOR_SHOWER -> AIR;
			case CLEAR -> null;
		};
		return recipe.stream().map(element -> element == from ? to : element).toList();
	}

	private static int permutation(Weather weather, List<Element> bases) {
		if (weather == Weather.CLEAR) return 0;
		Element reference = switch (weather) {
			case RAIN -> WATER;
			case WINDY -> AIR;
			case METEOR_SHOWER -> EARTH;
			case HEAT_WAVE -> FIRE;
			case CLEAR -> throw new IllegalStateException();
		};
		int[][] chart = {{2, 1, 4, 3}, {1, 2, 3, 4}, {4, 3, 1, 2}, {3, 4, 2, 1}};
		return chart[reference.ordinal()][bases.indexOf(reference)];
	}

	private static Element target(BombEntity bomb, int permutation) {
		long lit = bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count();
		long unlit = bomb.getIndicators().values().stream().filter(Boolean.FALSE::equals).count();
		if (bomb.getBatteryHolders() >= 3) {
			int offset = lit > 0 ? (bomb.getDBatteryCount() == 0 ? 0 : 1)
				: unlit > 0 ? (bomb.getAaBatteryCount() == 0 ? 2 : 3) : 4;
			return List.of(BIRD, DINOSAUR, TURTLE, LIZARD, WORM).get((permutation + offset) % 5);
		}

		List<Element> targets;
		if (bomb.getPortPlates().size() > bomb.getBatteryHolders()) targets = List.of(GHOST, PLANKTON, SEEDS, MUSHROOM, GHOST);
		else if (hasDuplicatePort(bomb.getPortPlates())) targets = List.of(PLANKTON, SEEDS, MUSHROOM, GHOST, PLANKTON);
		else if (unlit > lit) targets = List.of(SEEDS, MUSHROOM, GHOST, PLANKTON, SEEDS);
		else targets = List.of(MUSHROOM, GHOST, PLANKTON, SEEDS, MUSHROOM);
		return targets.get(permutation);
	}

	private static boolean hasDuplicatePort(List<PortPlateEntity> plates) {
		Set<PortType> seen = new HashSet<>();
		return plates.stream().flatMap(plate -> plate.getPorts().stream()).anyMatch(port -> !seen.add(port));
	}

	private static boolean validBases(List<Element> bases) {
		return bases != null && bases.size() == 4 && new HashSet<>(bases).equals(BASES);
	}

	private static Set<Element> readElements(Object value) {
		Set<Element> elements = EnumSet.noneOf(Element.class);
		if (value instanceof List<?> list) list.forEach(element -> elements.add(Element.valueOf(String.valueOf(element))));
		return elements;
	}

	private static String display(Weather weather) {
		return switch (weather) {
			case CLEAR -> "Clear";
			case HEAT_WAVE -> "Heat Wave";
			case METEOR_SHOWER -> "Meteor Shower";
			case RAIN -> "Rain";
			case WINDY -> "Windy";
		};
	}
}
