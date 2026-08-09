package ktanesolver.module.modded.regular.mazescrambler;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Queue;
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
	type = ModuleType.MAZE_SCRAMBLER,
	id = "MazeScrambler",
	name = "Maze Scrambler",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Navigate a 3×3 maze while each colored button changes direction after every press.",
	tags = {"maze", "colors", "leds", "sequence"}
)
public class MazeScramblerSolver extends AbstractModuleSolver<MazeScramblerInput, MazeScramblerOutput> {
	private static final List<String> POSITION_NAMES = List.of(
		"top-left", "top-middle", "top-right", "middle-left", "center", "middle-right", "bottom-left", "bottom-middle", "bottom-right"
	);
	private static final Map<List<Integer>, Integer> MAZES_BY_MARKINGS = Map.of(
		List.of(2, 7), 1, List.of(1, 9), 2, List.of(5, 9), 3,
		List.of(4, 6), 4, List.of(2, 8), 5, List.of(3, 4), 6,
		List.of(3, 7), 7, List.of(1, 7), 8, List.of(5, 8), 9
	);
	private static final String[][][] WALLS = {
		{{"DR","L","D"},{"UR","DRL","UL"},{"R","URL","L"}},
		{{"R","DRL","L"},{"DR","UDRL","L"},{"U","UR","L"}},
		{{"DR","RL","LD"},{"U","DR","UDL"},{"R","UL","U"}},
		{{"DR","DRL","LD"},{"UD","UD","U"},{"U","UR","L"}},
		{{"R","RL","LD"},{"DR","RL","UDL"},{"U","R","UL"}},
		{{"D","D","D"},{"UDR","UDRL","UL"},{"U","UR","L"}},
		{{"D","D","D"},{"UR","URL","UDL"},{"R","RL","UL"}},
		{{"DR","L","D"},{"UDR","RL","UDL"},{"U","R","UL"}},
		{{"D","DR","L"},{"UDR","UDRL","L"},{"U","UR","L"}}
	};
	private static final List<String> COLORS = List.of("RED", "BLUE", "GREEN", "YELLOW");
	private static final String[][] DIRECTIONS = {
		{"U","L","R","D","D","R","U","U","D","L"},
		{"L","R","L","U","R","U","L","R","U","D"},
		{"R","U","U","L","L","D","R","L","R","U"},
		{"D","D","R","R","U","L","D","D","L","R"}
	};

	@Override
	protected SolveResult<MazeScramblerOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, MazeScramblerInput input
	) {
		if (input == null || input.startPosition() == null || input.goalPosition() == null || input.mazeMarkings() == null) {
			return failure("Enter the start, goal, and two yellow maze markings");
		}
		if (!validPosition(input.startPosition()) || !validPosition(input.goalPosition())
			|| input.startPosition().equals(input.goalPosition())) {
			return failure("Start and goal must be different positions from 1 through 9");
		}
		if (input.mazeMarkings().size() != 2 || input.mazeMarkings().stream().anyMatch(position -> position == null || !validPosition(position))
			|| input.mazeMarkings().get(0).equals(input.mazeMarkings().get(1))) {
			return failure("Enter two different maze-marking positions from 1 through 9");
		}
		List<Integer> markings = input.mazeMarkings().stream().sorted().toList();
		Integer maze = MAZES_BY_MARKINGS.get(markings);
		if (maze == null) return failure("Those yellow LEDs do not identify a Maze Scrambler maze");

		MazeScramblerOutput output = solveMaze(maze - 1, input.startPosition() - 1, input.goalPosition() - 1);
		if (output == null) return failure("No valid button sequence reaches the goal");
		storeState(module, "startPosition", POSITION_NAMES.get(input.startPosition() - 1));
		storeState(module, "goalPosition", POSITION_NAMES.get(input.goalPosition() - 1));
		storeState(module, "mazeMarkings", markings.stream().map(position -> POSITION_NAMES.get(position - 1)).toList());
		return success(output);
	}

	private static MazeScramblerOutput solveMaze(int mazeIndex, int start, int goal) {
		Queue<Path> queue = new ArrayDeque<>();
		Set<String> visited = new HashSet<>();
		queue.add(new Path(start, 0, List.of(), List.of()));
		visited.add(start + ",0");
		for (Path path; (path = queue.poll()) != null;) {
			for (int color = 0; color < COLORS.size(); color++) {
				String direction = DIRECTIONS[color][path.step()];
				int row = path.position() / 3, column = path.position() % 3;
				if (!WALLS[mazeIndex][row][column].contains(direction)) continue;
				int next = path.position() + switch (direction) { case "U" -> -3; case "R" -> 1; case "D" -> 3; default -> -1; };
				List<String> presses = append(path.presses(), COLORS.get(color));
				List<String> moves = append(path.moves(), direction);
				if (next == goal) return new MazeScramblerOutput(mazeIndex + 1, presses, moves);
				int step = (path.step() + 1) % 10;
				if (visited.add(next + "," + step)) queue.add(new Path(next, step, presses, moves));
			}
		}
		return null;
	}

	private static boolean validPosition(int position) { return position >= 1 && position <= 9; }

	private static <T> List<T> append(List<T> values, T value) {
		List<T> result = new ArrayList<>(values);
		result.add(value);
		return List.copyOf(result);
	}

	private record Path(int position, int step, List<String> presses, List<String> moves) {}
}
