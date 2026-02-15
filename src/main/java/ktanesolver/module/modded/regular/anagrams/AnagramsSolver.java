
package ktanesolver.module.modded.regular.anagrams;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.*;
import org.springframework.stereotype.Service;
import ktanesolver.dto.ModuleCatalogDto;

@Service
@ModuleInfo (type = ModuleType.ANAGRAMS, id = "anagrams", name = "Anagrams", category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR, description = "Find words that can be formed from the given letters", tags = {
	"word", "puzzle"})
public class AnagramsSolver extends AbstractModuleSolver<AnagramsInput, AnagramsOutput> {

	private static final List<String> VALID_WORDS = Arrays.asList(
		"STREAM", "MASTER", "TAMERS", "LOOPED", "POODLE", "POOLED", "CELLAR", "CALLER", "RECALL", "SEATED", "SEDATE", "TEASED", "RESCUE", "SECURE", "RECUSE", "RASHES", "SHEARS", "SHARES", "BARELY",
		"BARLEY", "BLEARY", "DUSTER", "RUSTED", "RUDEST");

	@Override
	public SolveResult<AnagramsOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, AnagramsInput input) {
		List<String> solutions = findAnagrams(input.displayWord());
		storeState(module, "input", input);
		AnagramsOutput output = new AnagramsOutput(solutions);

		return success(output);
	}

	private List<String> findAnagrams(String word) {
		List<String> anagrams = new ArrayList<>();
		String normalizedWord = word.toUpperCase();
		char[] inputChars = normalizedWord.toCharArray();
		Arrays.sort(inputChars);

		for(String validWord: VALID_WORDS) {
			if(validWord.length() == word.length()) {
				char[] validChars = validWord.toCharArray();
				Arrays.sort(validChars);

				if(Arrays.equals(inputChars, validChars)) {
					anagrams.add(validWord);
				}
			}
		}

		return anagrams;
	}
}
