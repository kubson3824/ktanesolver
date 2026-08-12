package ktanesolver.module.modded.regular.labyrinth;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
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
	type = ModuleType.THE_LABYRINTH,
	id = "labyrinth",
	name = "The Labyrinth",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Navigate five fixed maze layers through visible and remembered portals.",
	tags = {"maze", "navigation", "multi-stage", "portals"}
)
public class LabyrinthSolver extends AbstractModuleSolver<LabyrinthInput, LabyrinthOutput> {
	private static final Set<String> POSITIONS = Set.copyOf(List.of(
		"A1", "B1", "C1", "D1", "E1",
		"A2", "B2", "C2", "D2", "E2", "F2",
		"A3", "B3", "C3", "D3", "E3", "F3",
		"A4", "B4", "C4", "D4", "E4", "F4",
		"A5", "B5", "C5", "D5", "E5", "F5",
		"A6", "B6", "C6", "D6", "E6", "F6",
		"A7", "B7", "C7", "D7", "E7", "F7"
	));
	private static final List<Map<String, String>> MAZES = List.of(
		maze("R RDL L RD L -", "RD UL RD UL RD L", "URD L UR DL URD DL", "UR DL RD UL U UD", "RD UL UR DL R UDL", "UD R DL UR RDL UL", "UR RL URL L UR L"),
		maze("RD DL RD RL DL -", "U UR UDL D UD D", "R DL UR UDL UR UDL", "D URD L UR DL UD", "UD URD L D URD UDL", "URD URDL L UR UDL UD", "U U R RL UL U"),
		maze("RD RL RL L D -", "UR RL RDL L UR DL", "R RDL UL D RD UDL", "D UR DL UR UL UD", "URD RDL UL D RD UL", "U UD D URD UL D", "R URL UL UR RL UL"),
		maze("RD L RD L D -", "UD R UDL RD UDL D", "UR RL URDL UL UR UL", "R RL UDL RD RDL DL", "R RL UL U U UD", "RD RL RL RL RDL UL", "UR RL RL L UR L"),
		maze("R DL R RDL L -", "D URD DL URD RDL L", "URD UL URD UL URD L", "URD DL URD L URD DL", "UD UR UDL RD UDL U", "URD L URD UL URD DL", "U R UL R UL U")
	);
	private static final Map<Character, String> DIRECTION_NAMES = Map.of('U', "UP", 'L', "LEFT", 'R', "RIGHT", 'D', "DOWN");

