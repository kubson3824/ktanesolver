package ktanesolver.module.modded.regular.souvenir;

import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
	type = ModuleType.SOUVENIR,
	id = "souvenir",
	name = "Souvenir",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Answer questions about previously solved modules",
	tags = {"memory", "questions", "boss", "modded"}
)
public class SouvenirSolver extends AbstractModuleSolver<SouvenirInput, SouvenirOutput> {
	private static final Pattern ORDINAL = Pattern.compile("\\b(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|\\d+(?:st|nd|rd|th))\\b");
	private static final Set<String> IGNORED_WORDS = Set.of(
		"a", "an", "and", "in", "of", "on", "the", "these", "this", "to", "was", "were", "what", "which"
	);

	@Override
	protected SolveResult<SouvenirOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, SouvenirInput input
	) {
		if (input == null || input.sourceModuleId() == null) return failure("Select the solved module named by the question");
		if (input.question() == null || input.question().isBlank()) return failure("Enter the question shown on Souvenir");
		if (input.answers() == null || input.answers().size() < 2 || input.answers().size() > 6) {
			return failure("Enter the 2 to 6 answers shown on Souvenir");
		}
		if (input.answers().stream().anyMatch(answer -> answer == null || answer.isBlank())) return failure("Answer labels cannot be blank");
		if (input.answers().stream().map(SouvenirSolver::answerLabel).distinct().count() != input.answers().size()) {
			return failure("Answer labels must be unique");
		}

		ModuleEntity source = bomb.getModules().stream()
			.filter(candidate -> input.sourceModuleId().equals(candidate.getId()))
			.findFirst().orElse(null);
		if (source == null || source == module) return failure("The selected source module is not on this bomb");
		if (!source.isSolved()) return failure("Souvenir only asks about modules solved earlier");

		Integer special = resolveSpecial(source, input.question(), input.answers());
		int answerIndex = special == null ? resolveFromRecordedFacts(source, input.question(), input.answers()) : special;
		if (answerIndex < 0) return failure("The recorded module state does not distinguish one of these answers");

		String answer = input.answers().get(answerIndex);
		List<Map<String, Object>> history = history(module);
		history.add(Map.of(
			"sourceModuleId", source.getId().toString(),
			"sourceModuleType", source.getType().name(),
			"question", input.question().trim(),
			"answer", answer,
			"answerIndex", answerIndex + 1
		));
		storeState(module, "history", history);
		return success(new SouvenirOutput(answer, answerIndex + 1), input.finalQuestion());
	}

	private Integer resolveSpecial(ModuleEntity source, String question, List<String> answers) {
		String q = normalize(question);
		return switch (source.getType()) {
			case BITMAPS -> answerIndex(answers, bitmapAnswer(source.getState(), q));
			case CHEAP_CHECKOUT -> cheapCheckoutAnswerIndex(source.getState(), q, answers);
			case CHORD_QUALITIES -> chordQualitiesAnswerIndex(source.getState(), answers);
			case CREATION -> answerIndex(answers, source.getState().get("firstWeather"));
			case COORDINATES -> answerIndex(answers, source.getState().get("gridSizeClue"));
			case COLOR_FLASH -> answerIndex(answers, nested(source.getState(), "input", "sequence", -1, "color"));
			case FORGET_ME_NOT -> answerIndex(answers, nested(source.getState(), "displayNumbers", ordinal(q)));
			case GAMEPAD -> answerIndex(answers, nested(source.getState(), "input", ordinal(q) == 1 ? "y" : "x"));
			case LISTENING -> answerIndex(answers, source.getState().get("soundDescription"));
			case MAZES -> answerIndex(answers, nested(source.getState(), "input", "start", q.contains("column") ? "col" : "row"));
			case MONSPLODE_FIGHT -> q.contains("creature")
				? answerIndex(answers, nested(source.getState(), "input", "opponent"))
				: membershipAnswerIndex(answers, nested(source.getState(), "input", "moves"), null, q.contains("not selectable"));
			case MORSEMATICS -> membershipAnswerIndex(answers, source.getState().get("letters"), null, q.contains("not present"));
			case MURDER -> murderAnswerIndex(source, q, answers);
			case MYSTIC_SQUARE -> answerIndex(answers, nested(source.getState(), "input", "grid", 4));
			case NEUTRALIZATION -> answerIndex(answers, source.getState().get(q.contains("volume") ? "acidVolume" : "acidColor"));
			case ONLY_CONNECT -> answerIndex(answers, nested(source.getState(), "hieroglyphs", onlyConnectPosition(q)));
			case PERSPECTIVE_PEGS -> answerIndex(answers, nested(source.getState(), "initialSequence", ordinal(q)));
			case PROBING -> {
				Object frequency = nested(source.getState(), "missingFrequenciesByWire", probingWireIndex(q));
				yield answerIndex(answers, frequency == null ? null : frequency + "Hz");
			}
			case RHYTHMS -> answerIndex(answers, source.getState().get("lastSuccessfulColor"));
			case SEA_SHELLS -> seaShellsAnswerIndex(source.getState(), q, answers);
			case SHAPE_SHIFT -> shapeShiftAnswerIndex(source.getState(), answers);
			case SILLY_SLOTS -> sillySlotsAnswerIndex(source.getState(), q, answers);
			case SIMON_SAYS -> answerIndex(answers, nested(source.getState(), "input", "flashes", ordinal(q)));
			case SIMON_SCREAMS -> simonScreamsAnswerIndex(source.getState(), q, answers);
			case SIMON_STATES -> simonStatesAnswerIndex(source.getState(), q, answers);
			case SKEWED_SLOTS -> answerIndex(answers, source.getState().get("originalNumber"));
			case SWITCHES -> switchesAnswerIndex(source.getState(), answers);
			case SOUVENIR -> otherSouvenirAnswerIndex(source.getState(), answers);
			case THE_BULB -> answerIndex(answers, source.getState().get("initiallyOn"));
			case THREE_D_MAZE -> answerIndex(answers, source.getState().get(q.contains("markings") ? "markings" : "cardinalDirection"));
			case TIC_TAC_TOE -> answerIndex(answers, nested(source.getState(), "initialBoard", ticTacToePosition(q)));
			case TWO_BITS -> twoBitsAnswerIndex(source.getState(), q, answers);
			default -> null;
		};
	}

	private static int cheapCheckoutAnswerIndex(Map<String, Object> state, String question, List<String> answers) {
		Object raw = state.get("paidAmounts");
		if (!(raw instanceof List<?> paidAmounts) || paidAmounts.isEmpty()) return -1;
		int index = ordinal(question);
		if (index < 0 && paidAmounts.size() == 1) index = 0;
		return index >= 0 && index < paidAmounts.size() ? answerIndex(answers, paidAmounts.get(index)) : -1;
	}

	private static int otherSouvenirAnswerIndex(Map<String, Object> state, List<String> answers) {
		Object raw = state.get("history");
		if (!(raw instanceof List<?> history) || history.isEmpty() || !(history.getFirst() instanceof Map<?, ?> first)) return -1;
		Object type = first.get("sourceModuleType");
		if (type != null) {
			Set<String> typeWords = words(String.valueOf(type).replace('_', ' '));
			for (int i = 0; i < answers.size(); i++) if (words(answers.get(i)).equals(typeWords)) return i;
		}
		Object question = first.get("question");
		if (question == null) return -1;
		Set<String> questionWords = words(String.valueOf(question));
		int result = -1;
		for (int i = 0; i < answers.size(); i++) {
			if (!questionWords.containsAll(words(answers.get(i)))) continue;
			if (result >= 0) return -1;
			result = i;
		}
		return result;
	}

	private static int twoBitsAnswerIndex(Map<String, Object> state, String question, List<String> answers) {
		int response = ordinal(question);
		if (response < 0) return -1;
		Object value = nested(state, "stages", response + 1, "number");
		return answerIndex(answers, value instanceof Number number ? String.format(Locale.ROOT, "%02d", number.intValue()) : null);
	}

	private static int murderAnswerIndex(ModuleEntity source, String question, List<String> answers) {
		if (question.contains("body found")) return answerIndex(answers, nested(source.getState(), "input", "bodyLocation"));
		boolean weapon = question.contains("weapon");
		Object present = nested(source.getState(), "input", weapon ? "weapons" : "suspects");
		Object murderer = source.getSolution().get(weapon ? "weapon" : "suspect");
		return membershipAnswerIndex(answers, present, murderer, question.contains("not a"));
	}

	private static int seaShellsAnswerIndex(Map<String, Object> state, String question, List<String> answers) {
		int stage = lastOrdinal(question);
		String key = question.contains("first and second") ? "row" : question.contains("third and fourth") ? "column" : "key";
		Object value = nested(state, "inputHistory", stage, key);
		if ("key".equals(key) && value != null) value = String.valueOf(value).replaceFirst("(?i)^ON THE ", "");
		return answerIndex(answers, value);
	}

	private static int shapeShiftAnswerIndex(Map<String, Object> state, List<String> answers) {
		Object left = nested(state, "input", "left");
		Object right = nested(state, "input", "right");
		if (left == null || right == null) return -1;
		List<String> edges = List.of("SQUARE", "ROUND", "POINT", "CONCAVE");
		int value = edges.indexOf(String.valueOf(right)) + 4 * edges.indexOf(String.valueOf(left));
		return answerIndex(answers, List.of(String.valueOf((char) ('A' + value)), left + " " + right));
	}

	private static int sillySlotsAnswerIndex(Map<String, Object> state, String question, List<String> answers) {
		List<Integer> ordinals = ordinals(question);
		if (ordinals.size() < 2) return -1;
		return answerIndex(answers, nested(state, "displayHistory", ordinals.getLast(), ordinals.getFirst()));
	}

	private static int simonStatesAnswerIndex(Map<String, Object> state, String question, List<String> answers) {
		Object raw = nested(state, "flashHistory", ordinal(question));
		if (!(raw instanceof List<?> flashes)) return -1;
		List<String> colors = List.of("RED", "YELLOW", "GREEN", "BLUE");
		boolean negative = question.contains("didn t flash") || question.contains("not flash");
		List<String> selected = colors.stream().filter(color -> negative != flashes.stream().map(String::valueOf).anyMatch(color::equals)).toList();
		String value = selected.isEmpty() ? "none" : selected.size() == 4 ? "all 4" : String.join(", ", selected);
		return answerIndex(answers, value);
	}

	private static int simonScreamsAnswerIndex(Map<String, Object> state, String question, List<String> answers) {
		if (question.contains("final sequence")) {
			return answerIndex(answers, nested(state, "flashHistory", -1, ordinal(question)));
		}
		Object raw = state.get("ruleHistory");
		if (!(raw instanceof List<?> rules) || rules.size() != 3) return -1;
		for (Object candidate : rules) {
			String rule = normalize(candidate);
			if ("otherwise".equals(rule) || !question.contains(rule)) continue;
			List<Integer> stages = new ArrayList<>();
			for (int stage = 0; stage < rules.size(); stage++) if (normalize(rules.get(stage)).equals(rule)) stages.add(stage);
			String value = stages.size() == 3 ? "all of them" : stages.stream()
				.map(stage -> List.of("first", "second", "third").get(stage))
				.reduce((left, right) -> left + " and " + right).orElse(null);
			return answerIndex(answers, value);
		}
		return -1;
	}

	private static int switchesAnswerIndex(Map<String, Object> state, List<String> answers) {
		Object raw = state.get("currentSwitches");
		if (!(raw instanceof List<?> switches) || switches.size() != 5) return -1;
		String code = switches.stream().map(up -> Boolean.TRUE.equals(up) ? "Q" : "R").reduce("", String::concat);
		String description = switches.stream().map(up -> Boolean.TRUE.equals(up) ? "up" : "down").reduce((a, b) -> a + " " + b).orElse("");
		return answerIndex(answers, List.of(code, description));
	}

	private static int membershipAnswerIndex(List<String> answers, Object present, Object excluded, boolean inverse) {
		Collection<?> values = present instanceof Collection<?> collection ? collection : present == null ? List.of() : List.of(String.valueOf(present).split(""));
		Set<String> normalized = values.stream().map(SouvenirSolver::normalize).collect(java.util.stream.Collectors.toSet());
		String excludedValue = excluded == null ? null : normalize(excluded);
		int result = -1;
		for (int i = 0; i < answers.size(); i++) {
			String answer = normalize(answers.get(i));
			boolean matches = inverse ? !normalized.contains(answer) : normalized.contains(answer) && !answer.equals(excludedValue);
			if (matches) {
				if (result >= 0) return -1;
				result = i;
			}
		}
		return result;
	}

	private static int chordQualitiesAnswerIndex(Map<String, Object> state, List<String> answers) {
		if (!(state.get("givenNotes") instanceof Collection<?> notes)) return -1;
		Set<String> given = notes.stream().map(note -> String.valueOf(note).replace('♯', '#').toUpperCase(Locale.ROOT)).collect(java.util.stream.Collectors.toSet());
		int result = -1;
		for (int i = 0; i < answers.size(); i++) {
			if (!given.contains(answers.get(i).trim().replace('♯', '#').toUpperCase(Locale.ROOT))) continue;
			if (result >= 0) return -1;
			result = i;
		}
		return result;
	}

	private int resolveFromRecordedFacts(ModuleEntity source, String question, List<String> answers) {
		List<Fact> facts = new ArrayList<>();
		collect(source.getState(), "state", -1, false, facts);
		collect(source.getSolution(), "solution", -1, false, facts);
		String q = normalize(question);
		boolean inverse = q.contains("not present") || q.contains("was not selectable") || q.contains("wasn't selectable");
		int ordinal = ordinal(q);
		Set<String> questionWords = words(q);
		int bestIndex = -1;
		int bestScore = Integer.MIN_VALUE;
		boolean tied = false;

		for (int i = 0; i < answers.size(); i++) {
			String answer = normalize(answers.get(i));
			int score = facts.stream()
				.filter(fact -> fact.value().equals(answer))
				.mapToInt(fact -> score(fact, questionWords, ordinal, q.contains("last")))
				.max().orElse(Integer.MIN_VALUE);
			if (inverse) score = score == Integer.MIN_VALUE ? 1 : Integer.MIN_VALUE;
			if (score > bestScore) {
				bestIndex = i;
				bestScore = score;
				tied = false;
			} else if (score == bestScore) {
				tied = true;
			}
		}
		return bestScore == Integer.MIN_VALUE || tied ? -1 : bestIndex;
	}

	private static int score(Fact fact, Set<String> questionWords, int ordinal, boolean last) {
		int score = 1;
		if (ordinal >= 0 && fact.index() == ordinal) score += 100;
		if (last && fact.last()) score += 100;
		for (String word : words(fact.path())) if (questionWords.contains(word)) score += 5;
		if (questionWords.contains("initial") && fact.path().toLowerCase(Locale.ROOT).contains("initial")) score += 30;
		return score;
	}

	private static void collect(Object value, String path, int index, boolean last, List<Fact> facts) {
		if (value == null) return;
		if (value instanceof Map<?, ?> map) {
			map.forEach((key, child) -> collect(child, path + "." + key, -1, false, facts));
			return;
		}
		if (value instanceof Collection<?> collection) {
			List<?> values = collection instanceof List<?> list ? list : new ArrayList<>(collection);
			for (int i = 0; i < values.size(); i++) collect(values.get(i), path + "[" + i + "]", i, i == values.size() - 1, facts);
			facts.add(new Fact(path, normalize(values), -1, false));
			return;
		}
		if (value.getClass().isArray()) {
			int length = Array.getLength(value);
			for (int i = 0; i < length; i++) collect(Array.get(value, i), path + "[" + i + "]", i, i == length - 1, facts);
			return;
		}
		facts.add(new Fact(path, normalize(value), index, last));
		if (value instanceof Boolean bool) facts.add(new Fact(path, bool ? "yes" : "no", index, last));
	}

	private static Object bitmapAnswer(Map<String, Object> state, String question) {
		Object raw = state.get("whiteCounts");
		if (!(raw instanceof List<?> counts) || counts.size() != 4) return null;
		int quadrant = question.contains("top right") ? 1 : question.contains("bottom left") ? 2 : question.contains("bottom right") ? 3 : 0;
		Object value = counts.get(quadrant);
		return question.contains("black") && value instanceof Number number ? 16 - number.intValue() : value;
	}

	private static Object nested(Map<String, Object> map, Object... path) {
		Object value = map;
		for (Object part : path) {
			if (value instanceof Map<?, ?> current && part instanceof String key) value = current.get(key);
			else if (value instanceof List<?> current && part instanceof Integer i && !current.isEmpty()) {
				int index = i < 0 ? current.size() - 1 : i;
				if (index >= current.size()) return null;
				value = current.get(index);
			} else return null;
		}
		return value;
	}

	private static int probingWireIndex(String question) {
		if (question.contains("red white")) return 0;
		if (question.contains("yellow black")) return 1;
		if (question.contains("green")) return 2;
		if (question.contains("gray")) return 3;
		if (question.contains("yellow red")) return 4;
		return 5;
	}

	private static int ticTacToePosition(String question) {
		String[] positions = {"top left", "top middle", "top right", "middle left", "middle center", "middle right", "bottom left", "bottom middle", "bottom right"};
		for (int i = 0; i < positions.length; i++) if (question.contains(positions[i])) return i;
		return -1;
	}

	private static int onlyConnectPosition(String question) {
		String[] positions = {"top left", "top middle", "top right", "bottom left", "bottom middle", "bottom right"};
		for (int i = 0; i < positions.length; i++) if (question.contains(positions[i])) return i;
		return -1;
	}

	private static Integer answerIndex(List<String> answers, Object answer) {
		if (answer == null) return -1;
		if (answer instanceof Collection<?> accepted) {
			for (Object value : accepted) {
				Integer index = answerIndex(answers, value);
				if (index >= 0) return index;
			}
			return -1;
		}
		String expected = normalize(answer);
		for (int i = 0; i < answers.size(); i++) if (normalize(answers.get(i)).equals(expected)) return i;
		return -1;
	}

	private static int ordinal(String question) {
		List<Integer> values = ordinals(question);
		return values.isEmpty() ? -1 : values.getFirst();
	}

	private static int lastOrdinal(String question) {
		List<Integer> values = ordinals(question);
		return values.isEmpty() ? -1 : values.getLast();
	}

	private static List<Integer> ordinals(String question) {
		List<Integer> values = new ArrayList<>();
		Matcher match = ORDINAL.matcher(question);
		while (match.find()) values.add(switch (match.group(1)) {
			case "first" -> 0;
			case "second" -> 1;
			case "third" -> 2;
			case "fourth" -> 3;
			case "fifth" -> 4;
			case "sixth" -> 5;
			case "seventh" -> 6;
			case "eighth" -> 7;
			case "ninth" -> 8;
			case "tenth" -> 9;
			default -> Integer.parseInt(match.group(1).replaceAll("\\D", "")) - 1;
		});
		return values;
	}

	private static Set<String> words(String value) {
		Set<String> words = new HashSet<>(List.of(normalize(value.replaceAll("([a-z])([A-Z])", "$1 $2")).split(" ")));
		words.removeAll(IGNORED_WORDS);
		return words;
	}

	private static String normalize(Object value) {
		if (value instanceof Collection<?> collection) value = collection.stream().map(String::valueOf).toList();
		return String.valueOf(value).replaceAll("([a-z])([A-Z])", "$1 $2")
			.replaceAll("[^\\p{L}\\p{N}]+", " ").trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
	}

	private static String answerLabel(String value) {
		return value.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
	}

	@SuppressWarnings("unchecked")
	private static List<Map<String, Object>> history(ModuleEntity module) {
		Object value = module.getState().get("history");
		return value instanceof List<?> list ? new ArrayList<>((List<Map<String, Object>>) list) : new ArrayList<>();
	}

	private record Fact(String path, String value, int index, boolean last) {}
}
