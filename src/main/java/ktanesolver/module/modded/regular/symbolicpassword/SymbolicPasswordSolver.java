package ktanesolver.module.modded.regular.symbolicpassword;

import static ktanesolver.module.shared.keypad.KeypadSymbol.*;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
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
import ktanesolver.module.shared.keypad.KeypadColumns;
import ktanesolver.module.shared.keypad.KeypadSymbol;

@Service
@ModuleInfo(
	type = ModuleType.SYMBOLIC_PASSWORD,
	id = "symbolicPasswordModule",
	name = "Symbolic Password",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Rearrange the six symbols to match their 2×3 region in the manual table.",
	tags = {"symbols", "grid", "password"}
)
public class SymbolicPasswordSolver extends AbstractModuleSolver<SymbolicPasswordInput, SymbolicPasswordOutput> {
	private static final List<KeypadSymbol> EXTRA_COLUMN = List.of(QUESTION_MARK, HOLLOW_STAR, BALLOON, LAMBDA, CURSIVE, EURO, PUMPKIN);
	private static final List<String> MOVES = List.of("LEFT_COLUMN", "MIDDLE_COLUMN", "RIGHT_COLUMN", "TOP_LEFT", "TOP_RIGHT", "BOTTOM_LEFT", "BOTTOM_RIGHT");

	@Override
	protected SolveResult<SymbolicPasswordOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, SymbolicPasswordInput input
	) {
		if (input == null || input.symbols() == null || input.symbols().size() != 6 || input.symbols().stream().anyMatch(Objects::isNull)) {
			return failure("Enter all six symbols in their current positions");
		}

		List<KeypadSymbol> symbols = List.copyOf(input.symbols());
		List<KeypadSymbol> target = findTarget(symbols);
		if (target == null) return failure("Those symbols do not form a valid 2×3 region");

		storeState(module, "symbols", symbols);
		return success(new SymbolicPasswordOutput(target, shortestMoves(symbols, target)));
	}

	private static List<KeypadSymbol> findTarget(List<KeypadSymbol> symbols) {
		List<KeypadSymbol> sorted = symbols.stream().sorted().toList();
		for (int row = 0; row < 6; row++) {
			for (int column = 0; column < 5; column++) {
				List<KeypadSymbol> window = window(row, column);
				if (window.stream().sorted().toList().equals(sorted)) return window;
			}
		}
		return null;
	}

	private static List<KeypadSymbol> window(int row, int column) {
		List<KeypadSymbol> result = new ArrayList<>(6);
		for (int y = row; y < row + 2; y++) {
			for (int x = column; x < column + 3; x++) result.add(symbolAt(y, x));
		}
		return List.copyOf(result);
	}

	private static KeypadSymbol symbolAt(int row, int column) {
		return column < KeypadColumns.COLUMNS.size()
			? KeypadColumns.COLUMNS.get(column).get(row)
			: EXTRA_COLUMN.get(row);
	}

	private static List<String> shortestMoves(List<KeypadSymbol> start, List<KeypadSymbol> target) {
		Queue<SearchNode> queue = new ArrayDeque<>();
		Set<List<KeypadSymbol>> seen = new HashSet<>();
		queue.add(new SearchNode(start, List.of()));
		seen.add(start);
		while (!queue.isEmpty()) {
			SearchNode node = queue.remove();
			if (node.symbols().equals(target)) return node.moves();
			for (String move : MOVES) {
				List<KeypadSymbol> next = applyMove(node.symbols(), move);
				if (seen.add(next)) {
					List<String> moves = new ArrayList<>(node.moves());
					moves.add(move);
					queue.add(new SearchNode(next, List.copyOf(moves)));
				}
			}
		}
		throw new IllegalStateException("Symbol arrangement is unreachable");
	}

	private static List<KeypadSymbol> applyMove(List<KeypadSymbol> symbols, String move) {
		List<KeypadSymbol> result = new ArrayList<>(symbols);
		switch (move) {
			case "LEFT_COLUMN" -> swap(result, 0, 3);
			case "MIDDLE_COLUMN" -> swap(result, 1, 4);
			case "RIGHT_COLUMN" -> swap(result, 2, 5);
			case "TOP_LEFT" -> rotateLeft(result, 0);
			case "TOP_RIGHT" -> rotateRight(result, 0);
			case "BOTTOM_LEFT" -> rotateLeft(result, 3);
			case "BOTTOM_RIGHT" -> rotateRight(result, 3);
			default -> throw new IllegalArgumentException("Unknown move: " + move);
		}
		return List.copyOf(result);
	}

	private static void swap(List<KeypadSymbol> symbols, int first, int second) {
		KeypadSymbol value = symbols.get(first);
		symbols.set(first, symbols.get(second));
		symbols.set(second, value);
	}

	private static void rotateLeft(List<KeypadSymbol> symbols, int start) {
		KeypadSymbol value = symbols.get(start);
		symbols.set(start, symbols.get(start + 1));
		symbols.set(start + 1, symbols.get(start + 2));
		symbols.set(start + 2, value);
	}

	private static void rotateRight(List<KeypadSymbol> symbols, int start) {
		KeypadSymbol value = symbols.get(start + 2);
		symbols.set(start + 2, symbols.get(start + 1));
		symbols.set(start + 1, symbols.get(start));
		symbols.set(start, value);
	}

	private record SearchNode(List<KeypadSymbol> symbols, List<String> moves) {
	}
}
