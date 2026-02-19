package ktanesolver.module.modded.regular.cryptography;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

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
	type = ModuleType.CRYPTOGRAPHY,
	id = "cryptography",
	name = "Cryptography",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Decrypt the ciphertext (substitution cipher from A Christmas Carol excerpt). E always maps to E; no other letter maps to itself. Press the five keys once each in the order they first appear in the plaintext.",
	tags = { "cryptography", "modded", "cipher" }
)
public class CryptographySolver extends AbstractModuleSolver<CryptographyInput, CryptographyOutput> {

	/** Appendix CD43: excerpt from Charles Dickens' A Christmas Carol (normalized to words, uppercase, no punctuation). */
	private static final List<String> EXCERPT_WORDS = buildExcerptWords();

	/** Build word list: split on whitespace, then strip all non-letters per token so e.g. "Marley's" -> "MARLEYS", "don't" -> "DONT". */
	private static List<String> buildExcerptWords() {
		String raw = EXCERPT_RAW;
		List<String> words = new ArrayList<>();
		for (String token : raw.split("\\s+")) {
			StringBuilder letters = new StringBuilder();
			for (int i = 0; i < token.length(); i++) {
				char c = token.charAt(i);
				if (Character.isLetter(c)) {
					letters.append(Character.toUpperCase(c));
				}
			}
			if (letters.length() > 0) {
				words.add(letters.toString());
			}
		}
		return words;
	}

	private static final String EXCERPT_RAW =
		"Scrooge knew he was dead? Of course he did. How could it be otherwise? Scrooge and he were partners for I don't know how many years. "
		+ "Scrooge was his sole executor, his sole administrator, his sole assign, his sole residuary legatee, his sole friend, and sole mourner. "
		+ "And even Scrooge was not so dreadfully cut up by the sad event, but that he was an excellent man of business on the very day of the funeral, and solemnised it with an undoubted bargain. "
		+ "The mention of Marley's funeral brings me back to the point I started from. There is no doubt that Marley was dead. "
		+ "This must be distinctly understood, or nothing wonderful can come of the story I am going to relate. "
		+ "If we were not perfectly convinced that Hamlet's Father died before the play began, there would be nothing more remarkable in his taking a stroll at night, in an easterly wind, upon his own ramparts, than there would be in any other middle-aged gentleman rashly turning out after dark in a breezy spot -- say Saint Paul's Churchyard for instance -- literally to astonish his son's weak mind. "
		+ "Scrooge never painted out Old Marley's name. There it stood, years afterwards, above the warehouse door: Scrooge and Marley. The firm was known as Scrooge and Marley. "
		+ "Sometimes people new to the business called Scrooge Scrooge, and sometimes Marley, but he answered to both names. It was all the same to him. "
		+ "Oh! But he was a tight-fisted hand at the grind-stone, Scrooge! A squeezing, wrenching, grasping, scraping, clutching, covetous, old sinner! "
		+ "Hard and sharp as flint, from which no steel had ever struck out generous fire; secret, and self-contained, and solitary as an oyster. "
		+ "The cold within him froze his old features, nipped his pointed nose, shrivelled his cheek, stiffened his gait; made his eyes red, his thin lips blue and spoke out shrewdly in his grating voice. "
		+ "A frosty rime was on his head, and on his eyebrows, and his wiry chin. He carried his own low temperature always about with him; he iced his office in the dogdays; and didn't thaw it one degree at Christmas. "
		+ "External heat and cold had little influence on Scrooge. No warmth could warm, no wintry weather chill him. No wind that blew was bitterer than he, no falling snow was more intent upon its purpose, no pelting rain less open to entreaty. "
		+ "Foul weather didn't know where to have him. The heaviest rain, and snow, and hail, and sleet, could boast of the advantage over him in only one respect. They often 'came down' handsomely, and Scrooge never did. "
		+ "Nobody ever stopped him in the street to say, with gladsome looks, 'My dear Scrooge, how are you? When will you come to see me?' No beggars implored him to bestow a trifle, no children asked him what it was o'clock, no man or woman ever once in all his life inquired the way to such and such a place, of Scrooge. "
		+ "Even the blind men's dogs appeared to know him; and when they saw him coming on, would tug their owners into doorways and up courts; and then would wag their tails as though they said, 'No eye at all is better than an evil eye, dark master!' "
		+ "But what did Scrooge care! It was the very thing he liked. To edge his way along the crowded paths of life, warning all human sympathy to keep its distance, was what the knowing ones call 'nuts' to Scrooge.";

