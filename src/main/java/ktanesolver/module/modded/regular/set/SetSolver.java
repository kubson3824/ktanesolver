package ktanesolver.module.modded.regular.set;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
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
	type = ModuleType.SET,
	id = "SetModule",
	name = "S.E.T.",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Find the unique triplet whose four attributes are each all equal or all different.",
	tags = { "symbols", "set", "3×3 grid", "logic" }
)
public class SetSolver extends AbstractModuleSolver<SetInput, SetOutput> {
	private static final List<String> SHADINGS = List.of("filled", "wavy", "empty");

	@Override
	protected SolveResult<SetOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, SetInput input
	) {
		if(input == null || input.cards() == null || input.cards().size() != 9) {
			return failure("Enter all nine symbols");
		}

		List<int[]> cards = new ArrayList<>(9);
		Set<String> distinctCards = new HashSet<>();
		for(SetInput.Card card : input.cards()) {
			if(card == null || card.symbol() == null || card.dots() == null || card.shading() == null) {
				return failure("Each symbol needs a table position, dot count, and shading");
			}
			String symbol = card.symbol().strip().toUpperCase(Locale.ROOT);
			String shading = card.shading().strip().toLowerCase(Locale.ROOT);
			if(!symbol.matches("[A-C][1-3]") || card.dots() < 0 || card.dots() > 2 || !SHADINGS.contains(shading)) {
				return failure("Use table positions A1–C3, 0–2 dots, and filled, wavy, or empty shading");
			}
			int[] values = { symbol.charAt(0) - 'A', symbol.charAt(1) - '1', card.dots(), SHADINGS.indexOf(shading) };
			if(!distinctCards.add(symbol + card.dots() + shading)) return failure("The same symbol card cannot appear twice");
			cards.add(values);
		}

		List<String> solution = null;
		for(int first = 0; first < 7; first++) for(int second = first + 1; second < 8; second++) for(int third = second + 1; third < 9; third++) {
			if(isSet(cards.get(first), cards.get(second), cards.get(third))) {
				if(solution != null) return failure("Those symbols contain more than one S.E.T.; check the entries");
				solution = List.of(position(first), position(second), position(third));
			}
		}
		if(solution == null) return failure("Those symbols do not contain a S.E.T.; check the entries");

		storeState(module, "cards", input.cards());
		return success(new SetOutput(solution));
	}

	private static boolean isSet(int[] first, int[] second, int[] third) {
		for(int attribute = 0; attribute < first.length; attribute++) {
			if((first[attribute] + second[attribute] + third[attribute]) % 3 != 0) return false;
		}
		return true;
	}

	private static String position(int index) {
		return "" + (char) ('A' + index % 3) + (index / 3 + 1);
	}
}
