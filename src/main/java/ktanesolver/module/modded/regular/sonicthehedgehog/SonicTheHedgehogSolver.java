package ktanesolver.module.modded.regular.sonicthehedgehog;

import java.util.ArrayList;
import java.util.HashSet;
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

@Service
@ModuleInfo(
	type = ModuleType.SONIC_THE_HEDGEHOG,
	id = "sonic",
	name = "Sonic the Hedgehog",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Choose the correct Sonic monitor from four sounds and three successive pictures",
	tags = {"sounds", "pictures", "multi-stage", "Souvenir", "modded"}
)
public class SonicTheHedgehogSolver extends AbstractModuleSolver<SonicTheHedgehogInput, SonicTheHedgehogOutput> {
	private static final List<String> SOUNDS = List.of(
		"Boss", "Breathe", "Bumper", "Continue", "Drown", "Emerald", "Extra Life", "Final Zone",
		"Invincibility", "Jump", "Lamppost", "Marble Zone", "Skid", "Spikes", "Spin", "Spring"
	);
	private static final List<List<String>> PICTURES = List.of(
		List.of("Ballhog", "Burrobot", "Buzz Bomber", "Crab Meat", "Moto Bug"),
		List.of("Annoyed Sonic", "Dead Sonic", "Drowned Sonic", "Falling Sonic", "Standing Sonic"),
		List.of("Blue Lamppost", "Red Lamppost", "Red Spring", "Switch", "Yellow Spring")
	);
	private static final String[][][] BUTTONS = {
		{
			{"In", "RBt", "EL", "Rg"},
			{"RBt", "In", "EL", "Rg"},
			{"EL", "Rg", "RBt", "In"},
			{"In", "EL", "Rg", "RBt"},
			{"Rg", "RBt", "In", "EL"}
		},
		{
			{"Rg", "RBt", "EL", "RBt", "In", "EL", "Rg", "In"},
			{"In", "EL", "RBt", "Rg", "Rg", "RBt", "EL", "In"},
			{"In", "Rg", "In", "EL", "RBt", "Rg", "RBt", "EL"},
			{"RBt", "EL", "Rg", "In", "EL", "Rg", "In", "RBt"},
			{"EL", "Rg", "RBt", "RBt", "EL", "In", "In", "Rg"}
		},
		{
			{"EL", "Rg", "RBt", "RBt", "In", "Rg", "In", "EL", "EL", "RBt", "In", "Rg"},
			{"RBt", "EL", "In", "RBt", "Rg", "In", "EL", "In", "RBt", "EL", "In", "RBt"},
			{"Rg", "RBt", "EL", "In", "RBt", "EL", "RBt", "Rg", "EL", "In", "RBt", "In"},
			{"In", "EL", "Rg", "EL", "RBt", "In", "Rg", "RBt", "In", "Rg", "EL", "Rg"},
			{"RBt", "In", "RBt", "Rg", "EL", "RBt", "Rg", "EL", "Rg", "In", "Rg", "EL"}
		}
	};
	private static final Map<String, String> MONITORS = Map.of(
		"RBt", "Running Boots", "In", "Invincibility", "EL", "Extra Life", "Rg", "Rings"
	);

