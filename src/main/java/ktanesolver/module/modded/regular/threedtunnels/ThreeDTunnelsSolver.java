package ktanesolver.module.modded.regular.threedtunnels;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

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
	type = ModuleType.THREE_D_TUNNELS,
	id = "3dTunnels",
	name = "3D Tunnels",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Localize from the five tunnel walls, navigate to each symbol, and submit three goals.",
	tags = {"3d", "maze", "orientation", "symbols", "stages"}
)
public class ThreeDTunnelsSolver extends AbstractModuleSolver<ThreeDTunnelsInput, ThreeDTunnelsOutput> {
	static final String SYMBOLS = "ghidefabcpqrmnojklyz.vwxstu";
	private static final List<Vec> AXES = List.of(
		new Vec(1, 0, 0), new Vec(-1, 0, 0), new Vec(0, 1, 0),
		new Vec(0, -1, 0), new Vec(0, 0, 1), new Vec(0, 0, -1));
	private static final List<Orientation> ORIENTATIONS = orientations();
	private static final List<String> ACTIONS = List.of("U", "R", "D", "L");

	@Override
	protected SolveResult<ThreeDTunnelsOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, ThreeDTunnelsInput input
	) {
		String error = validate(input);
		if (error != null) return failure(error);
		String target = input.targetSymbol().trim().toLowerCase();
		Object tracked = module.getState().get("trackingTarget");
		if (!input.restartTracking() && tracked instanceof String value && !value.isBlank() && !target.equals(value))
			return failure("The goal symbol changed before the previous goal was submitted; restart tracking if the physical state changed");

		List<Integer> candidates = input.restartTracking() ? allStates() : storedCandidates(module);
		if (candidates.isEmpty()) candidates = allStates();
		candidates = filter(candidates, input);
		if (candidates.isEmpty()) return failure("No position and orientation matches this symbol and wall observation");
		int stage = completedTargets(module) + 1;

		if (candidates.size() > 1) {
			List<Integer> visits = storedIntegers(module, "explorationVisits");
			visits = new ArrayList<>(visits); visits.add(location(candidates.get(0)));
			String action = explorationAction(candidates, input, visits);
			if (action == null) return failure("No safe move matches the entered wall observation");
			List<Integer> advanced = candidates.stream().map(state -> advance(state, action)).filter(state -> state >= 0).distinct().toList();
			storeState(module, Map.of("candidates", advanced, "trackingTarget", target, "explorationVisits", visits));
			return success(new ThreeDTunnelsOutput(stage, target, List.of(action), true, candidates.size()), false);
		}

		int current = candidates.get(0);
		List<String> route = route(current, SYMBOLS.indexOf(target.charAt(0)));
		if (route == null) return failure("No route to the selected target exists");
		int end = current;
		for (String action : route) end = advance(end, action);
		List<String> commands = new ArrayList<>(route); commands.add("SUBMIT");
		Map<String, Object> next = new HashMap<>();
		next.put("candidates", List.of(end));
		next.put("trackingTarget", "");
		next.put("explorationVisits", List.of());
		next.put("target" + stage, target);
		storeState(module, next);
		return success(new ThreeDTunnelsOutput(stage, target, commands, false, 1), stage == 3);
	}

	private static String validate(ThreeDTunnelsInput input) {
		if (input == null || input.targetSymbol() == null || input.targetSymbol().trim().length() != 1
			|| SYMBOLS.indexOf(Character.toLowerCase(input.targetSymbol().trim().charAt(0))) < 0)
			return "Select the displayed goal symbol";
		if (input.currentSymbol() != null && !input.currentSymbol().isBlank()
			&& (input.currentSymbol().trim().length() != 1 || SYMBOLS.indexOf(Character.toLowerCase(input.currentSymbol().trim().charAt(0))) < 0))
			return "Current symbol must be one of the 27 manual symbols or blank";
		if (input.frontWall() == null || input.leftWall() == null || input.rightWall() == null || input.upWall() == null || input.downWall() == null)
			return "Enter whether a wall is visible in all five directions";
		return null;
	}

	private static List<Integer> storedCandidates(ModuleEntity module) {
		return storedIntegers(module, "candidates");
	}

	private static List<Integer> storedIntegers(ModuleEntity module, String key) {
		Object value = module.getState().get(key);
		if (!(value instanceof Collection<?> collection)) return List.of();
		return collection.stream().filter(Number.class::isInstance).map(Number.class::cast).map(Number::intValue).toList();
	}

	private static int completedTargets(ModuleEntity module) {
		int count = 0; while (module.getState().containsKey("target" + (count + 1))) count++; return count;
	}

	private static List<Integer> filter(List<Integer> candidates, ThreeDTunnelsInput input) {
		String symbol = input.currentSymbol() == null ? "" : input.currentSymbol().trim().toLowerCase();
		int location = symbol.isEmpty() ? -1 : SYMBOLS.indexOf(symbol.charAt(0));
		int walls = wallKey(input.frontWall(), input.leftWall(), input.rightWall(), input.upWall(), input.downWall());
		return candidates.stream().filter(state -> (location < 0 || location(state) == location) && wallKey(state) == walls).distinct().toList();
	}

	private static String explorationAction(List<Integer> candidates, ThreeDTunnelsInput input, List<Integer> visits) {
		Map<String, Boolean> walls = Map.of("U", input.upWall(), "R", input.rightWall(), "D", input.downWall(), "L", input.leftWall());
		Comparator<String> score = input.currentSymbol() == null || input.currentSymbol().isBlank()
			? Comparator.<String>comparingLong(action -> visits.stream().filter(visitedLocation -> visitedLocation == location(advance(candidates.get(0), action))).count())
				.thenComparingInt(action -> worstPartition(candidates, action))
			: Comparator.comparingInt(action -> worstPartition(candidates, action));
		return ACTIONS.stream().filter(action -> !walls.get(action) && candidates.stream().allMatch(state -> advance(state, action) >= 0)).min(score).orElse(null);
	}

	private static int worstPartition(List<Integer> candidates, String action) {
		Map<Integer, Integer> groups = new HashMap<>();
		for (int state : candidates) groups.merge(wallKey(advance(state, action)), 1, Integer::sum);
		return groups.values().stream().mapToInt(Integer::intValue).max().orElse(Integer.MAX_VALUE);
	}

	static List<String> route(int start, int targetLocation) {
		ArrayDeque<Integer> queue = new ArrayDeque<>(); queue.add(start);
		Map<Integer, Step> parent = new HashMap<>(); parent.put(start, null);
		int end = -1;
		while (!queue.isEmpty()) {
			int state = queue.remove();
			if (location(state) == targetLocation) { end = state; break; }
			for (String action : ACTIONS) {
				int next = advance(state, action);
				if (next >= 0 && !parent.containsKey(next)) { parent.put(next, new Step(state, action)); queue.add(next); }
			}
		}
		if (end < 0) return null;
		ArrayList<String> result = new ArrayList<>();
		while (end != start) { Step step = parent.get(end); result.add(step.action()); end = step.parent(); }
		java.util.Collections.reverse(result); return result;
	}

	static int state(int location, Vec forward, Vec up) {
		return location * ORIENTATIONS.size() + ORIENTATIONS.indexOf(new Orientation(forward, up));
	}

	static int advance(int state, String action) {
		int location = location(state); Orientation orientation = orientation(state);
		Orientation turned = turn(orientation, action); Vec position = position(location).plus(turned.forward());
		if (!inside(position)) return -1;
		return state(location(position), turned.forward(), turned.up());
	}

	static int wallKey(int state) {
		int location = location(state); Orientation orientation = orientation(state); Vec left = cross(orientation.forward(), orientation.up());
		return wallKey(wall(location, orientation.forward()), wall(location, left), wall(location, left.negate()), wall(location, orientation.up()), wall(location, orientation.up().negate()));
	}

	private static int wallKey(boolean front, boolean left, boolean right, boolean up, boolean down) {
		return (front ? 1 : 0) | (left ? 2 : 0) | (right ? 4 : 0) | (up ? 8 : 0) | (down ? 16 : 0);
	}

	private static boolean wall(int location, Vec direction) { return !inside(position(location).plus(direction)); }
	private static boolean inside(Vec value) { return value.x() >= 0 && value.x() < 3 && value.y() >= 0 && value.y() < 3 && value.z() >= 0 && value.z() < 3; }
	private static int location(int state) { return state / ORIENTATIONS.size(); }
	private static Orientation orientation(int state) { return ORIENTATIONS.get(state % ORIENTATIONS.size()); }
	private static Vec position(int location) { return new Vec(location % 3, (location / 3) % 3, location / 9); }
	private static int location(Vec position) { return position.x() + 3 * (position.y() + 3 * position.z()); }

	private static Orientation turn(Orientation orientation, String action) {
		Vec forward = orientation.forward(), up = orientation.up(), left = cross(forward, up);
		return switch (action) {
			case "U" -> new Orientation(up, forward.negate());
			case "D" -> new Orientation(up.negate(), forward);
			case "L" -> new Orientation(left, up);
			case "R" -> new Orientation(left.negate(), up);
			default -> throw new IllegalArgumentException("Unknown action " + action);
		};
	}

	private static List<Integer> allStates() {
		List<Integer> result = new ArrayList<>(648);
		for (int location = 0; location < 27; location++) for (int orientation = 0; orientation < ORIENTATIONS.size(); orientation++) result.add(location * ORIENTATIONS.size() + orientation);
		return result;
	}

	private static List<Orientation> orientations() {
		LinkedHashSet<Orientation> result = new LinkedHashSet<>();
		for (Vec forward : AXES) for (Vec up : AXES) if (dot(forward, up) == 0) result.add(new Orientation(forward, up));
		return List.copyOf(result);
	}

	private static int dot(Vec one, Vec two) { return one.x() * two.x() + one.y() * two.y() + one.z() * two.z(); }
	private static Vec cross(Vec one, Vec two) { return new Vec(one.y() * two.z() - one.z() * two.y(), one.z() * two.x() - one.x() * two.z(), one.x() * two.y() - one.y() * two.x()); }

	record Vec(int x, int y, int z) { Vec plus(Vec other) { return new Vec(x + other.x, y + other.y, z + other.z); } Vec negate() { return new Vec(-x, -y, -z); } }
	private record Orientation(Vec forward, Vec up) {}
	private record Step(int parent, String action) {}
}
