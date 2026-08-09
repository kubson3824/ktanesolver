package ktanesolver.module.modded.regular.britishslang;

import java.util.HashSet;
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
	type = ModuleType.BRITISH_SLANG,
	id = "britishSlang",
	name = "British Slang",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Carry each definition's slang word forward to the next of six stages.",
	tags = {"words", "definitions", "memory", "multi-stage"}
)
public class BritishSlangSolver extends AbstractModuleSolver<BritishSlangInput, BritishSlangOutput> {
	private static final Map<String, String> WORD_BY_DEFINITION = Map.ofEntries(
		Map.entry("call dibs", "Bagsy"), Map.entry("silly person", "Wally"), Map.entry("having a chat", "Chinwag"),
		Map.entry("in good order", "Tickety-boo"), Map.entry("speech of little value", "Waffle"), Map.entry("acting sulky", "Mardy"),
		Map.entry("gone wrong", "Pear-shaped"), Map.entry("short tempered", "Shirty"), Map.entry("total mess", "Shambles"),
		Map.entry("nonsense", "Poppycock"), Map.entry("prison", "Nick"), Map.entry("excellent condition", "Mint"),
		Map.entry("really disappointed", "Gutted"), Map.entry("cool london man", "Geezer"), Map.entry("your home", "Gaff"),
		Map.entry("cigarette", "Fag"), Map.entry("waste time", "Faff"), Map.entry("cool", "Dench"),
		Map.entry("packed or busy", "Chocka"), Map.entry("have a look", "Butchers"), Map.entry("move over", "Budge Up"),
		Map.entry("long drinking session", "Bender"), Map.entry("bit of a geek", "Anorak"), Map.entry("england britain", "Blighty"),
		Map.entry("thanks", "Ta"), Map.entry("goodbye", "Cheerio"), Map.entry("male person", "Bloke"),
		Map.entry("skip school or work", "Skive"), Map.entry("toilet", "Loo"), Map.entry("party", "Do"),
		Map.entry("small parasol", "Brolly"), Map.entry("very drunk", "Mortal"), Map.entry("drinks for all", "Round"),
		Map.entry("illness", "Lurgy"), Map.entry("sell quickly", "Flog"), Map.entry("really pleased", "Chuffed"),
		Map.entry("achieve faultlessly", "Blinder"), Map.entry("gullible idiot", "Mug"), Map.entry("two weeks", "Fortnight"),
		Map.entry("very attractive", "Fit"), Map.entry("pound coin", "Quid"), Map.entry("nervous", "Collywobbles")
	);
	private static final Set<String> WORDS = Set.copyOf(WORD_BY_DEFINITION.values());

	@Override
	protected SolveResult<BritishSlangOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, BritishSlangInput input
	) {
		if (input == null || input.definition() == null || input.buttons() == null || input.buttons().size() != 4) {
			return failure("Enter the current definition and all four buttons");
		}
		String nextAnswer = WORD_BY_DEFINITION.get(normalize(input.definition()));
		if (nextAnswer == null) return failure("That definition is not in the British Slang table");
		int stage = input.newAttempt() ? 1
			: module.getState().get("nextStage") instanceof Number number ? number.intValue() : 1;
		if (stage < 1 || stage > 6) return failure("The stored British Slang stage is invalid");

		List<String> buttons = input.buttons().stream().map(value -> value == null ? "" : value.trim()).toList();
		long blanks = buttons.stream().filter(String::isBlank).count();
		if ((stage == 1 && blanks != 1) || (stage > 1 && blanks != 0)) {
			return failure(stage == 1 ? "Stage 1 must have exactly one blank button" : "Enter all four word labels");
		}
		if (buttons.stream().filter(value -> !value.isBlank()).anyMatch(value -> WORDS.stream().noneMatch(word -> normalize(word).equals(normalize(value))))) {
			return failure("Every non-blank button must be a word from the British Slang table");
		}
		Set<String> distinct = new HashSet<>();
		if (buttons.stream().filter(value -> !value.isBlank()).map(BritishSlangSolver::normalize).anyMatch(value -> !distinct.add(value))) {
			return failure("Button words must be different");
		}

		String required = stage == 1 ? "" : String.valueOf(module.getState().getOrDefault("previousAnswer", ""));
		if (stage > 1 && required.isBlank()) return failure("Restart this solver because the previous-stage answer is missing");
		int press = -1;
		for (int i = 0; i < buttons.size(); i++) if (normalize(buttons.get(i)).equals(normalize(required))) { press = i; break; }
		if (press < 0) return failure("The previous stage's answer is not on any button");

		storeState(module, "previousAnswer", nextAnswer);
		int nextStage = Math.min(6, stage + 1);
		storeState(module, "nextStage", nextStage);
		String label = buttons.get(press).isBlank() ? "BLANK" : canonicalWord(buttons.get(press));
		BritishSlangOutput output = new BritishSlangOutput(stage, press + 1, label, nextStage);
		return stage == 6 ? success(output) : success(output, false);
	}

	private static String canonicalWord(String value) {
		return WORDS.stream().filter(word -> normalize(word).equals(normalize(value))).findFirst().orElse(value);
	}

	private static String normalize(String value) {
		return value.replaceAll("([a-z])([A-Z])", "$1 $2").replaceAll("[^\\p{L}\\p{N}]+", " ")
			.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
	}
}
