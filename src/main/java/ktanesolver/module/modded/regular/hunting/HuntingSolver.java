package ktanesolver.module.modded.regular.hunting;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
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
	type = ModuleType.HUNTING,
	id = "hunting",
	name = "Hunting",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Find the growing set of decoy cave-painting pictograms across four stages",
	tags = {"symbols", "pictograms", "stages", "Souvenir"}
)
public class HuntingSolver extends AbstractModuleSolver<HuntingInput, HuntingOutput> {
	private static final List<String> ROWS = List.of("M", "U", "f_", "H");
	private static final List<String> COLUMNS = List.of("o_", "W", "z_", "A");
	private static final Set<String> BUTTON_SYMBOLS = Set.of("h_", "R", "e_", "v_", "F", "b_", "K", "t_", "Q", "p_", "u_", "X", "n_", "B", "S", "I");
	private static final String[][][] GRID = {
		{{"h_", "R", "t_", "Q"}, {"e_", "h_", "p_", "b_"}, {"v_", "F", "b_", "R"}, {"b_", "K", "u_", "X"}},
		{{"F", "Q", "h_", "n_"}, {"Q", "e_", "v_", "F"}, {"R", "B", "F", "S"}, {"X", "u_", "e_", "I"}},
		{{"t_", "v_", "n_", "h_"}, {"p_", "I", "S", "K"}, {"u_", "S", "Q", "v_"}, {"B", "n_", "I", "t_"}},
		{{"n_", "t_", "X", "B"}, {"S", "X", "K", "e_"}, {"K", "b_", "R", "p_"}, {"I", "p_", "B", "u_"}}
	};

	@Override
	protected SolveResult<HuntingOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, HuntingInput input
	) {
		if (input == null || input.leftSymbol() == null || input.rightSymbol() == null) return failure("Enter both displayed pictograms");
		if (input.stage() < 1 || input.stage() > 4) return failure("Hunting has exactly 4 stages");
		if (!isCluePair(input.leftSymbol(), input.rightSymbol())) return failure("Select one row pictogram and one column pictogram");

		List<List<String>> history = new ArrayList<>(clueHistory(module));
		if (input.stage() == 1 && !history.isEmpty()) history.clear();
		if (history.size() != input.stage() - 1) return failure("Enter the stages in order");

		List<String> buttons = input.buttonSymbols() == null ? List.of() : input.buttonSymbols();
		if (!buttons.isEmpty() && (buttons.size() != 5 || new LinkedHashSet<>(buttons).size() != 5 || !BUTTON_SYMBOLS.containsAll(buttons))) {
			return failure("Enter the 5 distinct button pictograms, or leave them blank");
		}

		history.add(List.of(input.leftSymbol(), input.rightSymbol()));
		int position = COLUMNS.contains(input.leftSymbol()) ? input.stage() - 1 : 4 - input.stage();
		List<String> decoys = history.stream().map(pair -> decoy(pair, position)).toList();
		Integer safeButton = buttons.isEmpty() ? null : firstSafeButton(buttons, decoys);
		if (!buttons.isEmpty() && safeButton == null) return failure("At least one button must not be a decoy");

		storeTypedState(module, new HuntingState(history));
		return success(new HuntingOutput(input.stage(), decoys, safeButton), input.stage() == 4);
	}

	private static boolean isCluePair(String left, String right) {
		return ROWS.contains(left) && COLUMNS.contains(right) || COLUMNS.contains(left) && ROWS.contains(right);
	}

	private static String decoy(List<String> pair, int position) {
		String row = ROWS.contains(pair.get(0)) ? pair.get(0) : pair.get(1);
		String column = COLUMNS.contains(pair.get(0)) ? pair.get(0) : pair.get(1);
		return GRID[ROWS.indexOf(row)][COLUMNS.indexOf(column)][position];
	}

	private static Integer firstSafeButton(List<String> buttons, List<String> decoys) {
		for (int i = 0; i < buttons.size(); i++) if (!decoys.contains(buttons.get(i))) return i + 1;
		return null;
	}

	@SuppressWarnings("unchecked")
	private static List<List<String>> clueHistory(ModuleEntity module) {
		Object history = module.getState().get("clueHistory");
		return history instanceof List<?> list ? (List<List<String>>) list : List.of();
	}

	private record HuntingState(List<List<String>> clueHistory) {}
}
