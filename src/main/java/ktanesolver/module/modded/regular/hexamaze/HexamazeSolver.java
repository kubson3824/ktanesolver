package ktanesolver.module.modded.regular.hexamaze;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Base64;
import java.util.BitSet;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
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
	type = ModuleType.HEXAMAZE,
	id = "hexamaze",
	name = "Hexamaze",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Match the rotated markings and navigate the pawn through the exit indicated by its color.",
	tags = { "hexagon", "maze", "navigation", "modded" },
	hasInput = true,
	hasOutput = true
)
public class HexamazeSolver extends AbstractModuleSolver<HexamazeInput, HexamazeOutput> {
	private static final int SIZE = 12;
	private static final int WIDTH = 25;
	private static final String[] COLORS = { "RED", "YELLOW", "GREEN", "CYAN", "BLUE", "PINK" };
	private static final String[] DIRECTIONS = { "NW", "N", "NE", "SE", "S", "SW" };
	private static final BitSet WALLS = BitSet.valueOf(Base64.getDecoder().decode(
		"AAAAAACSBEkSBAAAAADt2cq0MwAAAIC32ZrtnwEAAID9a//v5g0AAIDebk0q5EgAAIDZ9uxpi2YDAIDZokRi21oTAIDVGNZmmdvIAADN3+Y2k5i1AoBNxGt725p1NYBnb2nb27S1s4Flg0uCrGdXbQ2/n91GDVm6TS280OB2rduC3TbgdWbahaxUrTsAeqbAru02bi0A8PMfIGxypTsAgDc6S0RxshUAAKyx3WZrazcAANCfyWa3bT0AAIDT3yootDMAAACcnrV5LT4AAADAlr5pyiIAAAAA9NV//z8AAAAASJIkQRIAAAAAAA=="));
	private static final Map<Integer, String> MARKINGS = Map.ofEntries(
		Map.entry(91, "HEXAGON"), Map.entry(119, "TRIANGLE_LEFT"), Map.entry(163, "CIRCLE"),
		Map.entry(166, "CIRCLE"), Map.entry(195, "HEXAGON"), Map.entry(234, "TRIANGLE_DOWN"),
		Map.entry(238, "TRIANGLE_UP"), Map.entry(270, "CIRCLE"), Map.entry(281, "TRIANGLE_RIGHT"),
		Map.entry(292, "TRIANGLE_RIGHT"), Map.entry(312, "HEXAGON"), Map.entry(355, "TRIANGLE_UP"),
		Map.entry(366, "CIRCLE"), Map.entry(385, "HEXAGON"), Map.entry(432, "CIRCLE"),
		Map.entry(436, "TRIANGLE_DOWN"), Map.entry(440, "TRIANGLE_RIGHT"),
		Map.entry(454, "TRIANGLE_LEFT"), Map.entry(508, "HEXAGON"));

