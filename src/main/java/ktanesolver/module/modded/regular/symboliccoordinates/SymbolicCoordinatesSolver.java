package ktanesolver.module.modded.regular.symboliccoordinates;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
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
	type = ModuleType.SYMBOLIC_COORDINATES,
	id = "symbolicCoordinates",
	name = "Symbolic Coordinates",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Convert three symbols and three colored LEDs into a coordinate.",
	tags = {"symbols", "colors", "multi-stage", "souvenir", "modded"}
)
public class SymbolicCoordinatesSolver extends AbstractModuleSolver<SymbolicCoordinatesInput, SymbolicCoordinatesOutput> {
	private static final Set<String> SYMBOLS = Set.of("A", "C", "E", "L", "P");
	private static final Set<String> COLORS = Set.of("AQUA", "GREEN", "PURPLE", "YELLOW");
	private static final Map<String, String> LETTERS = Map.ofEntries(
		Map.entry("P L A", "A"), Map.entry("C L A", "B"), Map.entry("L A P", "C"),
		Map.entry("A C E", "D"), Map.entry("C L E", "E"), Map.entry("C E L", "F"),
		Map.entry("E L A", "G"), Map.entry("P A L", "H"), Map.entry("P C L", "I"),
		Map.entry("A L P", "J"), Map.entry("L E C", "K"), Map.entry("L P E", "L"),
		Map.entry("E A L", "M"), Map.entry("P E C", "N"), Map.entry("L C P", "O"),
		Map.entry("A E L", "P"), Map.entry("A L E", "Q"), Map.entry("L E P", "R"),
		Map.entry("E P C", "S"), Map.entry("P C E", "T"), Map.entry("C A L", "U"),
		Map.entry("C P E", "V"), Map.entry("E P L", "W"), Map.entry("P A E", "X"),
		Map.entry("A C L", "Y"), Map.entry("E C P", "Z")
	);
	private static final Map<String, String> DIGITS = Map.of(
		"AQUA GREEN YELLOW", "0", "GREEN YELLOW PURPLE", "1", "GREEN PURPLE YELLOW", "2",
		"YELLOW AQUA PURPLE", "3", "AQUA GREEN PURPLE", "4", "PURPLE AQUA GREEN", "5",
		"YELLOW GREEN PURPLE", "6", "GREEN AQUA PURPLE", "7", "AQUA PURPLE YELLOW", "8",
		"PURPLE GREEN AQUA", "9"
	);

	@Override
	protected SolveResult<SymbolicCoordinatesOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, SymbolicCoordinatesInput input
	) {
		if (input == null) return failure("Enter the three symbols and three LED colors");
		if (input.symbols() == null || input.symbols().size() != 3) return failure("Enter exactly three symbols from left to right");
		if (input.ledColors() == null || input.ledColors().size() != 3) return failure("Enter exactly three LED colors from top to bottom");

		List<String> symbols = normalize(input.symbols());
		List<String> colors = normalize(input.ledColors());
		if (symbols.stream().anyMatch(symbol -> !SYMBOLS.contains(symbol))) return failure("Select valid Symbolic Coordinates symbols");
		if (colors.stream().anyMatch(color -> !COLORS.contains(color))) return failure("Select valid Symbolic Coordinates LED colors");

		List<Object> stageSymbols = history(module);
		int stage = stageSymbols.size() + 1;
		if (stage > 3) return failure("All three Symbolic Coordinates stages are already complete");
		if (input.confirmStage()) {
			Object pendingSymbols = module.getState().get("pendingSymbols");
			Object pendingLedColors = module.getState().get("pendingLedColors");
			Object pendingCoordinate = module.getState().get("pendingCoordinate");
			if (!symbols.equals(pendingSymbols) || !colors.equals(pendingLedColors) || !(pendingCoordinate instanceof String coordinate)) {
				return failure("Calculate this display before confirming the stage");
			}
			stageSymbols.add(symbols);
			storeState(module, "stageSymbols", stageSymbols);
			module.getState().remove("pendingSymbols");
			module.getState().remove("pendingLedColors");
			module.getState().remove("pendingCoordinate");
			return success(new SymbolicCoordinatesOutput(stage, coordinate, true), stage == 3);
		}

		String coordinate = LETTERS.getOrDefault(String.join(" ", symbols), "*")
			+ DIGITS.getOrDefault(String.join(" ", colors), "*");
		storeState(module, "pendingSymbols", symbols);
		storeState(module, "pendingLedColors", colors);
		storeState(module, "pendingCoordinate", coordinate);
		return success(new SymbolicCoordinatesOutput(stage, coordinate, false), false);
	}

	private static List<String> normalize(List<String> values) {
		return values.stream().map(value -> value == null ? "" : value.trim().toUpperCase(Locale.ROOT)).toList();
	}

	private static List<Object> history(ModuleEntity module) {
		return module.getState().get("stageSymbols") instanceof List<?> list ? new ArrayList<>(list) : new ArrayList<>();
	}
}
