package ktanesolver.module.modded.regular.anagrams;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.*;
import org.springframework.stereotype.Service;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.logic.ModuleInput;
import ktanesolver.logic.ModuleOutput;

@Service
public class AnagramsSolver implements ModuleSolver<AnagramsInput, AnagramsOutput> {
    
    private static final List<String> VALID_WORDS = Arrays.asList(
        "STREAM", "MASTER", "TAMERS",
        "LOOPED", "POODLE", "POOLED",
        "CELLAR", "CALLER", "RECALL",
        "SEATED", "SEDATE", "TEASED",
        "RESCUE", "SECURE", "RECUSE",
        "RASHES", "SHEARS", "SHARES",
        "BARELY", "BARLEY", "BLEARY",
        "DUSTER", "RUSTED", "RUDEST"
    );
    
    @Override
    public ModuleType getType() {
        return ModuleType.ANAGRAMS;
    }

    @Override
    public Class<AnagramsInput> inputType() {
        return AnagramsInput.class;
    }
	@Override
	public ModuleCatalogDto getCatalogInfo() {
		return new ModuleCatalogDto("anagrams", "Anagrams", ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR,
			"ANAGRAMS", List.of("word", "puzzle"),
			"Find words that can be formed from the given letters", true, true);
	}

    @Override
    public SolveResult<AnagramsOutput> solve(RoundEntity round, BombEntity bomb, ModuleEntity module, AnagramsInput input) {
        List<String> solutions = findAnagrams(input.displayWord());
        AnagramsOutput output = new AnagramsOutput(solutions);
        
        module.setSolved(true);
        
        return new SolveSuccess<>(output, true);
    }
    
    private List<String> findAnagrams(String word) {
        List<String> anagrams = new ArrayList<>();
        String normalizedWord = word.toUpperCase();
        char[] inputChars = normalizedWord.toCharArray();
        Arrays.sort(inputChars);
        
        for (String validWord : VALID_WORDS) {
            if (validWord.length() == word.length()) {
                char[] validChars = validWord.toCharArray();
                Arrays.sort(validChars);
                
                if (Arrays.equals(inputChars, validChars)) {
                    anagrams.add(validWord);
                }
            }
        }
        
        return anagrams;
    }
}
