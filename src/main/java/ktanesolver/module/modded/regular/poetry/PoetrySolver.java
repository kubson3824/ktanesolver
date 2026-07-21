package ktanesolver.module.modded.regular.poetry;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.IntStream;

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
	type = ModuleType.POETRY,
	id = "poetry",
	name = "Poetry",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Find the displayed Poetry Club member's closest offered word on the manual grid.",
	tags = {"words", "grid", "distance", "multi-stage", "modded"}
)
public class PoetrySolver extends AbstractModuleSolver<PoetryInput, PoetryOutput> {
	private static final Map<String, Position> GIRLS = Map.of(
		"Melanie", new Position(0, 0),
		"Jane", new Position(0, 5),
		"Hana", new Position(5, 0),
		"Lacy", new Position(5, 5)
	);
	private static final Map<String, Position> WORDS = Map.ofEntries(
		cell("clarity", 0, 1), cell("flow", 0, 2), cell("fatigue", 0, 3), cell("hollow", 0, 4),
		cell("energy", 1, 0), cell("sunshine", 1, 1), cell("ocean", 1, 2), cell("reflection", 1, 3),
		cell("identity", 1, 4), cell("black", 1, 5), cell("crowd", 2, 0), cell("heart", 2, 1),
		cell("weather", 2, 2), cell("words", 2, 3), cell("past", 2, 4), cell("solitary", 2, 5),
		cell("relax", 3, 0), cell("dance", 3, 1), cell("weightless", 3, 2), cell("morality", 3, 3),
		cell("gaze", 3, 4), cell("failure", 3, 5), cell("bunny", 4, 0), cell("lovely", 4, 1),
		cell("romance", 4, 2), cell("future", 4, 3), cell("focus", 4, 4), cell("search", 4, 5),
		cell("cookies", 5, 1), cell("compassion", 5, 2), cell("creation", 5, 3), cell("patience", 5, 4)
	);

	@Override
	protected SolveResult<PoetryOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, PoetryInput input
	) {
		if (input == null || input.girl() == null) return failure("Select the displayed girl");
		String girl = GIRLS.keySet().stream()
			.filter(name -> name.equalsIgnoreCase(input.girl().trim())).findFirst().orElse(null);
		if (girl == null) return failure("Select a valid Poetry Club member");
		if (input.words() == null || input.words().size() != 6) return failure("Enter the six displayed words");

		List<String> words = input.words().stream().map(PoetrySolver::normalizeWord).toList();
		if (words.contains(null) || words.stream().anyMatch(word -> !WORDS.containsKey(word))) {
			return failure("Select only words from the Poetry table");
		}
		if (new HashSet<>(words).size() != 6) return failure("The six displayed words must be different");

		Object savedGirl = module.getState().get("girl");
		if (savedGirl != null && !girl.equals(savedGirl)) return failure("The displayed girl does not change between stages");

		List<Map<String, Object>> stages = stages(module);
		if (input.resetStage() && !stages.isEmpty()) stages.removeLast();
		int stage = stages.size() + 1;
		if (stage > 3) return failure("All three Poetry stages are already complete");

		Position origin = GIRLS.get(girl);
		int minimum = words.stream().mapToInt(word -> origin.distanceTo(WORDS.get(word))).min().orElseThrow();
		List<Integer> correctIndexes = IntStream.range(0, words.size())
			.filter(index -> origin.distanceTo(WORDS.get(words.get(index))) == minimum)
			.map(index -> index + 1).boxed().toList();
		List<String> correctWords = correctIndexes.stream().map(index -> words.get(index - 1)).toList();

		stages.add(Map.of("words", words, "correctWords", correctWords));
		storeState(module, "girl", girl);
		storeState(module, "stages", stages);
		return success(new PoetryOutput(stage, correctWords, correctIndexes), stage == 3);
	}

	private static String normalizeWord(String value) {
		return value == null ? null : value.trim().toLowerCase(Locale.ROOT);
	}

	private static Map.Entry<String, Position> cell(String word, int row, int column) {
		return Map.entry(word, new Position(row, column));
	}

	@SuppressWarnings("unchecked")
	private static List<Map<String, Object>> stages(ModuleEntity module) {
		Object value = module.getState().get("stages");
		return value instanceof List<?> list ? new ArrayList<>((List<Map<String, Object>>) list) : new ArrayList<>();
	}

	private record Position(int row, int column) {
		private int distanceTo(Position other) {
			return Math.abs(row - other.row) + Math.abs(column - other.column);
		}
	}
}
