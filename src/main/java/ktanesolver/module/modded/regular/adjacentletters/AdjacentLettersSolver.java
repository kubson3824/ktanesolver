package ktanesolver.module.modded.regular.adjacentletters;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import org.springframework.stereotype.Service;

@Service
@ModuleInfo(
	type = ModuleType.ADJACENT_LETTERS,
	id = "adjacent_letters",
	name = "Adjacent Letters",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Find which letters to press from their horizontal and vertical neighbors",
	tags = {"letters", "grid", "adjacency"}
)
public class AdjacentLettersSolver extends AbstractModuleSolver<AdjacentLettersInput, AdjacentLettersOutput> {

	private static final List<String> LEFT_RIGHT = List.of(
		"GJMOY", "IKLRT", "BHIJW", "IKOPQ", "ACGIJ", "CERVY", "ACFNS", "LRTUX", "DLOWZ",
		"BQTUW", "AFPXY", "GKPTZ", "EILQT", "PQRSV", "HJLUZ", "DMNOX", "CEOPV", "AEGSU",
		"ABEKQ", "GVXYZ", "FMVXZ", "DHMNW", "DFHMN", "BDFKW", "BCHSU", "JNRSY"
	);
	private static final List<String> ABOVE_BELOW = List.of(
		"HKPRW", "CDFYZ", "DEMTU", "CJTUW", "KSUWZ", "AGJPQ", "HOQYZ", "DKMPS", "EFNUV",
		"EHIOS", "DIORZ", "ABRVX", "BFPWX", "AFGHL", "IQSTX", "CFHKR", "BDIKN", "BNOXY",
		"GMVYZ", "CJLSU", "BILNY", "AEJQX", "GLQRT", "AJNOV", "EGMTW", "CLMPV"
	);

	@Override
	protected SolveResult<AdjacentLettersOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, AdjacentLettersInput input
	) {
		if (input.letters() == null || input.letters().size() != 12) {
			return failure("Adjacent Letters requires exactly 12 letters");
		}
		if (input.letters().stream().anyMatch(letter -> letter == null || !letter.matches("[A-Za-z]"))) {
			return failure("Each button must contain one letter from A to Z");
		}

		List<String> letters = input.letters().stream().map(letter -> letter.toUpperCase(Locale.ROOT)).toList();
		if (new HashSet<>(letters).size() != 12) {
			return failure("All 12 letters must be different");
		}

		List<String> pressLetters = new ArrayList<>();
		for (int i = 0; i < letters.size(); i++) {
			char letter = letters.get(i).charAt(0);
			String horizontal = LEFT_RIGHT.get(letter - 'A');
			String vertical = ABOVE_BELOW.get(letter - 'A');
			int column = i % 4;
			int row = i / 4;
			if ((column > 0 && horizontal.contains(letters.get(i - 1)))
				|| (column < 3 && horizontal.contains(letters.get(i + 1)))
				|| (row > 0 && vertical.contains(letters.get(i - 4)))
				|| (row < 2 && vertical.contains(letters.get(i + 4)))) {
				pressLetters.add(letters.get(i));
			}
		}

		storeState(module, "input", new AdjacentLettersInput(letters));
		return success(new AdjacentLettersOutput(pressLetters));
	}
}
