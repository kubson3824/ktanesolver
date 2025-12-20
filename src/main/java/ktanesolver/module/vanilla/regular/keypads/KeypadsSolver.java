
package ktanesolver.module.vanilla.regular.keypads;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.ModuleSolver;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.utils.Json;

@Service
public class KeypadsSolver implements ModuleSolver<KeypadsInput, KeypadsOutput> {
	private static final int REQUIRED_SYMBOLS = 4;
	private static final List<Set<KeypadSymbol>> COLUMN_SETS;

	static {
		// Pre-compute sets for faster lookups
		COLUMN_SETS = KeypadColumns.COLUMNS.stream().map(HashSet::new).collect(Collectors.toList());
	}

	@Override
	public ModuleType getType() {
		return ModuleType.KEYPADS;
	}

	@Override
	public Class<KeypadsInput> inputType() {
		return KeypadsInput.class;
	}

	@Override
	public SolveResult<KeypadsOutput> solve(RoundEntity round, BombEntity bomb, ModuleEntity module, KeypadsInput input) {
		List<KeypadSymbol> symbols = input.symbols();

		if(symbols.size() != REQUIRED_SYMBOLS) {
			return new SolveFailure<>("Keypads requires exactly " + REQUIRED_SYMBOLS + " symbols");
		}

		// Early return if there are duplicate symbols
		if(new HashSet<>(symbols).size() != REQUIRED_SYMBOLS) {
			return new SolveFailure<>("Duplicate symbols are not allowed");
		}

		int matchingColumnIndex = findMatchingColumnIndex(symbols);
		if(matchingColumnIndex == -1) {
			return new SolveFailure<>("No valid keypad column found");
		}

		List<KeypadSymbol> column = KeypadColumns.COLUMNS.get(matchingColumnIndex);
		List<KeypadSymbol> ordered = column.stream().filter(symbols::contains).collect(Collectors.toList());

		module.getState().put("symbols", symbols);
		module.setSolved(true);

		KeypadsOutput keypadsOutput = new KeypadsOutput(ordered);
		Json.mapper().convertValue(keypadsOutput, new TypeReference<Map<String, Object>>() {
		}).forEach(module.getSolution()::put);

		return new SolveSuccess<>(keypadsOutput, true);
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
