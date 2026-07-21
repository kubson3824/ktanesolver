package ktanesolver.module.modded.regular.souvenir;

import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.Arrays;
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
import ktanesolver.module.modded.regular.murder.MurderInput;
import ktanesolver.module.modded.regular.thirdbase.ThirdBaseSolver;
import ktanesolver.utils.Json;

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
	private static final List<String> PROBING_WIRES = List.of(
		"red-white", "yellow-black", "green", "gray", "yellow-red", "red-blue"
	);

	@Override
	protected SolveResult<SouvenirOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, SouvenirInput input
	) {
		if (input == null || input.sourceModuleId() == null) return failure("Select the solved module named by the question");
		if (input.question() == null || input.question().isBlank()) return failure("Enter the question shown on Souvenir");
		boolean directAnswer = input.answers() == null || input.answers().isEmpty();
		if (!directAnswer && (input.answers().size() < 2 || input.answers().size() > 6)) {
			return failure("Enter the 2 to 6 answers shown on Souvenir");
		}
		if (!directAnswer && input.answers().stream().anyMatch(answer -> answer == null || answer.isBlank())) return failure("Answer labels cannot be blank");
		if (!directAnswer && input.answers().stream().map(SouvenirSolver::answerLabel).distinct().count() != input.answers().size()) {
			return failure("Answer labels must be unique");
		}

		ModuleEntity source = bomb.getModules().stream()
			.filter(candidate -> input.sourceModuleId().equals(candidate.getId()))
			.findFirst().orElse(null);
		if (source == null || source == module) return failure("The selected source module is not on this bomb");
		if (!source.isSolved()) return failure("Souvenir only asks about modules solved earlier");
		if (source.getType() == ModuleType.FLAGS && Boolean.TRUE.equals(source.getState().get("unicornRule"))) {
			return failure("Souvenir asks no question about Flags when the WHITE FLAG rule applies");
		}
		if (directAnswer) {
			Object recorded = resolveRecordedAnswer(source, input.question().trim());
			if (recorded == null) return failure("No recorded answer is available for this question");
			String answer = displayAnswer(recorded);
			if (answer.isBlank()) return failure("No recorded answer is available for this question");
			List<Map<String, Object>> history = history(module);
			history.add(Map.of(
				"sourceModuleId", source.getId().toString(),
				"sourceModuleType", source.getType().name(),
				"question", input.question().trim(),
				"answer", answer
			));
			storeState(module, "history", history);
			return success(new SouvenirOutput(answer, null), input.finalQuestion());
		}

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
			case BIG_CIRCLE -> answerIndex(answers, source.getState().get("spinDirection"));
			case BITMAPS -> answerIndex(answers, bitmapAnswer(source.getState(), q));
			case BRAILLE -> brailleAnswerIndex(source.getState(), q, answers);
			case CHEAP_CHECKOUT -> cheapCheckoutAnswerIndex(source.getState(), q, answers);
			case CHORD_QUALITIES -> chordQualitiesAnswerIndex(source.getState(), answers);
			case COLOR_MORSE -> answerIndex(answers, colorMorseAnswer(source.getState(), q));
			case CREATION -> answerIndex(answers, source.getState().get("firstWeather"));
			case COORDINATES -> answerIndex(answers, source.getState().get("gridSizeClue"));
			case COLOR_FLASH -> answerIndex(answers, nested(source.getState(), "input", "sequence", -1, "color"));
			case ICE_CREAM -> iceCreamAnswerIndex(source.getState(), q, answers);
			case FORGET_ME_NOT -> answerIndex(answers, nested(source.getState(), "displayNumbers", ordinal(q)));
			case FAST_MATH -> answerIndex(answers, source.getState().get("lastPair"));
			case FIZZ_BUZZ -> fizzBuzzAnswerIndex(source.getState(), q, answers);
			case FLAGS -> flagsAnswerIndex(source.getState(), q, answers);
			case TIMEZONE -> answerIndex(answers, timezoneCity(source.getState(), q));
			case GAMEPAD -> {
				int digit = ordinal(q);
				Object display = nested(source.getState(), "input", digit < 2 ? "x" : "y");
				yield digit >= 0 && digit < 4 && display instanceof Number number
					? answerIndex(answers, digit % 2 == 0 ? number.intValue() / 10 : number.intValue() % 10) : -1;
			}
			case GRIDLOCK -> answerIndex(answers, source.getState().get(q.contains("color") ? "startingColor" : "startingLocation"));
			case HUNTING -> membershipAnswerIndex(answers, huntingClues(source.getState(), q), null, false);
			case GAME_OF_LIFE_CRUEL -> membershipAnswerIndex(answers, source.getState().get("colorCombinations"), null, false);
			case LED_ENCRYPTION -> ledEncryptionAnswerIndex(source.getState(), q, answers);
			case LISTENING -> answerIndex(answers, source.getState().get("soundDescription"));
			case MAZES -> answerIndex(answers, nested(source.getState(), "input", "start", q.contains("column") ? "col" : "row"));
			case MONSPLODE_FIGHT -> q.contains("creature")
				? answerIndex(answers, nested(source.getState(), "input", "opponent"))
				: membershipAnswerIndex(answers, nested(source.getState(), "input", "moves"), null, q.contains("not selectable"));
			case MONSPLODE_TRADING_CARDS -> membershipAnswerIndex(answers,
				source.getState().get(q.contains("print") ? "souvenirPrintVersions" : "souvenirCardNames"), null, false);
			case MORSEMATICS -> membershipAnswerIndex(answers, source.getState().get("letters"), null, q.contains("not present"));
			case MORSE_A_MAZE -> answerIndex(answers, morseAMazeAnswer(source.getState(), q));
			case MAFIA -> membershipAnswerIndex(answers, source.getState().get("players"), source.getState().get("godfather"), false);
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
			case SONIC_THE_HEDGEHOG -> answerIndex(answers, sonicTheHedgehogAnswer(source.getState(), q));
			case SKEWED_SLOTS -> answerIndex(answers, source.getState().get("originalNumber"));
			case SWITCHES -> switchesAnswerIndex(source.getState(), answers);
			case SYMBOL_CYCLE -> answerIndex(answers, source.getState().get(q.contains("left") ? "leftCycleLength" : "rightCycleLength"));
			case COLORED_SWITCHES -> answerIndex(answers, switchCode(source.getState().get("initialPosition")));
			case SOUVENIR -> otherSouvenirAnswerIndex(source.getState(), answers);
			case THE_BULB -> answerIndex(answers, source.getState().get("initiallyOn"));
			case THREE_D_MAZE -> answerIndex(answers, q.contains("markings")
				? normalize(source.getState().get("markings")).replace(" ", "")
				: source.getState().get("cardinalDirection"));
			case TIC_TAC_TOE -> answerIndex(answers, nested(source.getState(), "initialBoard", ticTacToePosition(q)));
			case TWO_BITS -> twoBitsAnswerIndex(source.getState(), q, answers);
			case X_RAY -> membershipAnswerIndex(answers, source.getState().get("scannedSymbols"), null, false);
			case YAHTZEE -> yahtzeeAnswerIndex(source.getState(), answers);
			default -> null;
		};
	}

	private static Object resolveRecordedAnswer(ModuleEntity source, String question) {
		Map<String, Object> state = source.getState();
		return switch (source.getType()) {
			case BUTTON -> state.get("stripColor");
			case BIG_CIRCLE -> state.get("spinDirection");
			case MEMORY -> switch (question) {
				case "displays" -> state.get("displayHistory");
				case "positions" -> valuesAt(state.get("solutionHistory"), "position");
				case "labels" -> valuesAt(state.get("solutionHistory"), "label");
				default -> null;
			};
			case SIMON_SAYS -> nested(state, "input", "flashes");
			case WIRE_SEQUENCES -> Map.of("red", state.get("red"), "blue", state.get("blue"), "black", state.get("black"));
			case WHOS_ON_FIRST -> state.get("displayHistory");
			case THIRD_BASE -> thirdBaseDisplay(state.get("displayHistory"), question);
			case BITMAPS -> labeledValues(
				"blackPixels".equals(question) ? blackCounts(state.get("whiteCounts")) : state.get("whiteCounts"),
				List.of("top left", "top right", "bottom left", "bottom right"));
			case BRAILLE -> braillePatternLabel(braillePattern(state, question));
			case CHEAP_CHECKOUT -> state.get("paidAmounts");
			case CHORD_QUALITIES -> state.get("givenNotes");
			case COLOR_MORSE -> colorMorseAnswer(state, normalize(question));
			case CREATION -> state.get("firstWeather");
			case COORDINATES -> state.get("gridSizeClue");
			case COLOR_FLASH -> nested(state, "input", "sequence", -1, "color");
			case ICE_CREAM -> "customers".equals(question)
				? valuesAt(state.get("stages"), "customer") : valuesAt(state.get("stages"), "offeredFlavors");
			case FORGET_ME_NOT -> state.get("displayNumbers");
			case FAST_MATH -> state.get("lastPair");
			case FIZZ_BUZZ -> labeledValues(state.get("displayedNumbers"), List.of("top", "middle", "bottom"));
			case FLAGS -> switch (question) {
				case "displayedNumber" -> state.get("displayedNumber");
				case "mainCountry" -> state.get("mainCountry");
				default -> null;
			};
			case TIMEZONE -> timezoneCity(state, normalize(question));
			case GAMEPAD -> gamepadDisplay(state);
			case GRIDLOCK -> state.get(normalize(question).contains("color") ? "startingColor" : "startingLocation");
			case HUNTING -> huntingDisplayClues(state, normalize(question));
			case GAME_OF_LIFE_CRUEL -> state.get("colorCombinations");
			case LED_ENCRYPTION -> ledEncryptionLetters(state);
			case LISTENING -> state.get("soundDescription");
			case MAZES -> nested(state, "input", "start");
			case MONSPLODE_FIGHT -> nested(state, "input", "creature".equals(question) ? "opponent" : "moves");
			case MONSPLODE_TRADING_CARDS -> state.get("printVersions".equals(question)
				? "souvenirPrintVersions" : "souvenirCardNames");
			case MORSEMATICS -> state.get("letters");
			case MORSE_A_MAZE -> morseAMazeAnswer(state, normalize(question));
			case MAFIA -> null;
			case MURDER -> murderRecordedAnswer(source, question);
			case MYSTIC_SQUARE -> nested(state, "input", "grid", 4);
			case NEUTRALIZATION -> state.get("acidVolume".equals(question) ? "acidVolume" : "acidColor");
			case ONLY_CONNECT -> labeledValues(state.get("hieroglyphs"),
				List.of("top left", "top middle", "top right", "bottom left", "bottom middle", "bottom right"));
			case PERSPECTIVE_PEGS -> state.get("initialSequence");
			case PROBING -> probingRecordedAnswer(state, question);
			case RHYTHMS -> state.get("lastSuccessfulColor");
			case SEA_SHELLS -> state.get("inputHistory");
			case SHAPE_SHIFT -> shapeShiftAnswer(state);
			case SILLY_SLOTS -> state.get("displayHistory");
			case SIMON_SCREAMS -> state.get("rules".equals(question) ? "ruleHistory" : "flashHistory");
			case SIMON_STATES -> state.get("flashHistory");
			case SONIC_THE_HEDGEHOG -> sonicTheHedgehogAnswer(state, normalize(question));
			case SKEWED_SLOTS -> state.get("originalNumber");
			case SWITCHES -> switchCode(state.get("currentSwitches"));
			case SYMBOL_CYCLE -> state.get("leftSymbolCount".equals(question) ? "leftCycleLength" : "rightCycleLength");
			case COLORED_SWITCHES -> switchCode(state.get("initialPosition"));
			case SOUVENIR -> firstHistoryType(state.get("history"));
			case THE_BULB -> state.get("initiallyOn");
			case THREE_D_MAZE -> "markings".equals(question)
				? normalize(state.get("markings")).replace(" ", "").toUpperCase(Locale.ROOT)
				: state.get("cardinalDirection");
			case TIC_TAC_TOE -> labeledValues(state.get("initialBoard"), List.of(
				"top left", "top middle", "top right", "middle left", "middle center", "middle right", "bottom left", "bottom middle", "bottom right"));
			case TWO_BITS -> twoBitsResponses(state.get("stages"));
			case X_RAY -> state.get("scannedSymbols");
			case YAHTZEE -> state.get("initialRollCategory");
			case TEXT_FIELD -> state.get("displayedLetter");
			default -> "recordedFacts".equals(question)
				? (state.isEmpty() ? source.getSolution() : state) : resolveRecordedFact(source, question);
		};
	}

	private static Object morseAMazeAnswer(Map<String, Object> state, String question) {
		if (question.contains("starting") || "startingcoordinate".equals(question)) return state.get("startingLocation");
		if (question.contains("ending") || "endingcoordinate".equals(question)) return state.get("endingLocation");
		return question.contains("word") || question.contains("morse") || "morsecodeword".equals(question)
			? state.get("morseWord") : null;
	}

	private static Object colorMorseAnswer(Map<String, Object> state, String question) {
		int led = ordinal(question);
		return led >= 0 && led < 3 ? nested(state, question.contains("color") ? "colors" : "characters", led) : null;
	}

	private static Object braillePattern(Map<String, Object> state, String question) {
		int position = ordinal(normalize(question));
		return position >= 0 && position < 4 ? nested(state, "braillePatterns", position) : null;
	}

	private static String braillePatternLabel(Object value) {
		if (!(value instanceof Number number)) return null;
		int pattern = number.intValue();
		StringBuilder dots = new StringBuilder();
		for (int dot = 0; dot < 6; dot++) if ((pattern & 1 << dot) != 0) {
			if (!dots.isEmpty()) dots.append(", ");
			dots.append(dot + 1);
		}
		return Character.toString(0x2800 + pattern) + " (dots " + dots + ")";
	}

	private static int brailleAnswerIndex(Map<String, Object> state, String question, List<String> answers) {
		Object value = braillePattern(state, question);
		if (!(value instanceof Number number)) return -1;
		int result = -1;
		for (int i = 0; i < answers.size(); i++) {
			String answer = answers.get(i);
			int pattern = answer.codePoints().filter(character -> character >= 0x2800 && character <= 0x283f)
				.map(character -> character - 0x2800).findFirst().orElseGet(() -> answer.chars()
					.filter(character -> character >= '1' && character <= '6')
					.map(character -> 1 << character - '1').reduce(0, (left, right) -> left | right));
			if (pattern != number.intValue()) continue;
			if (result >= 0) return -1;
			result = i;
		}
		return result;
	}

	private static Object huntingClues(Map<String, Object> state, String question) {
		int stage = ordinal(question);
		return stage < 0 ? null : nested(state, "clueHistory", stage);
	}

	private static Object huntingDisplayClues(Map<String, Object> state, String question) {
		Object clues = huntingClues(state, question);
		return clues instanceof Collection<?> collection ? collection.stream().map(String::valueOf).map(value -> value.replace("_", "")).toList() : clues;
	}

	private static List<Object> valuesAt(Object raw, String key) {
		if (!(raw instanceof Collection<?> values)) return List.of();
		return values.stream().map(value -> value instanceof Map<?, ?> map ? (Object) map.get(key) : null).filter(java.util.Objects::nonNull).toList();
	}

	private static Object blackCounts(Object raw) {
		if (!(raw instanceof Collection<?> counts)) return null;
		return counts.stream().map(value -> value instanceof Number number ? 16 - number.intValue() : value).toList();
	}

	private static Object labeledValues(Object raw, List<String> labels) {
		if (!(raw instanceof List<?> values) || values.size() != labels.size()) return null;
		List<String> labeled = new ArrayList<>();
		for (int i = 0; i < values.size(); i++) labeled.add(labels.get(i) + ": " + displayAnswer(values.get(i)));
		return labeled;
	}

	private static Object gamepadDisplay(Map<String, Object> state) {
		Object x = nested(state, "input", "x");
		Object y = nested(state, "input", "y");
		return x instanceof Number xNumber && y instanceof Number yNumber
			? String.format(Locale.ROOT, "%02d%02d", xNumber.intValue(), yNumber.intValue()) : null;
	}

	private static Object thirdBaseDisplay(Object raw, String question) {
		if (!(raw instanceof List<?> displays)) return null;
		List<String> corrected = displays.stream().map(value -> ThirdBaseSolver.rotateLabel(String.valueOf(value).toUpperCase(Locale.ROOT))).toList();
		int stage = "firstDisplay".equals(question) ? 0 : "secondDisplay".equals(question) ? 1 : -1;
		return stage < 0 ? corrected : stage < corrected.size() ? corrected.get(stage) : null;
	}

	private static Object ledEncryptionLetters(Map<String, Object> state) {
		Object raw = state.get("stageLetters");
		Object total = state.get("totalStages");
		if (!(raw instanceof List<?> stages) || !(total instanceof Number number)) return raw;
		return stages.subList(0, Math.min(stages.size(), Math.max(0, number.intValue() - 1)));
	}

	private static Object twoBitsResponses(Object raw) {
		List<Object> numbers = valuesAt(raw, "number");
		return numbers.stream().skip(1)
			.map(value -> value instanceof Number number ? String.format(Locale.ROOT, "%02d", number.intValue()) : value)
			.toList();
	}

	private static Object shapeShiftAnswer(Map<String, Object> state) {
		Object left = nested(state, "input", "left");
		Object right = nested(state, "input", "right");
		return left == null || right == null ? null : left + " " + right;
	}

	private static Object switchCode(Object raw) {
		if (!(raw instanceof List<?> switches) || switches.size() != 5) return null;
		return switches.stream().map(up -> Boolean.TRUE.equals(up) ? "Q" : "R").reduce("", String::concat);
	}

	private static Object firstHistoryType(Object raw) {
		if (!(raw instanceof List<?> history) || history.isEmpty() || !(history.getFirst() instanceof Map<?, ?> first)) return null;
		Object type = first.get("sourceModuleType");
		return type == null ? null : String.valueOf(type).replace('_', ' ');
	}

	private static String displayAnswer(Object value) {
		if (value instanceof Boolean bool) return bool ? "Yes" : "No";
		if (value instanceof Map<?, ?> map) return map.entrySet().stream()
			.filter(entry -> entry.getValue() != null)
			.map(entry -> entry.getKey() + ": " + displayAnswer(entry.getValue()))
			.collect(java.util.stream.Collectors.joining(" · "));
		if (value instanceof Collection<?> collection) {
			boolean nested = collection.stream().anyMatch(item -> item instanceof Map<?, ?> || item instanceof Collection<?>);
			int[] index = {0};
			return collection.stream().map(item -> (nested ? ++index[0] + ": " : "") + displayAnswer(item))
				.collect(java.util.stream.Collectors.joining(nested ? " · " : ", "));
		}
		return String.valueOf(value).replace('_', ' ');
	}

	private static Object murderRecordedAnswer(ModuleEntity source, String question) {
		Object suspects = nested(source.getState(), "input", "suspects");
		Object weapons = nested(source.getState(), "input", "weapons");
		Object murderer = source.getSolution().get("suspect");
		Object murderWeapon = source.getSolution().get("weapon");
		return switch (question) {
			case "potentialSuspectNotMurderer" -> excluding(suspects, murderer);
			case "notPotentialSuspect" -> absent(suspects, MurderInput.Suspect.values());
			case "potentialWeaponNotMurderWeapon" -> excluding(weapons, murderWeapon);
			case "notPotentialWeapon" -> absent(weapons, MurderInput.Weapon.values());
			case "bodyLocation" -> nested(source.getState(), "input", "bodyLocation");
			case "suspects" -> summary("murderer", murderer, "other potential suspects", excluding(suspects, murderer));
			case "weapons" -> summary("murder weapon", murderWeapon, "other potential weapons", excluding(weapons, murderWeapon));
			default -> null;
		};
	}

	private static Object excluding(Object raw, Object excluded) {
		if (!(raw instanceof Collection<?> values) || excluded == null) return null;
		return values.stream().filter(value -> !normalize(value).equals(normalize(excluded))).toList();
	}

	private static Object absent(Object raw, Object[] options) {
		if (!(raw instanceof Collection<?> values)) return null;
		Set<String> present = values.stream().map(SouvenirSolver::normalize).collect(java.util.stream.Collectors.toSet());
		return Arrays.stream(options).filter(value -> !present.contains(normalize(value))).toList();
	}

	private static Object summary(String actualLabel, Object actual, String othersLabel, Object others) {
		return actual == null || others == null ? null : Map.of(actualLabel, actual, othersLabel, others);
	}

	private static int yahtzeeAnswerIndex(Map<String, Object> state, List<String> answers) {
		Object category = state.get("initialRollCategory");
		return Set.of("large straight", "small straight", "four of a kind", "full house", "three of a kind", "two pairs", "pair")
			.contains(normalize(category)) ? answerIndex(answers, category) : -1;
	}

	private static int iceCreamAnswerIndex(Map<String, Object> state, String question, List<String> answers) {
		int stage = ordinal(question);
		if (stage < 0) return -1;
		if (question.startsWith("who ")) return answerIndex(answers, nested(state, "stages", stage, "customer"));
		Object offered = nested(state, "stages", stage, "offeredFlavors");
		if (question.contains("not on offer")) return membershipAnswerIndex(answers, offered, null, true);
		return membershipAnswerIndex(answers, offered, nested(state, "stages", stage, "soldFlavor"), false);
	}

	private static int ledEncryptionAnswerIndex(Map<String, Object> state, String question, List<String> answers) {
		int stage = ordinal(question);
		Object total = state.get("totalStages");
		if (!(total instanceof Number number) || stage < 0 || stage >= number.intValue() - 1) return -1;
		return membershipAnswerIndex(answers, nested(state, "stageLetters", stage), null, false);
	}

	private static int fizzBuzzAnswerIndex(Map<String, Object> state, String question, List<String> answers) {
		int display = question.contains("top") ? 0 : question.contains("middle") ? 1 : question.contains("bottom") ? 2 : -1;
		int digit = ordinal(question);
		if (display < 0 || digit < 0 || digit >= 6) return -1;
		Object action = nested(state, "actions", display);
		Object number = nested(state, "displayedNumbers", display);
		if (action == null || "number".equals(normalize(action)) || number == null) return -1;
		String displayed = String.valueOf(number);
		return displayed.matches("\\d{7}") ? answerIndex(answers, String.valueOf(displayed.charAt(digit))) : -1;
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

	private static int flagsAnswerIndex(Map<String, Object> state, String question, List<String> answers) {
		if (question.contains("displayed number")) return answerIndex(answers, state.get("displayedNumber"));
		if (question.contains("main country") && !question.contains("not the main")) {
			return answerIndex(answers, state.get("mainCountry"));
		}
		return question.contains("shown") && question.contains("not the main")
			? membershipAnswerIndex(answers, state.get("countries"), state.get("mainCountry"), false) : -1;
	}

	private static Object timezoneCity(Map<String, Object> state, String question) {
		if (question.contains("departure")) return nested(state, "input", "departureCity");
		if (question.contains("destination")) return nested(state, "input", "destinationCity");
		return null;
	}

	private static Object sonicTheHedgehogAnswer(Map<String, Object> state, String question) {
		if (question.contains("picture")) {
			int stage = ordinal(question);
			return stage < 0 ? null : nested(state, "pictures", stage);
		}
		int screen = question.contains("running boots") ? 0
			: question.contains("invincibility") ? 1
			: question.contains("extra life") ? 2
			: question.contains("rings") ? 3 : -1;
		return screen < 0 ? null : nested(state, "sounds", screen);
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
		collect(Json.mapper().convertValue(source.getState(), Object.class), "state", -1, false, facts);
		collect(Json.mapper().convertValue(source.getSolution(), Object.class), "solution", -1, false, facts);
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

	private static Object resolveRecordedFact(ModuleEntity source, String question) {
		List<Fact> facts = new ArrayList<>();
		collect(Json.mapper().convertValue(source.getState(), Object.class), "state", -1, false, facts);
		collect(Json.mapper().convertValue(source.getSolution(), Object.class), "solution", -1, false, facts);
		Set<String> questionWords = words(question);
		int ordinal = ordinal(normalize(question));
		int bestScore = facts.stream().filter(fact -> fact.raw() != null)
			.mapToInt(fact -> directScore(fact, questionWords, ordinal)).max().orElse(0);
		if (bestScore == 0) return null;
		List<Fact> matches = facts.stream().filter(fact -> fact.raw() != null)
			.filter(fact -> directScore(fact, questionWords, ordinal) == bestScore).toList();
		if (matches.stream().map(fact -> normalize(fact.raw())).distinct().count() == 1) return matches.getFirst().raw();
		return matches.stream().map(fact -> fact.path().replaceFirst("^.*\\.", "") + ": " + displayAnswer(fact.raw())).toList();
	}

	private static int directScore(Fact fact, Set<String> questionWords, int ordinal) {
		int score = 0;
		if (ordinal >= 0 && fact.index() == ordinal) score += 100;
		for (String word : words(fact.path())) if (matchingWord(questionWords, word)) score += 5;
		if (score > 0 && ordinal < 0 && (fact.raw() instanceof Map<?, ?> || fact.raw() instanceof Collection<?>)) score++;
		return score;
	}

	private static boolean matchingWord(Set<String> words, String candidate) {
		if (words.contains(candidate)) return true;
		String singular = candidate.length() > 3 && candidate.endsWith("s") ? candidate.substring(0, candidate.length() - 1) : candidate;
		return words.contains(singular) || words.contains(singular + "s");
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
			map.forEach((key, child) -> collect(child, path + "." + key, index, last, facts));
			facts.add(new Fact(path, normalize(map), map, index, last));
			return;
		}
		if (value instanceof Collection<?> collection) {
			List<?> values = collection instanceof List<?> list ? list : new ArrayList<>(collection);
			for (int i = 0; i < values.size(); i++) collect(values.get(i), path + "[" + i + "]", i, i == values.size() - 1, facts);
			facts.add(new Fact(path, normalize(values), values, -1, false));
			return;
		}
		if (value.getClass().isArray()) {
			int length = Array.getLength(value);
			for (int i = 0; i < length; i++) collect(Array.get(value, i), path + "[" + i + "]", i, i == length - 1, facts);
			return;
		}
		facts.add(new Fact(path, normalize(value), value, index, last));
		if (value instanceof Boolean bool) facts.add(new Fact(path, bool ? "yes" : "no", null, index, last));
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
		for (int i = 0; i < PROBING_WIRES.size(); i++) if (question.contains(normalize(PROBING_WIRES.get(i)))) return i;
		return PROBING_WIRES.size();
	}

	private static Object probingRecordedAnswer(Map<String, Object> state, String question) {
		Object raw = state.get("missingFrequenciesByWire");
		if (!(raw instanceof List<?> frequencies) || frequencies.size() != PROBING_WIRES.size()) return null;
		if ("frequencies".equals(question)) {
			List<String> labeled = new ArrayList<>();
			for (int i = 0; i < frequencies.size(); i++) labeled.add(PROBING_WIRES.get(i) + ": " + frequencies.get(i) + "Hz");
			return labeled;
		}
		int index = probingWireIndex(normalize(question));
		return index < frequencies.size() ? frequencies.get(index) + "Hz" : null;
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
		String expected = normalize(answer instanceof Boolean bool ? bool ? "yes" : "no" : answer);
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

	private record Fact(String path, String value, Object raw, int index, boolean last) {}
}
