package ktanesolver.module.modded.regular.ultracube;

import static java.util.Map.entry;

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
@ModuleInfo(type = ModuleType.THE_ULTRACUBE, id = "TheUltracubeModule", name = "The Ultracube",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Translate five 5D rotations into four target face-and-color vertex presses.",
	tags = {"ultracube", "rotations", "colors", "vertices", "5d"})
public class UltracubeSolver extends AbstractModuleSolver<UltracubeInput, UltracubeOutput> {
	private static final Map<String, Rule> RULES = Map.ofEntries(
		entry("XY", new Rule("zag-top-right", "RBGY")),
		entry("YX", new Rule("ping-top-back", "YBRG")),
		entry("XZ", new Rule("top-back-right", "YGBR")),
		entry("ZX", new Rule("zag-front-right", "RBYG")),
		entry("XW", new Rule("pong-top-left", "BRYG")),
		entry("WX", new Rule("ping-zig-back", "RYGB")),
		entry("XV", new Rule("bottom-back-right", "BYRG")),
		entry("VX", new Rule("ping-zig-top", "YRGB")),
		entry("YZ", new Rule("zig-top-back", "BYGR")),
		entry("ZY", new Rule("zag-top-back", "BGRY")),
		entry("YW", new Rule("pong-back-left", "BRGY")),
		entry("WY", new Rule("zag-bottom-right", "GRYB")),
		entry("YV", new Rule("zig-front-right", "YGRB")),
		entry("VY", new Rule("pong-top-right", "YRBG")),
		entry("ZW", new Rule("pong-zag-right", "GRBY")),
		entry("WZ", new Rule("ping-bottom-back", "GYBR")),
		entry("ZV", new Rule("ping-zig-bottom", "GBRY")),
		entry("VZ", new Rule("pong-zag-left", "RGBY")),
		entry("WV", new Rule("ping-zag-back", "GYRB")),
		entry("VW", new Rule("pong-back-right", "BGYR"))
	);

	@Override
	protected SolveResult<UltracubeOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, UltracubeInput input) {
		if (input == null || input.rotations() == null || input.vertexColors() == null)
			return failure("Enter five rotations and all thirty-two current vertex colors");
		if (input.rotations().size() != 5)
			return failure("Enter exactly five rotations");
		if (input.stage() < 1 || input.stage() > 4)
			return failure("Stage must be between 1 and 4");
		if (input.vertexColors().size() != 32)
			return failure("Enter thirty-two vertex colors in binary vertex order");

		List<String> rotations = input.rotations().stream()
			.map(value -> value == null ? "" : value.trim().toUpperCase(Locale.ROOT))
			.toList();
		if (rotations.stream().anyMatch(rotation -> !RULES.containsKey(rotation)))
			return failure("Enter valid ordered rotation pairs using X, Y, Z, W, and V");

		List<String> colors = input.vertexColors().stream()
			.map(value -> value == null ? "" : value.trim().toUpperCase(Locale.ROOT))
			.toList();
		if (colors.stream().anyMatch(color -> !color.matches("RED|YELLOW|GREEN|BLUE")))
			return failure("Vertex colors must be red, yellow, green, or blue");

		String face = RULES.get(rotations.get(input.stage() - 1)).face();
		String targetColor = colorName(RULES.get(rotations.get(4)).order().charAt(input.stage() - 1));
		int targetVertex = -1;
		for (int vertex = 0; vertex < 32; vertex++) {
			if (!onFace(vertex, face) || !colors.get(vertex).equals(targetColor))
				continue;
			if (targetVertex >= 0)
				return failure("The target color must occur exactly once on the target face");
			targetVertex = vertex;
		}
		if (targetVertex < 0)
			return failure("The target color is missing from the target face");

		storeState(module, "ultracubeRotations", rotations);
		return success(new UltracubeOutput(input.stage(), face, targetColor, vertexName(targetVertex)), input.stage() == 4);
	}

	private static String colorName(char color) {
		return switch (color) {
			case 'R' -> "RED";
			case 'Y' -> "YELLOW";
			case 'G' -> "GREEN";
			default -> "BLUE";
		};
	}

	private static boolean onFace(int vertex, String face) {
		for (String coordinate : face.split("-")) {
			boolean matches = switch (coordinate) {
				case "left" -> (vertex & 1) == 0;
				case "right" -> (vertex & 1) != 0;
				case "bottom" -> (vertex & 2) == 0;
				case "top" -> (vertex & 2) != 0;
				case "front" -> (vertex & 4) == 0;
				case "back" -> (vertex & 4) != 0;
				case "zig" -> (vertex & 8) == 0;
				case "zag" -> (vertex & 8) != 0;
				case "ping" -> (vertex & 16) == 0;
				case "pong" -> (vertex & 16) != 0;
				default -> false;
			};
			if (!matches)
				return false;
		}
		return true;
	}

	private static String vertexName(int vertex) {
		return ((vertex & 16) == 0 ? "ping" : "pong") + "-"
			+ ((vertex & 8) == 0 ? "zig" : "zag") + "-"
			+ ((vertex & 2) == 0 ? "bottom" : "top") + "-"
			+ ((vertex & 4) == 0 ? "front" : "back") + "-"
			+ ((vertex & 1) == 0 ? "left" : "right");
	}

	private record Rule(String face, String order) {}
}