	@Override
	protected SolveResult<LabyrinthOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, LabyrinthInput input
	) {
		if (input == null || input.layer() == null || input.current() == null || input.portal1() == null || input.portal2() == null) {
			return failure("Enter the current layer, location, and both visible portals");
		}
		if (input.layer() < 1 || input.layer() > 5) return failure("The layer must be from 1 through 5");
		String current = coordinate(input.current()), portal1 = coordinate(input.portal1()), portal2 = coordinate(input.portal2());
		if (current == null || portal1 == null || portal2 == null) return failure("Coordinates must be A1-E1 or A2-F7");
		if (portal1.equals(portal2)) return failure("The two portals must be different locations");
		if (current.equals(portal1) || current.equals(portal2)) return failure("A portal cannot occupy the current location");

		List<List<String>> portals = input.layer() == 1 ? new ArrayList<>() : portalHistory(module.getState().get("labyrinthPortals"));
		int expectedLayer = input.layer() == 1 ? 1 : number(module.getState().get("labyrinthNextLayer"));
		String expectedCurrent = input.layer() == 1 ? current : coordinate(String.valueOf(module.getState().get("labyrinthCurrent")));
		if (expectedLayer != input.layer() || portals.size() != input.layer() - 1 || !current.equals(expectedCurrent)) {
			return failure("The saved route does not match this layer; restart at layer 1 after a strike or reset");
		}

		portals.add(List.of(portal1, portal2));
		List<LabyrinthOutput.Step> steps = new ArrayList<>();
		LabyrinthOutput.Step ascent = step(input.layer(), "ASCENT", current, Set.of(portal1, portal2));
		if (ascent == null) return failure("No route reaches either portal; recheck the coordinates");
		steps.add(ascent);
		current = ascent.destination();

		if (input.layer() == 5) {
			for (int layer = 4; layer >= 1; layer--) {
				LabyrinthOutput.Step descent = step(layer, "DESCENT", current, Set.copyOf(portals.get(layer - 1)));
				if (descent == null) return failure("The recorded portals do not form a complete descent route");
				steps.add(descent);
				current = descent.destination();
			}
		}

		List<List<String>> savedPortals = portals.stream().map(List::copyOf).toList();
		int nextLayer = input.layer() == 5 ? 0 : input.layer() + 1;
		storeState(module, "labyrinthPortals", savedPortals);
		storeState(module, "labyrinthCurrent", current);
		storeState(module, "labyrinthNextLayer", nextLayer);
		return success(new LabyrinthOutput(nextLayer, List.copyOf(steps), savedPortals), input.layer() == 5);
	}

	static List<String> route(int layer, String start, Set<String> targets) {
		Map<String, String> maze = MAZES.get(layer - 1);
		ArrayDeque<String> queue = new ArrayDeque<>(List.of(start));
		Map<String, Previous> previous = new HashMap<>();
		previous.put(start, null);
		String destination = null;
		while (!queue.isEmpty()) {
			String current = queue.remove();
			if (targets.contains(current)) { destination = current; break; }
			for (char direction : "ULRD".toCharArray()) {
				if (!maze.get(current).contains(String.valueOf(direction))) continue;
				String next = move(current, direction);
				if (next != null && !previous.containsKey(next)) {
					previous.put(next, new Previous(current, direction));
					queue.add(next);
				}
			}
		}
		if (destination == null) return null;
		ArrayList<String> directions = new ArrayList<>();
		for (String at = destination; !at.equals(start); ) {
			Previous hop = previous.get(at);
			directions.add(DIRECTION_NAMES.get(hop.direction()));
			at = hop.coordinate();
		}
		java.util.Collections.reverse(directions);
		return directions;
	}

	static Set<String> positions() { return POSITIONS; }

	private static LabyrinthOutput.Step step(int layer, String phase, String start, Set<String> targets) {
		List<String> directions = route(layer, start, targets);
		if (directions == null) return null;
		String destination = start;
		for (String direction : directions) destination = move(destination, direction.charAt(0));
		return new LabyrinthOutput.Step(layer, phase, start, destination, directions);
	}

	private static String move(String coordinate, char direction) {
		int column = coordinate.charAt(0), row = coordinate.charAt(1) - '0';
		switch (direction) {
			case 'U' -> row--;
			case 'D' -> row++;
			case 'L' -> column--;
			case 'R' -> column++;
			default -> { return null; }
		}
		String next = String.valueOf((char) column) + row;
		return POSITIONS.contains(next) ? next : null;
	}

	private static Map<String, String> maze(String... rows) {
		Map<String, String> maze = new LinkedHashMap<>();
		for (int row = 0; row < rows.length; row++) {
			String[] cells = rows[row].split(" ");
			for (int column = 0; column < cells.length; column++) {
				if (!cells[column].equals("-")) maze.put(String.valueOf((char) ('A' + column)) + (row + 1), cells[column]);
			}
		}
		return Map.copyOf(maze);
	}

	private static String coordinate(String value) {
		String coordinate = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
		return POSITIONS.contains(coordinate) ? coordinate : null;
	}

	private static int number(Object value) { return value instanceof Number number ? number.intValue() : -1; }
	private static List<List<String>> portalHistory(Object value) {
		if (!(value instanceof List<?> list)) return new ArrayList<>();
		List<List<String>> result = new ArrayList<>();
		for (Object item : list) {
			if (!(item instanceof List<?> pair) || pair.size() != 2) return new ArrayList<>();
			result.add(pair.stream().map(String::valueOf).toList());
		}
		return result;
	}

	private record Previous(String coordinate, char direction) {}
}
