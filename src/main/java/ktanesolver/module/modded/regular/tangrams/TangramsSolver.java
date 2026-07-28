package ktanesolver.module.modded.regular.tangrams;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
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
	type = ModuleType.TANGRAMS,
	id = "Tangrams",
	name = "Tangrams",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Reconstruct the tangram circuit and find three positive-to-negative pin paths",
	tags = {"circuit", "path", "tangram", "modded"}
)
public class TangramsSolver extends AbstractModuleSolver<TangramsInput, TangramsOutput> {
	private static final Map<Character, String[]> PIECES = Map.of(
		'L', new String[] {
			"15//6/4/3/01/2/26", "6/237//27//06/0/23", "72///42/32//072/02", "3////2///2"
		},
		'M', new String[] {
			"134//5/014/013/2", "/3///20/420", "5/2/1/214/321/0", "1/0/10//210/210"
		},
		'S', new String[] {
			"2/3/0/1", "1/0/3/2", "23/23/3/2", "3/2/1/0",
			"/3//1", "123/2/1/012", "/32//12", "/2/1/12"
		},
		'Q', new String[] {"3/03//0", "/0/10/0", "2/3/0/1"},
		'P', new String[] {"35/24/14///03", "1/0//01/25/", "3/4/5/0/1/2", "1234///42//01234"}
	);

	private static final Map<String, Grid> GRIDS = Map.of(
		"TAN-D:6", new Grid(
			"MSSSSQ",
			"0:0-1:3,0:1-1:2,1:1-5:2,2:0-5:1,2:2-4:3,2:3-4:2,3:0-4:1,0:2-3:3,0:3-3:2",
			"5:0,2:1,4:0,3:1,0:4,0:5,1:0,5:3"
		),
		"TAN-D:7", new Grid(
			"LLLMSSQ",
			"0:4-1:7,0:5-1:6,0:6-1:5,0:7-1:4,1:0-3:5,1:1-3:4,1:2-4:1,1:3-6:3,"
				+ "2:4-4:3,2:5-4:2,2:6-3:3,2:7-3:2,3:0-5:3,3:1-5:2,4:0-6:0",
			"2:2,2:3,6:1,6:2,0:0,0:1,0:2,0:3,5:0,5:1,2:0,2:1"
		),
		"TAN-D:9", new Grid(
			"LLMSSSSQP",
			"0:4-8:5,0:5-8:4,0:6-3:3,0:7-3:2,1:4-5:3,1:5-5:2,1:6-2:3,1:7-2:2,"
				+ "2:4-4:0,2:5-8:0,3:0-8:3,3:1-7:3,4:1-5:1,4:2-8:2,4:3-8:1,5:0-7:0,"
				+ "2:0-6:3,2:1-6:2",
			"6:1,1:0,1:1,1:2,1:3,7:1,7:2,0:0,0:1,0:2,0:3,6:0"
		),
		"TAN-S:7", new Grid(
			"LLMSSQP",
			"0:0-1:3,0:1-1:2,0:2-4:0,0:3-6:3,1:0-3:1,1:1-5:3,2:4-6:0,2:5-5:1,"
				+ "3:0-5:0,4:2-6:5,4:3-6:4,4:1-5:2",
			"1:4,1:5,1:6,1:7,3:2,3:3,2:0,2:1,2:2,2:3,6:1,6:2,0:4,0:5,0:6,0:7"
		),
		"TAN-S:8", new Grid(
			"LLSSSSQP",
			"0:0-2:1,0:1-6:2,0:2-4:0,0:3-7:3,1:0-5:1,1:1-4:1,1:2-6:1,1:3-3:0,"
				+ "2:0-6:3,3:1-6:0,4:2-7:5,4:3-7:4,5:0-7:0",
			"2:2,2:3,3:2,3:3,1:4,1:5,1:6,1:7,5:2,5:3,7:1,7:2,0:4,0:5,0:6,0:7"
		),
		"TAN-S:9", new Grid(
			"LMMSSSSQP",
			"0:0-2:5,0:1-2:4,0:2-6:0,0:3-8:3,1:4-8:0,1:5-7:0,2:2-3:3,2:3-3:2,"
				+ "3:0-4:1,3:1-7:2,4:0-5:1,5:0-7:3,6:1-7:1,6:2-8:5,6:3-8:4",
			"5:2,5:3,1:0,1:1,1:2,1:3,8:1,8:2,0:4,0:5,0:6,0:7,2:0,2:1,4:2,4:3"
		)
	);

