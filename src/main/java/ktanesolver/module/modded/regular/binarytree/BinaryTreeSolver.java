package ktanesolver.module.modded.regular.binarytree;

import java.util.ArrayList;
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
	type = ModuleType.BINARY_TREE,
	id = "binaryTree",
	name = "Binary Tree",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Determine three nodes from their colors, characters, and text colors.",
	tags = {"tree", "traversal", "colors", "characters"}
)
public class BinaryTreeSolver extends AbstractModuleSolver<BinaryTreeInput, BinaryTreeOutput> {
	private static final List<String> COLORS = List.of(
		"RED", "GREEN", "BLUE", "ORANGE", "CYAN", "MAGENTA", "YELLOW", "GRAY"
	);
	private static final String[] ORDER_NAMES = {
		"PREORDER", "INORDER", "POSTORDER", "LEVEL",
		"RIGHT_TO_LEFT_PREORDER", "RIGHT_TO_LEFT_INORDER",
		"RIGHT_TO_LEFT_POSTORDER", "RIGHT_TO_LEFT_LEVEL"
	};
	private static final int[][] ORDERS = {
		{1, 2, 4, 5, 3, 6, 7},
		{4, 2, 5, 1, 6, 3, 7},
		{4, 5, 2, 6, 7, 3, 1},
		{1, 2, 3, 4, 5, 6, 7},
		{1, 3, 7, 6, 2, 5, 4},
		{7, 3, 6, 1, 5, 2, 4},
		{7, 6, 3, 5, 4, 2, 1},
		{1, 3, 2, 7, 6, 5, 4}
	};
	private static final int[][] COLOR_ORDERS = {
		{0, 5, 7},
		{1, 6, 1},
		{2, 4, 5},
		{3, 3, 0},
		{4, 0, 3},
		{5, 1, 6},
		{6, 7, 2},
		{7, 2, 4}
	};

	@Override
	protected SolveResult<BinaryTreeOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, BinaryTreeInput input
	) {
		if (input == null || input.nodes() == null || input.nodes().size() != 7) {
			return failure("Enter exactly seven nodes in reading order");
		}
		for (BinaryTreeNodeInput node : input.nodes()) {
			if (node == null || !COLORS.contains(node.color())) {
				return failure("Each node must have a valid color");
			}
			if (node.character() == null || !node.character().matches("[0-9A-NP-Z]")) {
				return failure("Characters must be one uppercase digit or letter except O");
			}
		}

		List<Integer> presses = new ArrayList<>(3);
		List<Integer> references = new ArrayList<>(3);
		List<String> orderings = new ArrayList<>(3);
		int reference = 1;
		for (int stage = 0; stage < 3; stage++) {
			BinaryTreeNodeInput node = input.nodes().get(reference - 1);
			int orderIndex = COLOR_ORDERS[COLORS.indexOf(node.color())][stage];
			int value = Character.isDigit(node.character().charAt(0))
				? node.character().charAt(0) - '0'
				: node.character().charAt(0) - 'A' + 3;
			int position = (value + 6) % 7;
			if (node.silver()) position = 6 - position;

			references.add(reference);
			orderings.add(ORDER_NAMES[orderIndex]);
			reference = ORDERS[orderIndex][position];
			presses.add(reference);
		}

		storeState(module, "input", new BinaryTreeInput(List.copyOf(input.nodes())));
		return success(new BinaryTreeOutput(List.copyOf(presses), List.copyOf(references), List.copyOf(orderings)));
	}
}
