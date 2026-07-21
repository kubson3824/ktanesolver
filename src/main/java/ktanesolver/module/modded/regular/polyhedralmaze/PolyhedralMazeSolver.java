package ktanesolver.module.modded.regular.polyhedralmaze;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

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
	type = ModuleType.POLYHEDRAL_MAZE,
	id = "PolyhedralMazeModule",
	name = "Polyhedral Maze",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Navigate the default-rule-seed maze across a selected polyhedron's faces.",
	tags = { "maze", "polyhedron", "navigation", "Souvenir", "modded" },
	hasInput = true,
	hasOutput = true
)
public class PolyhedralMazeSolver extends AbstractModuleSolver<PolyhedralMazeInput, PolyhedralMazeOutput> {
	@Override
	protected SolveResult<PolyhedralMazeOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, PolyhedralMazeInput input
	) {
		if (input == null) return failure("Enter the polyhedron and displayed face numbers");
		PolyhedralMazeDefinitions.Solid solid = PolyhedralMazeDefinitions.SOLIDS.get(input.polyhedron());
		if (solid == null) return failure("Select one of the 14 supported polyhedra");
		if (input.startFace() == null || input.destinationFace() == null) return failure("Enter both face numbers");
		int start = input.startFace();
		int destination = input.destinationFace();
		if (!PolyhedralMazeDefinitions.START_FACES.contains(start)) return failure("Start face is not valid for the default rule seed");
		if (start < 0 || start >= solid.neighbors().length || destination < 0 || destination >= solid.neighbors().length) {
			return failure("Face numbers must be between 0 and " + (solid.neighbors().length - 1));
		}
		if (start == destination) return failure("Start and destination faces must be different");

		List<Integer> route = findRoute(solid, start, destination);
		if (route == null) return failure("No route exists between those faces");
		int distance = route.size() - 1;
		if (distance < 5 || distance > 11) return failure("Destination must be 5 to 11 maze steps from the start");

		List<Integer> relativeDirections = new ArrayList<>();
		for (int index = 1; index < route.size() - 1; index++) {
			int[] neighbors = solid.neighbors()[route.get(index)];
			int from = indexOf(neighbors, route.get(index - 1));
			int to = indexOf(neighbors, route.get(index + 1));
			relativeDirections.add(Math.floorMod(from - to, neighbors.length));
		}

		storeState(module, "input", input);
		storeState(module, "startPosition", start);
		return success(new PolyhedralMazeOutput(route, relativeDirections));
	}

	private static List<Integer> findRoute(PolyhedralMazeDefinitions.Solid solid, int start, int destination) {
		int[] parent = new int[solid.neighbors().length];
		Arrays.fill(parent, -2);
		parent[start] = -1;
		ArrayDeque<Integer> queue = new ArrayDeque<>();
		queue.add(start);
		while (!queue.isEmpty() && parent[destination] == -2) {
			int face = queue.remove();
			for (int edge = 0; edge < solid.neighbors()[face].length; edge++) {
				int neighbor = solid.neighbors()[face][edge];
				if (solid.isOpen(face, edge) && parent[neighbor] == -2) {
					parent[neighbor] = face;
					queue.add(neighbor);
				}
			}
		}
		if (parent[destination] == -2) return null;
		List<Integer> route = new ArrayList<>();
		for (int face = destination; face >= 0; face = parent[face]) route.add(face);
		Collections.reverse(route);
		return route;
	}

	private static int indexOf(int[] values, int value) {
		for (int index = 0; index < values.length; index++) if (values[index] == value) return index;
		throw new IllegalStateException("Polyhedral Maze topology is not reciprocal");
	}
}