	@Override
	protected SolveResult<SonicTheHedgehogOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, SonicTheHedgehogInput input
	) {
		if (input == null || input.stage() < 1 || input.stage() > 3) return failure("Sonic the Hedgehog has exactly 3 levels");
		if (input.sounds() == null || input.sounds().size() != 4 || !SOUNDS.containsAll(input.sounds())) {
			return failure("Select one valid sound for each of the four monitors");
		}
		if (input.picture() == null || !PICTURES.get(input.stage() - 1).contains(input.picture())) {
			return failure("Select a picture from the current level");
		}

		List<String> pictures = input.stage() == 1 ? new ArrayList<>() : pictures(module);
		if (input.stage() > 1 && !input.sounds().equals(module.getState().get("sounds"))) {
			return failure("The monitor sounds changed; restart from level 1 after a strike");
		}
		if (pictures.size() != input.stage() - 1) return failure("Enter the levels in order");

		pictures.add(input.picture());
		int condition = switch (input.stage()) {
			case 1 -> levelOneCondition(input.sounds());
			case 2 -> levelTwoCondition(input.sounds(), pictures.get(0));
			case 3 -> levelThreeCondition(input.sounds(), pictures.get(0), pictures.get(1));
			default -> throw new IllegalStateException();
		};
		String button = BUTTONS[input.stage() - 1][PICTURES.get(input.stage() - 1).indexOf(input.picture())][condition];
		storeTypedState(module, new SonicTheHedgehogState(List.copyOf(input.sounds()), List.copyOf(pictures)));
		return success(new SonicTheHedgehogOutput(input.stage(), button, MONITORS.get(button)), input.stage() == 3);
	}

	static int levelOneCondition(List<String> sounds) {
		if (hasAny(sounds, "Boss", "Final Zone", "Marble Zone")) return 0;
		if (new HashSet<>(sounds).size() < sounds.size()) return 1;
		if (sounds.get(0).equals("Emerald") || sounds.get(0).equals("Spikes")) return 2;
		return 3;
	}

	static int levelTwoCondition(List<String> sounds, String firstPicture) {
		if (sounds.get(2).equals("Extra Life") || sounds.get(1).equals("Invincibility")) return 0;
		if (hasAny(sounds, "Lamppost", "Marble Zone")) return 1;
		if (sounds.get(0).equals("Spin") || sounds.get(3).equals("Spring")) return 2;
		if (firstPicture.equals("Moto Bug")) return 3;
		if (sounds.contains("Spikes")) return 4;
		if (firstPicture.equals("Crab Meat") || sounds.contains("Drown")) return 5;
		if (adjacent(sounds, "Emerald", "Boss") || adjacent(sounds, "Emerald", "Skid")) return 6;
		return 7;
	}

	static int levelThreeCondition(List<String> sounds, String firstPicture, String secondPicture) {
		if (sounds.get(2).equals("Invincibility") || sounds.get(1).equals("Extra Life")) return 0;
		if (firstPicture.equals("Buzz Bomber") && secondPicture.equals("Annoyed Sonic")) return 1;
		if (secondPicture.equals("Drowned Sonic") || sounds.contains("Emerald")) return 2;
		if (sounds.contains("Spikes") && hasAny(sounds, "Boss", "Final Zone", "Marble Zone")) return 3;
		if (firstPicture.equals("Ballhog") || sounds.get(3).equals("Continue")) return 4;
		if (adjacent(sounds, "Skid", "Spikes") || adjacent(sounds, "Spin", "Spring")) return 5;
		if (secondPicture.equals("Falling Sonic") || sounds.contains("Final Zone")) return 6;
		if (adjacent(sounds, "Drown", "Bumper") || adjacent(sounds, "Drown", "Jump")) return 7;
		if (secondPicture.equals("Standing Sonic") && sounds.contains("Lamppost")) return 8;
		if (hasAny(sounds, "Final Zone", "Spring")) return 9;
		if (firstPicture.equals("Burrobot") && secondPicture.equals("Dead Sonic")) return 10;
		return 11;
	}

	private static boolean hasAny(List<String> sounds, String... candidates) {
		return Set.of(candidates).stream().anyMatch(sounds::contains);
	}

	private static boolean adjacent(List<String> sounds, String first, String second) {
		for (int i = 0; i < sounds.size() - 1; i++) {
			if (sounds.get(i).equals(first) && sounds.get(i + 1).equals(second)
				|| sounds.get(i).equals(second) && sounds.get(i + 1).equals(first)) return true;
		}
		return false;
	}

	@SuppressWarnings("unchecked")
	private static List<String> pictures(ModuleEntity module) {
		Object pictures = module.getState().get("pictures");
		return pictures instanceof List<?> list ? new ArrayList<>((List<String>) list) : new ArrayList<>();
	}

	private record SonicTheHedgehogState(List<String> sounds, List<String> pictures) {}
}
