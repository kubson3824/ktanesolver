
package ktanesolver.module.vanilla.regular.morse;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.logic.*;
import org.springframework.stereotype.Service;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.module.vanilla.regular.translated.TranslatedVanillaData;
import ktanesolver.module.vanilla.regular.translated.TranslatedVanillaData.MorseWordData;

@Service
@ModuleInfo (type = ModuleType.MORSE_CODE, id = "morse_code", name = "Morse Code", category = ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR, description = "Decode the morse code and transmit the correct word", tags = {
	"blinking-orange-light", "frequency", "radio", "tx"})
public class MorseCodeSolver extends AbstractModuleSolver<MorseInput, MorseOutput> {

	private static final double RESOLVE_THRESHOLD = 0.85;
	private static final double CLEAR_GAP = 0.20;

	@Override
	public SolveResult<MorseOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, MorseInput input) {
		if(input == null) return failure("Enter the observed Morse code");
		List<MorseCandidate> candidates;
		List<MorseWordData> translatedWords = List.of();
		int observedMorseCharacters = 0;
		if(input.morse() != null && !input.morse().isBlank()) {
			String language;
			try {
				language = TranslatedVanillaData.language(input.language());
			} catch(IllegalArgumentException exception) {
				return failure(exception.getMessage());
			}
			List<String> observed = Arrays.stream(input.morse().strip().split("\\s+"))
				.filter(symbol -> !symbol.isBlank()).toList();
			if(observed.stream().anyMatch(symbol -> !symbol.matches("[.-]+")))
				return failure("Morse input may contain only dots, dashes, and spaces between characters");
			translatedWords = TranslatedVanillaData.morseWords(language);
			observedMorseCharacters = observed.size();
			candidates = translatedWords.stream().map(word -> scoreMorse(observed, word))
				.sorted(Comparator.comparingDouble(MorseCandidate::confidence).reversed()).toList();
		} else {
			if(input.word() == null || input.word().isBlank()) return failure("Enter the observed Morse code");
			String observed = input.word().toUpperCase().replaceAll(" ", "");
			candidates = Arrays.stream(MorseWord.values()).map(word -> scoreWord(observed, word))
				.sorted(Comparator.comparingDouble(MorseCandidate::confidence).reversed()).toList();
		}

		MorseCandidate best = candidates.get(0);

		int finalObservedMorseCharacters = observedMorseCharacters;
		boolean completeExactMatch = best.confidence() == 1.0
			&& (candidates.size() == 1 || candidates.get(1).confidence() < 1.0)
			&& translatedWords.stream().filter(word -> word.word().equals(best.word()))
				.anyMatch(word -> finalObservedMorseCharacters >= word.symbols().size());
		boolean resolved = completeExactMatch || best.confidence() >= RESOLVE_THRESHOLD
			&& (candidates.size() == 1 || best.confidence() - candidates.get(1).confidence() >= CLEAR_GAP);

		MorseOutput morseOutput = new MorseOutput(candidates, resolved);

		storeState(module, "input", input);
		return success(morseOutput, resolved);
	}

	private MorseCandidate scoreMorse(List<String> observed, MorseWordData word) {
		int best = 0;
		for(int start = 0; start < word.symbols().size(); start++) {
			int matched = 0;
			for(int i = 0; i < observed.size(); i++)
				if(observed.get(i).equals(word.symbols().get((start + i) % word.symbols().size()))) matched++;
			best = Math.max(best, matched);
		}
		return new MorseCandidate(word.word(), word.frequency(), round(safeDiv(best, observed.size())));
	}

	// ------------------------------------------------------

	private MorseCandidate scoreWord(String observed, MorseWord word) {
		String w = word.word;
		int matched = countPresent(observed, w);
		int ordered = longestOrderedSubsequence(observed, w);
		int uniqueMatched = (int)observed.chars().distinct().filter(c -> w.indexOf(c) >= 0).count();

		double presenceScore = safeDiv(matched, observed.length());
		double orderScore = safeDiv(ordered, observed.length());
		double coverageScore = safeDiv(uniqueMatched, w.length());

		double confidence = 0.45 * presenceScore + 0.35 * orderScore + 0.20 * coverageScore;

		return new MorseCandidate(w, word.frequency, round(confidence));
	}

	private int countPresent(String observed, String word) {
		int count = 0;
		for(char c: observed.toCharArray()) {
			if(word.indexOf(c) >= 0)
				count++;
		}
		return count;
	}

	private int longestOrderedSubsequence(String observed, String word) {
		int wi = 0;
		int matched = 0;
		for(char c: observed.toCharArray()) {
			while(wi < word.length() && word.charAt(wi) != c) {
				wi++;
			}
			if(wi < word.length()) {
				matched++;
				wi++;
			}
		}
		return matched;
	}

	private double safeDiv(int a, int b) {
		return b == 0 ? 0 : (double)a / b;
	}

	private double round(double d) {
		return Math.round(d * 1000.0) / 1000.0;
	}
}
