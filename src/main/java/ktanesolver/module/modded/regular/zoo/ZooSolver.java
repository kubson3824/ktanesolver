package ktanesolver.module.modded.regular.zoo;

import java.util.ArrayList;
import java.util.List;

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

@Service
@ModuleInfo(
	type = ModuleType.ZOO,
	id = "zoo",
	name = "Zoo",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Use the two displayed animals and port counts to find a line of five animals.",
	tags = { "animals", "hexagon", "ports", "modded" },
	hasInput = true,
	hasOutput = true
)
public class ZooSolver extends AbstractModuleSolver<ZooInput, ZooOutput> {
	private static final String[] GRID = {
		"Cow", "Tyrannosaurus Rex", "Rabbit", "Horse", "Flamingo", "Cat", "Bat", "Ant", "Fly", "Llama",
		"Hyena", "Pig", "Owl", "Rhinoceros", "Tortoise", "Sea Horse", "Camel", "Dimetrodon", "Spider", "Goose",
		"Snail", "Monkey", "Wolf", "Kangaroo", "Lobster", "Dromedary", "Bear", "Dragonfly", "Butterfly", "Fox",
		"Dolphin", "Eagle", "Porcupine", "Otter", "Warthog", "Ferret", "Lion", "Squirrel", "Giraffe", "Koala",
		"Crab", "Frog", "Swallow", "Stegosaurus", "Pterodactyl", "Cobra", "Hippopotamus", "Triceratops", "Duck",
		"Starfish", "Elephant", "Rooster", "Woodpecker", "Apatosaurus", "Beaver", "Gorilla", "Mouse", "Seal",
		"Skunk", "Viper", "Salamander"
	};
	private static final String[] Q_ANIMALS = { "Gazelle", "Caracal", "Cheetah", "Ocelot", "Sheep", "Caterpillar", "Groundhog", "Armadillo", "Orca" };
	private static final String[] R_ANIMALS = { "Plesiosaur", "Penguin", "Baboon", "Whale", "Squid", "Coyote", "Ram", "Deer", "Crocodile" };
	private static final Hex[] DIRECTIONS = { new Hex(-1, 0), new Hex(0, -1), new Hex(1, -1), new Hex(1, 0), new Hex(0, 1), new Hex(-1, 1) };
	private static final PortType[] PORT_TYPES = { PortType.PARALLEL, PortType.DVI, PortType.STEREO_RCA, PortType.SERIAL, PortType.PS2, PortType.RJ45 };
	private static final List<Hex> CELLS = largeHexagon();

	@Override
	protected SolveResult<ZooOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, ZooInput input) {
		if (input == null) return failure("Enter both animals displayed on the module");
		int firstQ = indexOf(Q_ANIMALS, input.firstAnimal());
		int secondQ = indexOf(Q_ANIMALS, input.secondAnimal());
		int firstR = indexOf(R_ANIMALS, input.firstAnimal());
		int secondR = indexOf(R_ANIMALS, input.secondAnimal());
		int q = firstQ >= 0 && secondR >= 0 ? firstQ - 4 : secondQ >= 0 && firstR >= 0 ? secondQ - 4 : Integer.MIN_VALUE;
		int r = firstQ >= 0 && secondR >= 0 ? secondR - 4 : secondQ >= 0 && firstR >= 0 ? firstR - 4 : Integer.MIN_VALUE;
		Hex start = new Hex(q, r);
		if (!CELLS.contains(start)) return failure("Choose one animal from each axis that points to a cell in the grid");

		for (int count = bomb.getPortPlates().size(); count >= 0; count--) {
			int candidate = -1;
			for (int direction = 0; direction < DIRECTIONS.length; direction++) {
				if (canFormLine(start, direction, 1) && portCount(bomb, PORT_TYPES[direction]) == count)
					candidate = candidate == -1 ? direction : -2;
			}
			if (candidate >= 0) return solved(module, input, line(start, candidate, 1));
		}

		for (int direction = 0; direction < DIRECTIONS.length; direction++)
			if (canFormLine(start, direction, 2)) return solved(module, input, line(start, direction, 2));
		return failure("The displayed animals do not produce a valid line");
	}

	private SolveResult<ZooOutput> solved(ModuleEntity module, ZooInput input, List<String> animals) {
		storeState(module, "input", input);
		return success(new ZooOutput(animals));
	}

	private static int portCount(BombEntity bomb, PortType type) {
		return (int) bomb.getPortPlates().stream().filter(plate -> plate.getPorts().contains(type)).count();
	}

	private static boolean canFormLine(Hex start, int direction, int step) {
		Hex delta = DIRECTIONS[direction];
		for (int distance = 0; distance < 5; distance++)
			if (!CELLS.contains(start.add(delta.multiply(distance * step)))) return false;
		return true;
	}

	private static List<String> line(Hex start, int direction, int step) {
		List<String> result = new ArrayList<>(5);
		Hex delta = DIRECTIONS[direction];
		for (int distance = 0; distance < 5; distance++) result.add(GRID[CELLS.indexOf(start.add(delta.multiply(distance * step)))]);
		return result;
	}

	private static int indexOf(String[] values, String value) {
		if (value == null) return -1;
		for (int i = 0; i < values.length; i++) if (values[i].equalsIgnoreCase(value.trim())) return i;
		return -1;
	}

	private static List<Hex> largeHexagon() {
		List<Hex> result = new ArrayList<>(61);
		for (int r = -4; r <= 4; r++)
			for (int q = -4; q <= 4; q++) {
				Hex hex = new Hex(q, r);
				if (hex.distance() < 5) result.add(hex);
			}
		return List.copyOf(result);
	}

	private record Hex(int q, int r) {
		int distance() { return Math.max(Math.abs(q), Math.max(Math.abs(r), Math.abs(-q - r))); }
		Hex add(Hex other) { return new Hex(q + other.q, r + other.r); }
		Hex multiply(int value) { return new Hex(q * value, r * value); }
	}
}
