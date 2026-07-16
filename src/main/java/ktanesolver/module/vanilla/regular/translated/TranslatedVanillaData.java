package ktanesolver.module.vanilla.regular.translated;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.text.Normalizer;

import ktanesolver.utils.Json;

public final class TranslatedVanillaData {
	private static final List<Double> MORSE_FREQUENCIES = List.of(
		3.505, 3.515, 3.522, 3.532, 3.535, 3.542, 3.545, 3.552,
		3.555, 3.565, 3.572, 3.575, 3.582, 3.592, 3.595, 3.600);
	private static final Data DATA = load();

	private TranslatedVanillaData() {}

	public static String language(String language) {
		String code = language == null || language.isBlank() ? "EN" : language.strip().toUpperCase(Locale.ROOT);
		code = switch(code) {
			case "JA", "JPN" -> "JP";
			case "ZH", "ZHS-CN" -> "ZHS";
			default -> code;
		};
		if(!DATA.languages().containsKey(code)) throw new IllegalArgumentException("Unsupported language: " + code);
		return code;
	}

	public static String canonicalButtonLabel(String language, String label) {
		String target = normalize(label);
		return DATA.button().get(language(language)).entrySet().stream()
			.filter(entry -> normalize(entry.getValue()).equals(target))
			.map(Map.Entry::getKey)
			.findFirst().orElse(null);
	}

	public static String canonicalWhosOnFirstDisplay(String language, String display) {
		String canonical = canonical(language, display, true);
		return canonical != null && canonical.isEmpty() ? " " : canonical;
	}

	public static String canonicalWhosOnFirstLabel(String language, String label) {
		return canonical(language, label, false);
	}

	public static List<String> passwordWords(String language) {
		return DATA.passwords().get(language(language));
	}

	public static List<MorseWordData> morseWords(String language) {
		MorseData data = DATA.morse().get(language(language));
		return java.util.stream.IntStream.range(0, data.words().size()).mapToObj(index ->
			new MorseWordData(data.displayWords().get(index).isBlank() ? data.words().get(index) : data.displayWords().get(index),
				MORSE_FREQUENCIES.get(index), encode(data, data.words().get(index))))
			.toList();
	}

	public static String normalize(String value) {
		if(value == null) return "";
		return Normalizer.normalize(value, Normalizer.Form.NFKC).strip().replace('‘', '\'').replace('’', '\'')
			.replaceAll("[\\p{Z}\\s]+", " ").toUpperCase(Locale.ROOT);
	}

	private static String canonical(String language, String value, boolean display) {
		WofData translated = DATA.whosOnFirst().get(language(language));
		WofData english = DATA.whosOnFirst().get("EN");
		List<String> translatedValues = display ? translated.displays() : translated.labels();
		List<String> englishValues = display ? english.displays() : english.labels();
		String target = normalize(value);
		for(int i = 0; i < translatedValues.size(); i++)
			if(normalize(translatedValues.get(i)).equals(target)) return normalize(englishValues.get(i));
		return null;
	}

	private static List<String> encode(MorseData data, String word) {
		return word.chars().mapToObj(character -> {
			int index = data.characters().indexOf(character);
			if(index < 0) throw new IllegalStateException("Missing Morse character " + (char)character);
			return data.symbols().get(index);
		}).toList();
	}

	private static Data load() {
		try(InputStream stream = TranslatedVanillaData.class.getResourceAsStream("/translated-vanilla.json")) {
			if(stream == null) throw new IllegalStateException("Missing translated vanilla module data");
			Data data = Json.mapper().readValue(stream, Data.class);
			validate(data);
			return data;
		} catch(IOException exception) {
			throw new IllegalStateException("Could not read translated vanilla module data", exception);
		}
	}

	private static void validate(Data data) {
		for(String language : data.languages().keySet()) {
			WofData wof = data.whosOnFirst().get(language);
			MorseData morse = data.morse().get(language);
			if(data.button().get(language).size() != 4 || wof.displays().size() != 28 || wof.labels().size() != 28
				|| data.passwords().get(language).size() != 35 || morse.words().size() != 16
				|| morse.displayWords().size() != 16 || morse.characters().length() != morse.symbols().size())
				throw new IllegalStateException("Invalid translated vanilla data for " + language);
		}
	}

	public record MorseWordData(String word, double frequency, List<String> symbols) {}
	private record Data(Map<String, String> languages, Map<String, Map<String, String>> button,
		Map<String, WofData> whosOnFirst, Map<String, List<String>> passwords, Map<String, MorseData> morse) {}
	private record WofData(List<String> displays, List<String> labels) {}
	private record MorseData(String characters, List<String> symbols, List<String> words, List<String> displayWords) {}
}
