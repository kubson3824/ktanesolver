package ktanesolver.module.modded.regular.mastermindsimple;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.mastermindsimple.MastermindSimpleInput.Attempt;

@Service
@ModuleInfo(
	type = ModuleType.MASTERMIND_SIMPLE,
	id = "Mastermind Simple",
	name = "Mastermind Simple",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Query five-color codes and narrow the exact and misplaced-color feedback to the solution.",
	tags = {"colors", "code-breaking", "deduction", "queries"}
)
public class MastermindSimpleSolver extends AbstractModuleSolver<MastermindSimpleInput, MastermindSimpleOutput> {
	private static final List<String> COLORS = List.of("WHITE", "MAGENTA", "YELLOW", "GREEN", "RED", "BLUE");
	private static final Set<String> COLOR_SET = Set.copyOf(COLORS);
	private static final List<String> FIRST_GUESS = List.of("WHITE", "WHITE", "MAGENTA", "MAGENTA", "YELLOW");
	private static final List<List<String>> CODES = codes();

	@Override
	protected SolveResult<MastermindSimpleOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, MastermindSimpleInput input
	) {
		List<Attempt> attempts = input == null || input.attempts() == null ? List.of() : input.attempts();
		List<Attempt> normalized = new ArrayList<>(attempts.size());
		List<List<String>> remaining = CODES;
		for (Attempt attempt : attempts) {
			if (attempt == null || attempt.guess() == null || attempt.guess().size() != 5) {
				return failure("Each query must contain exactly five colors");
			}
			List<String> guess = attempt.guess().stream()
				.map(color -> color == null ? "" : color.trim().toUpperCase(Locale.ROOT)).toList();
			if (!guess.stream().allMatch(COLOR_SET::contains)) return failure("Queries may only use the six module colors");
			if (attempt.exact() < 0 || attempt.misplaced() < 0 || attempt.exact() + attempt.misplaced() > 5) {
				return failure("Exact and misplaced counts must be non-negative and total at most five");
			}
			Feedback feedback = new Feedback(attempt.exact(), attempt.misplaced());
			remaining = remaining.stream().filter(code -> score(code, guess).equals(feedback)).toList();
			if (remaining.isEmpty()) return failure("Those query results contradict each other; check the colors and counts");
			normalized.add(new Attempt(guess, attempt.exact(), attempt.misplaced()));
		}

		boolean submit = remaining.size() == 1;
		// ponytail: candidate-only diversity heuristic; add minimax selection if query count becomes a problem.
		List<String> nextGuess = attempts.isEmpty() ? FIRST_GUESS : remaining.stream()
			.max(Comparator.comparingLong(code -> code.stream().distinct().count())).orElseThrow();
		storeState(module, "attempts", List.copyOf(normalized));
		return success(new MastermindSimpleOutput(nextGuess, remaining.size(), submit), submit);
	}

	private static Feedback score(List<String> code, List<String> guess) {
		int exact = 0;
		int[] codeCounts = new int[COLORS.size()];
		int[] guessCounts = new int[COLORS.size()];
		for (int i = 0; i < 5; i++) {
			if (code.get(i).equals(guess.get(i))) exact++;
			else {
				codeCounts[COLORS.indexOf(code.get(i))]++;
				guessCounts[COLORS.indexOf(guess.get(i))]++;
			}
		}
		int misplaced = 0;
		for (int i = 0; i < COLORS.size(); i++) misplaced += Math.min(codeCounts[i], guessCounts[i]);
		return new Feedback(exact, misplaced);
	}

	private static List<List<String>> codes() {
		List<List<String>> codes = new ArrayList<>(7776);
		for (String a : COLORS) for (String b : COLORS) for (String c : COLORS)
			for (String d : COLORS) for (String e : COLORS) codes.add(List.of(a, b, c, d, e));
		return List.copyOf(codes);
	}

	private record Feedback(int exact, int misplaced) {
	}
}
