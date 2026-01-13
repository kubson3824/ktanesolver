package ktanesolver.module.modded.regular.roundkeypad;

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
import ktanesolver.module.vanilla.regular.keypads.KeypadSymbol;
import ktanesolver.module.vanilla.regular.keypads.KeypadColumns;

@Service
@ModuleInfo(
		type = ModuleType.ROUND_KEYPAD,
		id = "roundkeypad",
		name = "Round Keypad",
		category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
		description = "Press all buttons that have a symbol not present on the correct column",
		tags = {"pattern", "symbols"}
)
public class RoundKeypadSolver extends AbstractModuleSolver<RoundKeypadInput, RoundKeypadOutput> {
	private static final int REQUIRED_SYMBOLS = 8;
	private static final List<Set<KeypadSymbol>> COLUMN_SETS;

	static {
		// Pre-compute sets for faster lookups
		COLUMN_SETS = KeypadColumns.COLUMNS.stream().map(HashSet::new).collect(Collectors.toList());
	}

	@Override
	public SolveResult<RoundKeypadOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, RoundKeypadInput input) {
		List<KeypadSymbol> symbols = input.symbols();

		if(symbols.size() != REQUIRED_SYMBOLS) {
			return failure("Round Keypad requires exactly " + REQUIRED_SYMBOLS + " symbols");
		}

		if(new HashSet<>(symbols).size() != REQUIRED_SYMBOLS) {
			return failure("Duplicate symbols are not allowed");
		}

		int bestColumnIndex = findBestColumnIndex(symbols);
		
		Set<KeypadSymbol> correctColumnSymbols = new HashSet<>(KeypadColumns.COLUMNS.get(bestColumnIndex));
		List<KeypadSymbol> symbolsToPress = symbols.stream()
			.filter(symbol -> !correctColumnSymbols.contains(symbol))
			.collect(Collectors.toList());

		storeState(module, "symbols", symbols);
		storeState(module, "bestColumn", bestColumnIndex);

		RoundKeypadOutput output = new RoundKeypadOutput(symbolsToPress);
		return success(output);
	}

	private int findBestColumnIndex(List<KeypadSymbol> symbols) {
		Set<KeypadSymbol> symbolSet = new HashSet<>(symbols);
		int maxMatches = -1;
		int bestIndex = -1;
		
		for(int i = 0; i < COLUMN_SETS.size(); i++) {
			int matches = 0;
			for(KeypadSymbol symbol : symbolSet) {
				if(COLUMN_SETS.get(i).contains(symbol)) {
					matches++;
				}
			}
			
			if(matches > maxMatches || (matches == maxMatches && i > bestIndex)) {
				maxMatches = matches;
				bestIndex = i;
			}
		}
		
		return bestIndex;
	}
}