	@Override
	protected SolveResult<TangramsOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, TangramsInput input
	) {
		if (input.chipType() == null || input.chipCode() == null) {
			return failure("Enter the chip type and code");
		}

		String chipType = input.chipType().trim().toUpperCase(Locale.ROOT);
		String chipCode = input.chipCode().trim();
		if (!chipType.equals("TAN-S") && !chipType.equals("TAN-D")) {
			return failure("Chip type must be TAN-S or TAN-D");
		}
		if (!chipCode.matches("\\d+")) {
			return failure("Chip code must contain digits only");
		}

		Grid grid = GRIDS.get(chipType + ":" + chipCode.length());
		if (grid == null) {
			return failure("No " + chipType + " template uses " + chipCode.length() + " pieces");
		}

		List<String[]> pieces = new ArrayList<>();
		Set<String> usedPieces = new HashSet<>();
		for (int cell = 0; cell < grid.shapes().length(); cell++) {
			char shape = grid.shapes().charAt(cell);
			int pieceIndex = chipCode.charAt(cell) - '1';
			String[] variants = PIECES.get(shape);
			if (pieceIndex < 0 || pieceIndex >= variants.length) {
				return failure("Piece " + chipCode.charAt(cell) + " is not available for cell " + (cell + 1));
			}
			if (!usedPieces.add(shape + ":" + pieceIndex)) {
				return failure("The same piece cannot appear twice in the chip code");
			}
			pieces.add(variants[pieceIndex].split("/", -1));
		}

		Map<Point, Point> links = parseLinks(grid.links());
		List<Point> external = parsePoints(grid.external());
		Map<Point, Integer> externalIndexes = new HashMap<>();
		for (int index = 0; index < external.size(); index++) externalIndexes.put(external.get(index), index);

		List<TangramsConnection> solution = new ArrayList<>();
		for (int source = 0; source < external.size() && solution.size() < 3; source++) {
			LinkedHashSet<Integer> targets = new LinkedHashSet<>();
			walk(
				external.get(source), external.get(source), pieces, links, externalIndexes,
				new HashSet<>(), targets
			);
			if (!targets.isEmpty()) {
				solution.add(new TangramsConnection(source + 1, targets.iterator().next() + 1));
			}
		}

		return solution.size() == 3
			? success(new TangramsOutput(solution))
			: failure("This code does not produce three valid positive pins; check the displayed code");
	}

	private static void walk(
		Point point,
		Point start,
		List<String[]> pieces,
		Map<Point, Point> links,
		Map<Point, Integer> externalIndexes,
		Set<Point> visited,
		Set<Integer> targets
	) {
		if (!visited.add(point)) return;
		for (char destination : pieces.get(point.cell())[point.pin()].toCharArray()) {
			Point exit = new Point(point.cell(), destination - '0');
			Point linked = links.get(exit);
			if (linked != null) {
				walk(linked, start, pieces, links, externalIndexes, visited, targets);
			} else {
				Integer externalIndex = externalIndexes.get(exit);
				if (externalIndex != null && !exit.equals(start)) targets.add(externalIndex);
			}
		}
	}

	private static Map<Point, Point> parseLinks(String encoded) {
		Map<Point, Point> links = new HashMap<>();
		for (String link : encoded.split(",")) {
			String[] ends = link.split("-");
			Point first = parsePoint(ends[0]);
			Point second = parsePoint(ends[1]);
			links.put(first, second);
			links.put(second, first);
		}
		return links;
	}

	private static List<Point> parsePoints(String encoded) {
		List<Point> points = new ArrayList<>();
		for (String point : encoded.split(",")) points.add(parsePoint(point));
		return points;
	}

	private static Point parsePoint(String encoded) {
		String[] parts = encoded.split(":");
		return new Point(Integer.parseInt(parts[0]), Integer.parseInt(parts[1]));
	}

	private record Point(int cell, int pin) {}

	private record Grid(String shapes, String links, String external) {}
}