	@Override
	protected SolveResult<HexamazeOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, HexamazeInput input) {
		if (input == null || input.markings() == null || input.markings().isEmpty()) {
			return failure("Enter the markings shown on the module");
		}
		Hex pawn = new Hex(input.pawnQ(), input.pawnR());
		if (pawn.distance() >= 4) {
			return failure("Pawn position must be inside the displayed hexagon");
		}
		int color = indexOf(COLORS, input.pawnColor());
		if (color < 0) {
			return failure("Pawn color must be red, yellow, green, cyan, blue, or pink");
		}
		Map<Hex, String> shown = new HashMap<>();
		for (var entry : input.markings().entrySet()) {
			String[] parts = entry.getKey().split(",", -1);
			try {
				Hex hex = new Hex(Integer.parseInt(parts[0]), Integer.parseInt(parts[1]));
				String marking = entry.getValue() == null ? "" : entry.getValue().toUpperCase(Locale.ROOT);
				if (parts.length != 2 || hex.distance() >= 4 || !List.of("CIRCLE", "TRIANGLE_UP", "TRIANGLE_DOWN", "TRIANGLE_LEFT", "TRIANGLE_RIGHT", "HEXAGON").contains(marking)) {
					return failure("Invalid marking at " + entry.getKey());
				}
				shown.put(hex, marking);
			} catch (RuntimeException ex) {
				return failure("Invalid marking coordinate: " + entry.getKey());
			}
		}

		List<Placement> matches = new ArrayList<>();
		for (Hex center : largeHexagon(9)) {
			for (int rotation = 0; rotation < 6; rotation++) {
				if (matches(center, rotation, shown)) matches.add(new Placement(center, rotation));
			}
		}
		if (matches.isEmpty()) return failure("No matching submaze; check every marking and its orientation");
		if (matches.size() > 1) return failure("Markings are ambiguous; enter every marking shown");

		Placement placement = matches.get(0);
		Hex start = pawn.rotate(-placement.rotation()).add(placement.center());
		List<Integer> path = findPath(start, placement.center(), color);
		if (path == null) return failure("No route to the required exit");
		List<String> moves = path.stream().map(dir -> DIRECTIONS[(dir + placement.rotation()) % 6]).toList();
		storeState(module, "input", input);
		return success(new HexamazeOutput(moves, placement.center().q(), placement.center().r(), placement.rotation() * 60, screenWalls(placement)));
	}

	/** Wall segments of the matched submaze in screen coordinates, as "q,r,dir" (dir 0-5 = NW,N,NE,SE,S,SW). */
	private static List<String> screenWalls(Placement placement) {
		List<String> walls = new ArrayList<>();
		for (Hex screen : largeHexagon(4)) {
			Hex global = screen.rotate(-placement.rotation()).add(placement.center());
			for (int dir = 0; dir < 6; dir++) {
				if (dir >= 3 && screen.neighbor(dir).distance() < 4) continue;
				if (hasWall(global, Math.floorMod(dir - placement.rotation(), 6))) {
					walls.add(screen.q() + "," + screen.r() + "," + dir);
				}
			}
		}
		return walls;
	}

	private static boolean matches(Hex center, int rotation, Map<Hex, String> shown) {
		for (Hex screen : largeHexagon(4)) {
			Hex global = screen.rotate(-rotation).add(center);
			String expected = rotateMarking(marking(global), rotation);
			if (!expected.equals(shown.getOrDefault(screen, "NONE"))) return false;
		}
		return true;
	}

	private static List<Integer> findPath(Hex start, Hex center, int exit) {
		ArrayDeque<Hex> queue = new ArrayDeque<>();
		Map<Hex, Hex> previous = new HashMap<>();
		Map<Hex, Integer> direction = new HashMap<>();
		queue.add(start);
		previous.put(start, null);
		while (!queue.isEmpty()) {
			Hex current = queue.remove();
			for (int dir = 0; dir < 6; dir++) {
				if (hasWall(current, dir)) continue;
				Hex next = current.neighbor(dir);
				int distance = next.subtract(center).distance();
				if (distance >= 4) {
					if (edges(next.subtract(center), 4).contains(exit)) return reconstruct(current, previous, direction, dir);
					continue;
				}
				if (!previous.containsKey(next)) {
					previous.put(next, current);
					direction.put(next, dir);
					queue.add(next);
				}
			}
		}
		return null;
	}

	private static List<Integer> reconstruct(Hex current, Map<Hex, Hex> previous, Map<Hex, Integer> direction, int exitDirection) {
		List<Integer> path = new ArrayList<>();
		while (previous.get(current) != null) {
			path.add(0, direction.get(current));
			current = previous.get(current);
		}
		path.add(exitDirection);
		return path;
	}

	private static boolean hasWall(Hex hex, int dir) {
		if (dir >= 3) return hasWall(hex.neighbor(dir), dir - 3);
		return WALLS.get(3 * WIDTH * (hex.q() + SIZE) + 3 * (hex.r() + SIZE) + dir);
	}

	private static String marking(Hex hex) {
		return MARKINGS.getOrDefault((hex.q() + SIZE) * WIDTH + hex.r() + SIZE, "NONE");
	}

	private static String rotateMarking(String marking, int rotation) {
		if (marking.equals("TRIANGLE_UP") || marking.equals("TRIANGLE_DOWN")) {
			return rotation % 2 == 0 ? marking : marking.equals("TRIANGLE_UP") ? "TRIANGLE_DOWN" : "TRIANGLE_UP";
		}
		if (marking.equals("TRIANGLE_LEFT") || marking.equals("TRIANGLE_RIGHT")) {
			return rotation % 2 == 0 ? marking : marking.equals("TRIANGLE_LEFT") ? "TRIANGLE_RIGHT" : "TRIANGLE_LEFT";
		}
		return marking;
	}

	private static List<Hex> largeHexagon(int sideLength) {
		List<Hex> result = new ArrayList<>();
		for (int r = -sideLength + 1; r < sideLength; r++)
			for (int q = -sideLength + 1; q < sideLength; q++) {
				Hex hex = new Hex(q, r);
				if (hex.distance() < sideLength) result.add(hex);
			}
		return result;
	}

	private static List<Integer> edges(Hex hex, int size) {
		List<Integer> result = new ArrayList<>();
		if (hex.q() + hex.r() == -size) result.add(0);
		if (hex.r() == -size) result.add(1);
		if (hex.q() == size) result.add(2);
		if (hex.q() + hex.r() == size) result.add(3);
		if (hex.r() == size) result.add(4);
		if (hex.q() == -size) result.add(5);
		return result;
	}

	private static int indexOf(String[] values, String value) {
		if (value == null) return -1;
		for (int i = 0; i < values.length; i++) if (values[i].equalsIgnoreCase(value)) return i;
		return -1;
	}

	private record Placement(Hex center, int rotation) {}
	private record Hex(int q, int r) {
		int distance() { return Math.max(Math.abs(q), Math.max(Math.abs(r), Math.abs(-q - r))); }
		Hex add(Hex other) { return new Hex(q + other.q, r + other.r); }
		Hex subtract(Hex other) { return new Hex(q - other.q, r - other.r); }
		Hex neighbor(int dir) { return add(new Hex[] { new Hex(-1, 0), new Hex(0, -1), new Hex(1, -1), new Hex(1, 0), new Hex(0, 1), new Hex(-1, 1) }[dir]); }
		Hex rotate(int rotation) {
			return switch (Math.floorMod(rotation, 6)) {
				case 0 -> this;
				case 1 -> new Hex(-r, q + r);
				case 2 -> new Hex(-q - r, q);
				case 3 -> new Hex(-q, -r);
				case 4 -> new Hex(r, -q - r);
				default -> new Hex(q + r, -q);
			};
		}
	}
}
