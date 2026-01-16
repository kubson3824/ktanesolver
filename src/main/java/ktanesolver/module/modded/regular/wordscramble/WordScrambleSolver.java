
package ktanesolver.module.modded.regular.wordscramble;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.logic.*;
import org.springframework.stereotype.Service;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.dto.ModuleCatalogDto;

@Service
@ModuleInfo (type = ModuleType.WORD_SCRAMBLE, id = "word_scramble", name = "Word Scramble", category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR, description = "Unscramble the letters to form words", tags = {
	"word", "puzzle"})
public class WordScrambleSolver extends AbstractModuleSolver<WordScrambleInput, WordScrambleOutput> {

	// List of valid 6-letter words for the Word Scramble module
	private static final List<String> VALID_WORDS = Arrays.asList(
		"BANANA", "ATTACK", "DAMAGE", "NAPALM", "OTTAWA", "KABOOM", "BLASTS", "CHARGE", "ARCHER", "CASING", "CANNON", "KEYPAD", "DISARM", "FLAMES", "KEVLAR", "WEAPON", "SAPPER", "MORTAR", "BUTTON",
		"ROBOTS", "BURSTS", "DEVICE", "ROCKET", "DEFUSE", "WIDGET", "MODULE", "LETTER", "SEMTEX", "PERSON", "WIRING");

	@Override
	public SolveResult<WordScrambleOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, WordScrambleInput input) {
		String letters = input.letters();

		// Validate input
		if(letters == null || letters.length() != 6) {
			WordScrambleOutput output = new WordScrambleOutput(false, "Invalid input: must provide exactly 6 letters", "");
			return success(output, false);
		}

		// Convert to uppercase for consistency
		letters = letters.toUpperCase();

		// Store module state
		storeState(module, "letters", letters);

		// Find all valid words that can be made from these letters
		List<String> possibleWords = findPossibleWords(letters);

		if(possibleWords.isEmpty()) {
			WordScrambleOutput output = new WordScrambleOutput(false, "No valid words found with these letters", "");
			return success(output, false);
		}

		// For simplicity, return the first valid word found
		// In a real implementation, you might want to consider additional logic
		// such as word frequency, bomb indicators, or other factors
		String solution = possibleWords.getFirst();

		String instruction = String.format("Found %d possible word(s). Solution: %s", possibleWords.size(), solution);

		WordScrambleOutput output = new WordScrambleOutput(true, instruction, solution);
		return success(output);
	}

	private List<String> findPossibleWords(String letters) {
		List<String> possibleWords = new ArrayList<>();

		// Count the frequency of each letter in the input
		Map<Character, Integer> letterCounts = new HashMap<>();
		for(char c: letters.toCharArray()) {
			letterCounts.put(c, letterCounts.getOrDefault(c, 0) + 1);
		}

		// Check each valid word
		for(String word: VALID_WORDS) {
			if(canFormWord(word, letterCounts)) {
				possibleWords.add(word);
			}
		}

		return possibleWords;
	}

	private boolean canFormWord(String word, Map<Character, Integer> letterCounts) {
		// Count the frequency of each letter in the word
		Map<Character, Integer> wordCounts = new HashMap<>();
		for(char c: word.toCharArray()) {
			wordCounts.put(c, wordCounts.getOrDefault(c, 0) + 1);
		}

		// Check if we have enough of each letter
		for(Map.Entry<Character, Integer> entry: wordCounts.entrySet()) {
			char letter = entry.getKey();
			int needed = entry.getValue();
			int available = letterCounts.getOrDefault(letter, 0);

			if(available < needed) {
				return false;
			}
		}

		return true;
	}

}
