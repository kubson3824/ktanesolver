package ktanesolver.module.modded.regular.synonyms;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
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
import ktanesolver.module.modded.regular.synonyms.SynonymsInput.WordPair;

@Service
@ModuleInfo(
	type = ModuleType.SYNONYMS,
	id = "synonyms",
	name = "Synonyms",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Compare every displayed word pair with the table and bomb edgework.",
	tags = {"words", "table", "edgework"}
)
public class SynonymsSolver extends AbstractModuleSolver<SynonymsInput, SynonymsOutput> {
	private static final List<String> OKAY_WORDS = List.of(
		"OK", "OKAY", "CONFIRM", "ENTER", "EXECUTE", "VERIFY", "SEND", "APPROVE", "SUBMIT", "SELECT", "YES"
	);
	private static final List<String> CANCEL_WORDS = List.of(
		"CANCEL", "ANNUL", "ERASE", "DELETE", "STOP", "OPPOSE", "DISCARD", "REJECT", "DECLINE", "REFUSE", "NO"
	);
	private static final int[][] TABLE = {
		{1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 0},
		{0, 0, 9, 8, 7, 6, 5, 4, 3, 2, 1},
		{2, 3, 5, 7, 9, 1, 4, 6, 8, 0, 4},
		{4, 2, 1, 8, 6, 5, 9, 3, 0, 7, 2},
		{5, 1, 2, 4, 9, 0, 6, 9, 3, 8, 7},
		{8, 4, 2, 1, 9, 3, 1, 6, 5, 7, 0},
		{6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 0},
		{5, 6, 7, 5, 1, 3, 9, 0, 2, 4, 8},
		{7, 1, 2, 3, 7, 5, 6, 4, 8, 9, 0},
		{3, 7, 0, 2, 8, 0, 1, 4, 6, 9, 5},
		{1, 3, 2, 4, 7, 5, 6, 0, 8, 9, 3}
	};

	@Override
	protected SolveResult<SynonymsOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, SynonymsInput input
	) {
		if(input == null || input.displayedNumber() == null
			|| input.displayedNumber() < 0 || input.displayedNumber() > 9) {
			return failure("Displayed number must be from 0 to 9");
		}
		if(input.pairs() == null || input.pairs().size() != 11) return failure("Enter all 11 word pairs");

		List<WordPair> pairs = new ArrayList<>();
		for(WordPair pair : input.pairs()) {
			if(pair == null || pair.okayWord() == null || pair.cancelWord() == null) return failure("Every pair needs both words");
			pairs.add(new WordPair(normalize(pair.okayWord()), normalize(pair.cancelWord())));
		}
		if(!new HashSet<>(pairs.stream().map(WordPair::okayWord).toList()).equals(Set.copyOf(OKAY_WORDS))
			|| !new HashSet<>(pairs.stream().map(WordPair::cancelWord).toList()).equals(Set.copyOf(CANCEL_WORDS))) {
			return failure("Each Okay and Cancel word must appear exactly once");
		}

		boolean swapRows = bomb.isIndicatorLit("IND") && bomb.getLastDigit() == 5;
		boolean doubleSend = bomb.getPortPlates().stream().filter(plate -> plate.getPorts().isEmpty()).count() == 2;
		List<Integer> matches = new ArrayList<>();
		for(int index = 0; index < pairs.size(); index++) {
			WordPair pair = pairs.get(index);
			int row = CANCEL_WORDS.indexOf(pair.cancelWord());
			if(swapRows && row == 1) row = 6;
			else if(swapRows && row == 6) row = 1;
			int column = OKAY_WORDS.indexOf(pair.okayWord());
			int value = TABLE[row][column];
			if(doubleSend && column == 6) value = value * 2 % 10;
			if(value == input.displayedNumber()) matches.add(index);
		}
		if(matches.size() > 1) return failure("These pairs produce more than one match; check the entered words");

		storeState(module, "displayedNumber", input.displayedNumber());
		if(matches.isEmpty()) {
			int execute = pairs.stream().map(WordPair::okayWord).toList().indexOf("EXECUTE");
			return success(new SynonymsOutput("EXECUTE", execute + 1, true));
		}
		int match = matches.getFirst();
		String target = input.displayedNumber() % 2 == 0 ? pairs.get(match).okayWord() : pairs.get(match).cancelWord();
		return success(new SynonymsOutput(target, match + 1, false));
	}

	private static String normalize(String word) {
		return word.trim().toUpperCase(Locale.ROOT);
	}
}
