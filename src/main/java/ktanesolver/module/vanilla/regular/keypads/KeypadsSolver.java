
package ktanesolver.module.vanilla.regular.keypads;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.logic.*;
import org.springframework.stereotype.Service;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.dto.ModuleCatalogDto;

@Service
@ModuleInfo(
		type = ModuleType.KEYPADS,
		id = "keypads",
		name = "Keypads",
		category = ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR,
		description = "Press buttons in the correct sequence",
		tags = {"memory", "pattern"}
)
public class KeypadsSolver extends AbstractModuleSolver<KeypadsInput, KeypadsOutput> {
	private static final int REQUIRED_SYMBOLS = 4;
	private static final List<Set<KeypadSymbol>> COLUMN_SETS;

	static {
		// Pre-compute sets for faster lookups
		COLUMN_SETS = KeypadColumns.COLUMNS.stream().map(HashSet::new).collect(Collectors.toList());
	}

	@Override
	public SolveResult<KeypadsOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, KeypadsInput input) {
		List<KeypadSymbol> symbols = input.symbols();

		if(symbols.size() != REQUIRED_SYMBOLS) {
			return failure("Keypads requires exactly " + REQUIRED_SYMBOLS + " symbols");
		}

		if(new HashSet<>(symbols).size() != REQUIRED_SYMBOLS) {
			return failure("Duplicate symbols are not allowed");
		}

		int matchingColumnIndex = findMatchingColumnIndex(symbols);
		if(matchingColumnIndex == -1) {
			return failure("No valid keypad column found");
		}

		List<KeypadSymbol> column = KeypadColumns.COLUMNS.get(matchingColumnIndex);
		List<KeypadSymbol> ordered = column.stream().filter(symbols::contains).collect(Collectors.toList());

		storeState(module, "symbols", symbols);

		KeypadsOutput keypadsOutput = new KeypadsOutput(ordered);
		return success(keypadsOutput);
	}

	private int findMatchingColumnIndex(List<KeypadSymbol> symbols) {
		Set<KeypadSymbol> symbolSet = new HashSet<>(symbols);
		for(int i = 0; i < COLUMN_SETS.size(); i++) {
			if(COLUMN_SETS.get(i).containsAll(symbolSet)) {
				return i;
			}
		}
		return -1;
	}
}
