package ktanesolver.module.modded.regular.fontselect;

import static java.util.Map.entry;

import java.util.List;
import java.util.Locale;
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
@ModuleInfo(
	type = ModuleType.FONT_SELECT,
	id = "FontSelect",
	name = "Font Select",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Choose the highest-priority displayed font for the shown phrase.",
	tags = {"fonts", "phrases", "selection"}
)
public class FontSelectSolver extends AbstractModuleSolver<FontSelectInput, FontSelectOutput> {
	private static final Map<String, Integer> PHRASE_ROWS = Map.ofEntries(
		entry(normalize("Eight Ate 8"), 1),
		entry(normalize("Jokes on you! I’m the male."), 4),
		entry(normalize("Jokes on you! I’m male."), 4),
		entry(normalize("Testing, testing, 1 to 3"), 2),
		entry(normalize("Yew R. Wonn"), 3),
		entry(normalize("Jokes on you! I’m the mail."), 3),
		entry(normalize("Ewe Arr Won"), 1),
		entry(normalize("888"), 2),
		entry(normalize("U.R. 1"), 3),
		entry(normalize("You are one"), 1),
		entry(normalize("Ate, Ate, Ate"), 3),
		entry(normalize("8 ate eight"), 4),
		entry(normalize("Testing, testing, 123"), 4),
		entry(normalize("Testing, testing, 1-3"), 1),
		entry(normalize("Jokes on you! I’m female."), 2),
		entry(normalize("Testing, testing, 1 two 3"), 2)
	);
	private static final List<List<String>> RANKINGS = List.of(
		List.of(),
		List.of("Special Elite", "Coming Soon", "Indie Flower", "Day Poster Black", "Rock Salt", "Karma", "Lobster", "Ostrich Sans", "Chewy", "Anonymous Pro", "Gochi Hand", "Merriweather"),
		List.of("Anonymous Pro", "Chewy", "Day Poster Black", "Indie Flower", "Merriweather", "Rock Salt", "Karma", "Gochi Hand", "Lobster", "Coming Soon", "Special Elite", "Ostrich Sans"),
		List.of("Indie Flower", "Coming Soon", "Karma", "Chewy", "Anonymous Pro", "Special Elite", "Ostrich Sans", "Lobster", "Merriweather", "Day Poster Black", "Gochi Hand", "Rock Salt"),
		List.of("Karma", "Gochi Hand", "Lobster", "Special Elite", "Merriweather", "Rock Salt", "Ostrich Sans", "Indie Flower", "Day Poster Black", "Anonymous Pro", "Coming Soon", "Chewy")
	);
	private static final List<String> FONTS = RANKINGS.get(1);

	@Override
	protected SolveResult<FontSelectOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, FontSelectInput input
	) {
		if (input == null || input.phrase() == null) return failure("Select the displayed phrase");
		Integer row = PHRASE_ROWS.get(normalize(input.phrase()));
		if (row == null) return failure("Unknown displayed phrase");
		if (input.fonts() == null || input.fonts().size() != 3) return failure("Select exactly three fonts in right-arrow order");

		List<String> fonts = input.fonts().stream().map(FontSelectSolver::canonicalFont).toList();
		if (fonts.contains(null)) return failure("Unknown font");
		if (fonts.stream().distinct().count() != 3) return failure("The three fonts must be different");

		String currentFont = canonicalFont(input.currentFont());
		if (currentFont == null || !fonts.contains(currentFont)) return failure("Current font must be one of the three selected fonts");

		String targetFont = RANKINGS.get(row).stream().filter(fonts::contains).findFirst().orElseThrow();
		int currentIndex = fonts.indexOf(currentFont);
		int targetIndex = fonts.indexOf(targetFont);
		List<String> actions = currentIndex == targetIndex
			? List.of("submit")
			: List.of((targetIndex - currentIndex + 3) % 3 == 1 ? "right" : "left", "submit");
		return success(new FontSelectOutput(targetFont, actions));
	}

	private static String normalize(String value) {
		return value.trim().replace('\'', '’').toLowerCase(Locale.ROOT);
	}

	private static String canonicalFont(String value) {
		if (value == null) return null;
		return FONTS.stream().filter(font -> font.equalsIgnoreCase(value.trim())).findFirst().orElse(null);
	}
}
