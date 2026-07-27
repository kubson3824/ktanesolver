package ktanesolver.module.modded.regular.legos;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
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
import ktanesolver.module.modded.regular.legos.LegosInput.Color;
import ktanesolver.module.modded.regular.legos.LegosInput.Connection;
import ktanesolver.module.modded.regular.legos.LegosInput.Piece;

@Service
@ModuleInfo(
	type = ModuleType.LEGOS,
	id = "LEGOModule",
	name = "LEGOs",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Reconstruct the six-brick structure and calculate its 8×8 submission.",
	tags = {"construction", "grid", "spatial", "colors"}
)
public class LegosSolver extends AbstractModuleSolver<LegosInput, LegosOutput> {
	private enum Direction { NORTH, WEST, SOUTH, EAST }
	private record Position(int x, int y, int z) {
		Position plus(Edge edge) {
			return new Position(x + edge.dx, y + edge.dy, z + edge.dz);
		}
	}
	private record Edge(Color target, int dx, int dy, int dz) {}

	@Override
	protected SolveResult<LegosOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, LegosInput input
	) {
		if (input == null || input.pieces() == null || input.connections() == null) {
			return failure("Pieces and instruction pages are required");
		}

		EnumMap<Color, Piece> pieces = new EnumMap<>(Color.class);
		for (Piece piece : input.pieces()) {
			if (piece == null || piece.color() == null) return failure("Every piece needs a color");
			if (!validSize(piece.width(), piece.depth())) {
				return failure("Piece sizes must be 2×2, 3×1, 3×2, 4×1, or 4×2");
			}
			if (pieces.put(piece.color(), piece) != null) return failure("Each piece color can appear only once");
		}
		if (pieces.size() != Color.values().length) return failure("Enter all six colored pieces");
		if (input.connections().size() < 5) return failure("At least five instruction pages are required");

		EnumMap<Color, List<Edge>> graph = new EnumMap<>(Color.class);
		for (Color color : Color.values()) graph.put(color, new ArrayList<>());
		for (Connection connection : input.connections()) {
			if (connection == null || connection.bottom() == null || connection.top() == null) {
				return failure("Every instruction page needs a top and bottom piece");
			}
			if (connection.bottom() == connection.top()) return failure("A piece cannot connect to itself");
			graph.get(connection.bottom()).add(new Edge(connection.top(), connection.offsetX(), connection.offsetY(), 1));
			graph.get(connection.top()).add(new Edge(connection.bottom(), -connection.offsetX(), -connection.offsetY(), -1));
		}

		EnumMap<Color, Position> positions = new EnumMap<>(Color.class);
		ArrayDeque<Color> queue = new ArrayDeque<>();
		positions.put(Color.RED, new Position(0, 0, 0));
		queue.add(Color.RED);
		while (!queue.isEmpty()) {
			Color color = queue.remove();
			for (Edge edge : graph.get(color)) {
				Position expected = positions.get(color).plus(edge);
				Position existing = positions.putIfAbsent(edge.target(), expected);
				if (existing == null) queue.add(edge.target());
				else if (!existing.equals(expected)) return failure("Instruction pages contradict one another");
			}
		}
		if (positions.size() != Color.values().length) return failure("Instruction pages must connect all six pieces");

		for (Connection connection : input.connections()) {
			if (!overlaps(pieces.get(connection.bottom()), positions.get(connection.bottom()),
				pieces.get(connection.top()), positions.get(connection.top()))) {
				return failure("Each instruction page must show overlapping connected pieces");
			}
		}
		for (Color first : Color.values()) {
			for (Color second : Color.values()) {
				if (first.ordinal() >= second.ordinal()) continue;
				Position a = positions.get(first);
				Position b = positions.get(second);
				if (a.z == b.z && overlaps(pieces.get(first), a, pieces.get(second), b)) {
					return failure("Pieces cannot overlap on the same layer");
				}
			}
		}

		int minX = Color.values().length == 0 ? 0 : Integer.MAX_VALUE;
		int minY = Integer.MAX_VALUE;
		int maxX = Integer.MIN_VALUE;
		int maxY = Integer.MIN_VALUE;
		int minZ = Integer.MAX_VALUE;
		int maxZ = Integer.MIN_VALUE;
		for (Color color : Color.values()) {
			Piece piece = pieces.get(color);
			Position position = positions.get(color);
			minX = Math.min(minX, position.x);
			minY = Math.min(minY, position.y);
			maxX = Math.max(maxX, position.x + piece.displayWidth() - 1);
			maxY = Math.max(maxY, position.y + piece.displayDepth() - 1);
			minZ = Math.min(minZ, position.z);
			maxZ = Math.max(maxZ, position.z);
		}
		if (maxX - minX >= 8 || maxY - minY >= 8 || maxZ - minZ >= 8) {
			return failure("The reconstructed structure does not fit in the 8×8×8 build area");
		}

		long threeByTwo = pieces.values().stream()
			.filter(piece -> piece.width() == 3 && piece.depth() == 2).count();
		boolean top = threeByTwo >= 3
			|| (!(pieces.get(Color.YELLOW).width() == 3 && pieces.get(Color.YELLOW).depth() == 1)
				&& input.connections().size() >= 7);
		int height = maxZ - minZ + 1;
		Direction direction = sameSize(pieces.get(Color.GREEN), pieces.get(Color.MAGENTA))
			? Direction.WEST
			: height >= 4
				? Direction.NORTH
				: positions.get(Color.BLUE).z > positions.get(Color.RED).z ? Direction.EAST : Direction.SOUTH;
		if (!top && direction == Direction.EAST) direction = Direction.WEST;
		else if (!top && direction == Direction.WEST) direction = Direction.EAST;

		List<String> cells = render(pieces, positions, top, direction, minX, minY, maxX, maxY);
		Map<String, String> dimensions = new LinkedHashMap<>();
		for (Color color : Color.values()) {
			Piece piece = pieces.get(color);
			dimensions.put(color.name().toLowerCase(), piece.width() + "×" + piece.depth());
		}
		storeState(module, "pieceDimensions", dimensions);
		return success(new LegosOutput(cells, top ? "TOP" : "BOTTOM", direction.name()));
	}

	private static boolean validSize(int width, int depth) {
		return width == 2 && depth == 2
			|| width == 3 && (depth == 1 || depth == 2)
			|| width == 4 && (depth == 1 || depth == 2);
	}

	private static boolean sameSize(Piece first, Piece second) {
		return first.width() == second.width() && first.depth() == second.depth();
	}

	private static boolean overlaps(Piece first, Position a, Piece second, Position b) {
		return a.x < b.x + second.displayWidth() && b.x < a.x + first.displayWidth()
			&& a.y < b.y + second.displayDepth() && b.y < a.y + first.displayDepth();
	}

	private static List<String> render(
		Map<Color, Piece> pieces, Map<Color, Position> positions, boolean top, Direction direction,
		int minX, int minY, int maxX, int maxY
	) {
		int shiftX = (8 - (maxX - minX + 1)) / 2 - minX;
		int shiftY = (8 - (maxY - minY + 1)) / 2 - minY;
		List<String> cells = new ArrayList<>(Collections.nCopies(64, "EMPTY"));
		List<Color> order = new ArrayList<>(List.of(Color.values()));
		order.sort(Comparator.comparingInt(color -> positions.get(color).z * (top ? 1 : -1)));
		for (Color color : order) {
			Piece piece = pieces.get(color);
			Position position = positions.get(color);
			for (int x = position.x; x < position.x + piece.displayWidth(); x++) {
				for (int y = position.y; y < position.y + piece.displayDepth(); y++) {
					int centeredX = x + shiftX;
					int centeredY = y + shiftY;
					cells.set(centeredY * 8 + (top ? centeredX : 7 - centeredX), color.name());
				}
			}
		}
		return rotate(cells, direction);
	}

	private static List<String> rotate(List<String> cells, Direction direction) {
		if (direction == Direction.NORTH) return cells;
		List<String> result = new ArrayList<>(Collections.nCopies(64, "EMPTY"));
		for (int i = 0; i < 64; i++) {
			int source = switch (direction) {
				case WEST -> 7 - i / 8 + i % 8 * 8;
				case SOUTH -> 7 - i % 8 + (7 - i / 8) * 8;
				case EAST -> i / 8 + (7 - i % 8) * 8;
				default -> i;
			};
			result.set(i, cells.get(source));
		}
		return result;
	}
}
