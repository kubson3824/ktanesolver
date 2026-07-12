package ktanesolver.module.modded.regular.englishtest;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

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
@ModuleInfo(type = ModuleType.ENGLISH_TEST, id = "english_test", name = "English Test", category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR, description = "Choose the prescriptively correct word or phrase for each sentence.", tags = {"grammar", "word", "multi-stage"})
public class EnglishTestSolver extends AbstractModuleSolver<EnglishTestInput, EnglishTestOutput> {
	private static final Map<String, String> ANSWERS = loadAnswers();

	@Override
	protected SolveResult<EnglishTestOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, EnglishTestInput input) {
		if(input == null || input.sentence() == null || input.sentence().isBlank()) return failure("Enter the sentence shown on the module");
		if(input.questionNumber() < 1 || input.questionNumber() > 3) return failure("Question number must be between 1 and 3");

		String answer = ANSWERS.get(normalize(input.sentence()));
		if(answer == null) return failure("Sentence not found; enter it exactly as displayed, including punctuation");

		storeState(module, "input", input);
		return success(new EnglishTestOutput(answer, input.questionNumber()), input.questionNumber() == 3);
	}

	private static Map<String, String> loadAnswers() {
		InputStream stream = EnglishTestSolver.class.getResourceAsStream("/english-test-sentences.txt");
		if(stream == null) throw new IllegalStateException("Missing English Test sentence data");

		Map<String, String> answersBySentence = new HashMap<>();
		try(BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
			reader.lines().filter(line -> !line.isBlank() && !line.startsWith("//")).forEach(line -> addQuestion(answersBySentence, line));
		} catch(IOException exception) {
			throw new IllegalStateException("Could not read English Test sentence data", exception);
		}
		return Map.copyOf(answersBySentence);
	}

	private static void addQuestion(Map<String, String> answersBySentence, String line) {
		int open = line.indexOf('[');
		int close = line.lastIndexOf(']');
		if(open < 0 || close <= open) throw new IllegalStateException("Invalid English Test sentence: " + line);

		String prefix = line.substring(0, open);
		String suffix = line.substring(close + 1);
		String[] choices = line.substring(open + 1, close).split("\\|");
		String correct = null;
		for(String choice : choices) if(choice.startsWith("!")) correct = choice.substring(1);
		if(correct == null) throw new IllegalStateException("English Test sentence has no answer: " + line);
		for(String choice : choices) {
			String word = choice.startsWith("!") ? choice.substring(1) : choice;
			answersBySentence.put(normalize(prefix + word + suffix), correct);
		}
	}

	private static String normalize(String sentence) {
		return sentence.strip().toLowerCase(Locale.ROOT)
			.replace('‘', '\'').replace('’', '\'').replace('“', '"').replace('”', '"')
			.replaceAll("\\s+", " ");
	}
}
