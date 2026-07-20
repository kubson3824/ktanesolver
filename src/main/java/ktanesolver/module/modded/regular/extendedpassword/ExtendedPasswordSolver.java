package ktanesolver.module.modded.regular.extendedpassword;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

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
	type = ModuleType.EXTENDED_PASSWORD,
	id = "ExtendedPassword",
	name = "Extended Password",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Find the six-letter password from the visible column letters.",
	tags = {"6-up-arrows", "6-down-arrows", "submit", "words"}
)
public class ExtendedPasswordSolver extends AbstractModuleSolver<ExtendedPasswordInput, ExtendedPasswordOutput> {
	private static final List<String> WORDS = List.of(
		"adjust", "anchor", "bowtie", "button", "cipher", "corner", "dampen", "demote",
		"enlist", "evolve", "forget", "finish", "geyser", "global", "hammer", "helium",
		"ignite", "indigo", "jigsaw", "juliet", "karate", "keypad", "lambda", "listen",
		"matter", "memory", "nebula", "nickel", "overdo", "oxygen", "peanut", "photon",
		"quartz", "quebec", "resist", "riddle", "sierra", "strike", "teapot", "twenty",
		"untold", "ultima", "victor", "violet", "wither", "wrench", "xenons", "xylose",
		"yellow", "yogurt", "zenith", "zodiac"
	);

	@Override
	protected SolveResult<ExtendedPasswordOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, ExtendedPasswordInput input
	) {
		if (input == null || input.letters() == null || input.letters().isEmpty()) {
			return failure("Enter at least one column of visible letters");
		}
		for (var entry : input.letters().entrySet()) {
			if (entry.getKey() == null || entry.getKey() < 1 || entry.getKey() > 6 || entry.getValue() == null || entry.getValue().size() > 6) {
				return failure("Columns must be numbered 1 through 6 and contain at most six letters");
			}
			if (entry.getValue().stream().anyMatch(letter -> letter == null || !letter.trim().matches("[A-Za-z]"))) {
				return failure("Column entries must be single letters A–Z");
			}
		}

		Map<Integer, Set<String>> columns = new HashMap<>();
		input.letters().forEach((column, letters) -> {
			if (!letters.isEmpty()) {
				columns.put(column, letters.stream()
					.map(letter -> letter.trim().toLowerCase(Locale.ROOT))
					.collect(Collectors.toSet()));
			}
		});
		if (columns.isEmpty()) return failure("Enter at least one column of visible letters");

		List<String> possible = WORDS.stream()
			.filter(word -> columns.entrySet().stream().allMatch(entry -> entry.getValue().contains(word.substring(entry.getKey() - 1, entry.getKey()))))
			.toList();
		boolean resolved = possible.size() == 1;
		storeState(module, "input", input);
		return success(new ExtendedPasswordOutput(possible, resolved), resolved);
	}
}
