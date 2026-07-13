package ktanesolver.module.modded.regular.seashells;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

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
@ModuleInfo(type = ModuleType.SEA_SHELLS, id = "sea_shells", name = "Sea Shells", category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR, description = "Translate the displayed tongue-twister into the button sequence.", tags = {"word", "sequence", "multi-stage"})
public class SeaShellsSolver extends AbstractModuleSolver<SeaShellsInput, SeaShellsOutput> {
	private static final List<String> PHRASES = List.of("SEA SHELLS", "SHE SHELLS", "SEA SELLS", "SHE SELLS");
	private static final String[][] CODES = {
		{"ABABA", "EAAEEA", "DBEAC", "ABDBAA"},
		{"BEEBBE", "CDCCDB", "EAEAEA", "BEEDA"},
		{"ACACEAC", "DBAEC", "EBDADAB", "CECEC"},
		{"BDABDAB", "ACEEAC", "EACEACE", "DAABDAB"}
	};
	private static final Map<String, List<String>> KEYS = Map.of(
		"ON THE SEA SHORE", List.of("shoe", "shih tzu", "she", "sit", "sushi"),
		"ON THE SHE SORE", List.of("can", "toucan", "tutu", "2", "cancan"),
		"ON THE SHE SURE", List.of("witch", "switch", "itch", "twitch", "stitch"),
		"ON THE SEESAW", List.of("burglar alarm", "Bulgaria", "armour", "burger", "llama")
	);

	@Override
	protected SolveResult<SeaShellsOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, SeaShellsInput input) {
		if(input == null) return failure("Select all parts of the displayed phrase");
		int row = PHRASES.indexOf(normalize(input.row()));
		int column = PHRASES.indexOf(normalize(input.column()));
		List<String> key = KEYS.get(normalize(input.key()));
		if(row < 0 || column < 0 || key == null) return failure("Select valid phrase parts");

		int stage = ((Number)module.getState().getOrDefault("stage", 0)).intValue() + 1;
		if(stage > 3) return failure("All Sea Shells stages are already complete");
		List<String> pressOrder = Arrays.stream(CODES[row][column].split(""))
			.map(letter -> key.get(letter.charAt(0) - 'A'))
			.toList();
		storeState(module, "stage", stage);
		storeState(module, "input", input);
		List<Object> inputHistory = module.getState().get("inputHistory") instanceof List<?> list
			? new ArrayList<>(list) : new ArrayList<>();
		inputHistory.add(input);
		storeState(module, "inputHistory", inputHistory);
		return success(new SeaShellsOutput(pressOrder, stage), stage == 3);
	}

	private static String normalize(String value) {
		return value == null ? "" : value.trim().toUpperCase();
	}
}
