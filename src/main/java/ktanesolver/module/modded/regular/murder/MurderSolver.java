package ktanesolver.module.modded.regular.murder;

import java.util.HashSet;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.murder.MurderInput.Location;
import ktanesolver.module.modded.regular.murder.MurderInput.Suspect;
import ktanesolver.module.modded.regular.murder.MurderInput.Weapon;

@Service
@ModuleInfo(type = ModuleType.MURDER, id = "murder", name = "Murder", category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR, description = "Identify the murderer, weapon, and crime scene.", tags = {"cluedo", "deduction"})
public class MurderSolver extends AbstractModuleSolver<MurderInput, MurderOutput> {

	private static final Location[][] LOCATIONS = {
		{Location.DINING_ROOM, Location.LIBRARY, Location.LOUNGE, Location.KITCHEN, Location.STUDY, Location.CONSERVATORY},
		{Location.STUDY, Location.HALL, Location.BILLIARD_ROOM, Location.LOUNGE, Location.KITCHEN, Location.LIBRARY},
		{Location.KITCHEN, Location.BILLIARD_ROOM, Location.BALLROOM, Location.LIBRARY, Location.CONSERVATORY, Location.DINING_ROOM},
		{Location.LOUNGE, Location.BALLROOM, Location.DINING_ROOM, Location.CONSERVATORY, Location.HALL, Location.KITCHEN},
		{Location.BILLIARD_ROOM, Location.KITCHEN, Location.STUDY, Location.BALLROOM, Location.DINING_ROOM, Location.HALL},
		{Location.CONSERVATORY, Location.LOUNGE, Location.LIBRARY, Location.STUDY, Location.BILLIARD_ROOM, Location.BALLROOM},
		{Location.BALLROOM, Location.CONSERVATORY, Location.KITCHEN, Location.HALL, Location.LIBRARY, Location.STUDY},
		{Location.HALL, Location.STUDY, Location.CONSERVATORY, Location.DINING_ROOM, Location.LOUNGE, Location.BILLIARD_ROOM},
		{Location.LIBRARY, Location.DINING_ROOM, Location.HALL, Location.BILLIARD_ROOM, Location.BALLROOM, Location.LOUNGE}
	};

	@Override
	protected SolveResult<MurderOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, MurderInput input) {
		if(input == null || input.bodyLocation() == null) return failure("Select the room where the body was found");
		if(!hasFourDistinct(input.suspects())) return failure("Select the four suspects shown on the module");
		if(!hasFourDistinct(input.weapons())) return failure("Select the four weapons shown on the module");

		storeState(module, "input", input);
		int suspectRow = suspectRow(bomb, input.bodyLocation());
		int weaponRow = weaponRow(bomb, input.bodyLocation());
		List<MurderOutput> matches = input.suspects().stream()
			.flatMap(suspect -> input.weapons().stream()
				.filter(weapon -> LOCATIONS[suspectRow][suspect.ordinal()] == LOCATIONS[weaponRow][weapon.ordinal()])
				.map(weapon -> new MurderOutput(suspect, weapon, LOCATIONS[suspectRow][suspect.ordinal()])))
			.toList();

		if(matches.size() != 1) return failure(matches.isEmpty()
			? "The selected suspects and weapons produce no valid accusation"
			: "The selected suspects and weapons produce more than one valid accusation");
		return success(matches.getFirst());
	}

	private static boolean hasFourDistinct(List<?> values) {
		return values != null && values.size() == 4 && values.stream().noneMatch(Objects::isNull) && new HashSet<>(values).size() == 4;
	}

	private static int suspectRow(BombEntity bomb, Location body) {
		if(bomb.isIndicatorLit("TRN")) return 4;
		if(body == Location.DINING_ROOM) return 6;
		if(rcaPortCount(bomb) >= 2) return 7;
		if(bomb.getDBatteryCount() == 0) return 1;
		if(body == Location.STUDY) return 3;
		if(bomb.getBatteryCount() >= 5) return 8;
		if(bomb.isIndicatorUnlit("FRQ")) return 0;
		if(body == Location.CONSERVATORY) return 2;
		return 5;
	}

	private static int weaponRow(BombEntity bomb, Location body) {
		if(body == Location.LOUNGE) return 2;
		if(bomb.getBatteryCount() >= 5) return 0;
		if(bomb.hasPort(PortType.SERIAL)) return 8;
		if(body == Location.BILLIARD_ROOM) return 3;
		if(bomb.getBatteryCount() == 0) return 5;
		if(bomb.getIndicators().values().stream().noneMatch(Boolean.TRUE::equals)) return 4;
		if(body == Location.HALL) return 6;
		if(rcaPortCount(bomb) >= 2) return 1;
		return 7;
	}

	private static long rcaPortCount(BombEntity bomb) {
		return bomb.getPortPlates().stream().filter(plate -> plate.getPorts().contains(PortType.STEREO_RCA)).count();
	}
}