	@Override
	protected SolveResult<CryptographyOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, CryptographyInput input) {
		if (input.ciphertext() == null || input.ciphertext().isBlank()) {
			return failure("Ciphertext is required.");
		}
		if (input.keyLetters() == null || input.keyLetters().size() != 5) {
			return failure("Exactly 5 key letters are required.");
		}
		Set<String> keySet = new LinkedHashSet<>();
		for (String k : input.keyLetters()) {
			String letter = k == null ? "" : k.trim().toUpperCase();
			if (letter.length() != 1 || letter.charAt(0) < 'A' || letter.charAt(0) > 'Z') {
				return failure("Each key letter must be A–Z.");
			}
			keySet.add(letter);
		}
		if (keySet.size() != 5) {
			return failure("The 5 key letters must be distinct.");
		}

		String cipherNorm = input.ciphertext().toUpperCase().trim();
		String[] cipherWordArr = cipherNorm.split("\\s+");
		List<String> cipherWords = new ArrayList<>();
		for (String w : cipherWordArr) {
			String clean = w.replaceAll("[^A-Z]", "");
			if (!clean.isEmpty()) cipherWords.add(clean);
		}
		if (cipherWords.isEmpty()) {
			return failure("Ciphertext must contain at least one word.");
		}

		List<String> excerptWords = EXCERPT_WORDS;
		int n = cipherWords.size();
		for (int start = 0; start <= excerptWords.size() - n; start++) {
			// check word lengths match
			boolean lengthsMatch = true;
			for (int i = 0; i < n; i++) {
				if (excerptWords.get(start + i).length() != cipherWords.get(i).length()) {
					lengthsMatch = false;
					break;
				}
			}
			if (!lengthsMatch) continue;

			List<String> candidateWords = new ArrayList<>();
			for (int i = 0; i < n; i++) {
				candidateWords.add(excerptWords.get(start + i));
			}
			Map<Character, Character> cipherToPlain = new TreeMap<>();
			boolean valid = true;
			for (int i = 0; i < n && valid; i++) {
				String cw = cipherWords.get(i);
				String pw = candidateWords.get(i);
				for (int j = 0; j < cw.length(); j++) {
					char cipherChar = cw.charAt(j);
					char plainChar = pw.charAt(j);
					if (cipherChar == 'E' && plainChar != 'E') {
						valid = false;
						break;
					}
					if (cipherChar != 'E' && cipherChar == plainChar) {
						valid = false;
						break;
					}
					Character existing = cipherToPlain.get(cipherChar);
					if (existing != null && existing != plainChar) {
						valid = false;
						break;
					}
					for (Character otherCipher : cipherToPlain.keySet()) {
						if (otherCipher != cipherChar && cipherToPlain.get(otherCipher) == plainChar) {
							valid = false;
							break;
						}
					}
					cipherToPlain.put(cipherChar, plainChar);
				}
			}
			if (!valid) continue;

			String plaintext = String.join(" ", candidateWords);
			List<String> keyOrder = new ArrayList<>();
			Set<String> seen = new LinkedHashSet<>();
			for (int i = 0; i < plaintext.length(); i++) {
				String ch = String.valueOf(plaintext.charAt(i));
				if (keySet.contains(ch) && !seen.contains(ch)) {
					seen.add(ch);
					keyOrder.add(ch);
				}
			}
			if (keyOrder.size() != 5) continue;

			return success(new CryptographyOutput(plaintext, keyOrder));
		}

		return failure("No matching phrase found in the excerpt for this ciphertext. Check that the ciphertext is from the module and word lengths match.");
	}
}
