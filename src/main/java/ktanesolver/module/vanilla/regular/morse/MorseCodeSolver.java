
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

@Service
@ModuleInfo(
		type = ModuleType.MORSE_CODE,
		id = "morse_code",
		name = "Morse Code",
		category = ModuleCatalogDto.ModuleCategory.VANILLA_REGULAR,
		description = "Decode the morse code and transmit the correct word",
		tags = {"decoding", "pattern"}
)
public class MorseCodeSolver extends AbstractModuleSolver<MorseInput, MorseOutput> {

	private static final double RESOLVE_THRESHOLD = 0.85;
	private static final double CLEAR_GAP = 0.20;

	@Override
	public SolveResult<MorseOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, MorseInput input) {

		String observed = input.word().toUpperCase().replaceAll(" ","");
		List<MorseCandidate> candidates = Arrays.stream(MorseWord.values()).map(word -> scoreWord(observed, word)).sorted(Comparator.comparingDouble(MorseCandidate::confidence).reversed()).toList();

		MorseCandidate best = candidates.get(0);

		boolean resolved = best.confidence() >= RESOLVE_THRESHOLD && (candidates.size() == 1 || best.confidence() - candidates.get(1).confidence() >= CLEAR_GAP);

		MorseOutput morseOutput = new MorseOutput(candidates, resolved);

		storeState(module, "input", input);
		return success(morseOutput, resolved);
	}

	// ------------------------------------------------------

	private MorseCandidate scoreWord(String observed, MorseWord word) {
		String w = word.word;
        int matched = countPresent(observed, w);
		int ordered = longestOrderedSubsequence(observed, w);
		int uniqueMatched = (int) observed.chars().distinct().filter(c -> w.indexOf(c) >= 0).count();

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
