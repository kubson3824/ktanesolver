package ktanesolver.module.modded.regular.mastermindcruel;

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
import ktanesolver.module.modded.regular.mastermindcruel.MastermindCruelInput.Attempt;
import ktanesolver.module.shared.edgework.BombEdgeworkUtils;

@Service
@ModuleInfo(
	type = ModuleType.MASTERMIND_CRUEL,
	id = "Mastermind Cruel",
	name = "Mastermind Cruel",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Decode obfuscated query feedback and narrow the five-color code to its solution.",
	tags = {"colors", "code-breaking", "deduction", "queries", "edgework"}
)
public class MastermindCruelSolver extends AbstractModuleSolver<MastermindCruelInput, MastermindCruelOutput> {
	private static final List<String> COLORS = List.of("WHITE", "MAGENTA", "YELLOW", "GREEN", "RED", "BLUE");
	private static final Set<String> COLOR_SET = Set.copyOf(COLORS);
	private static final List<String> FIRST_GUESS = List.of("WHITE", "WHITE", "MAGENTA", "MAGENTA", "YELLOW");
	private static final List<List<String>> CODES = codes();

	@Override
	protected SolveResult<MastermindCruelOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, MastermindCruelInput input
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
			String leftColor = normalizeColor(attempt.leftColor());
			String rightColor = normalizeColor(attempt.rightColor());
			if (!COLOR_SET.contains(leftColor) || !COLOR_SET.contains(rightColor)) {
				return failure("Both display colors must be one of the six module colors");
			}
			if (attempt.solvedModules() < 0 || attempt.solvedModules() > regularModuleCount(bomb) || attempt.strikes() < 0) {
				return failure("Solved-module and strike counts must match non-negative bomb edgework");
			}

			Feedback feedback = decode(attempt, leftColor, rightColor, bomb);
			if (feedback.exact() < 0 || feedback.misplaced() < 0 || feedback.absent() < 0
				|| feedback.exact() + feedback.misplaced() + feedback.absent() != 5) {
				return failure("The display values do not decode to valid feedback; check both colors, numbers, and edgework");
			}
			remaining = remaining.stream().filter(code -> score(code, guess).equals(feedback)).toList();
			if (remaining.isEmpty()) return failure("Those query results contradict each other; check the displayed values");
			normalized.add(new Attempt(guess, leftColor, attempt.leftNumber(), rightColor, attempt.rightNumber(),
				attempt.solvedModules(), attempt.strikes()));
		}

		boolean submit = remaining.size() == 1;
		// ponytail: candidate-only diversity heuristic; add minimax selection if query count becomes a problem.
		List<String> nextGuess = attempts.isEmpty() ? FIRST_GUESS : remaining.stream()
			.max(Comparator.comparingLong(code -> code.stream().distinct().count())).orElseThrow();
		storeState(module, "attempts", List.copyOf(normalized));
		return success(new MastermindCruelOutput(nextGuess, remaining.size(), submit), submit);
	}

	private static Feedback decode(Attempt attempt, String leftColor, String rightColor, BombEntity bomb) {
		int[] offsets = switch (rightColor) {
			case "WHITE" -> new int[] {bomb.getBatteryCount(), attempt.solvedModules()};
			case "MAGENTA" -> new int[] {(int) BombEdgeworkUtils.getLitIndicatorCount(bomb), bomb.getLastDigit()};
			case "YELLOW" -> new int[] {BombEdgeworkUtils.getSerialDigitSum(bomb), BombEdgeworkUtils.getTotalPortCount(bomb)};
			case "GREEN" -> new int[] {regularModuleCount(bomb), (int) BombEdgeworkUtils.getUnlitIndicatorCount(bomb)};
			case "RED" -> new int[] {BombEdgeworkUtils.getDistinctPortTypeCount(bomb), attempt.strikes()};
			case "BLUE" -> new int[] {BombEdgeworkUtils.getFirstSerialDigit(bomb), bomb.getBatteryHolders()};
			default -> throw new IllegalStateException("Unexpected display color");
		};
		int left = attempt.leftNumber() - offsets[0];
		int right = attempt.rightNumber() - offsets[1];
		return switch (leftColor) {
			case "WHITE" -> new Feedback(left, right, 5 - left - right);
			case "MAGENTA" -> new Feedback(right, 5 - left - right, left);
			case "YELLOW" -> new Feedback(5 - left - right, left, right);
			case "GREEN" -> new Feedback(right, left, 5 - left - right);
			case "RED" -> new Feedback(5 - left - right, right, left);
			case "BLUE" -> new Feedback(left, 5 - left - right, right);
			default -> throw new IllegalStateException("Unexpected display color");
		};
	}

	private static int regularModuleCount(BombEntity bomb) {
		return (int) bomb.getModules().stream()
			.filter(candidate -> candidate.getType() == null || !candidate.getType().isNeedy())
			.count();
	}

	private static String normalizeColor(String color) {
		return color == null ? "" : color.trim().toUpperCase(Locale.ROOT);
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
		return new Feedback(exact, misplaced, 5 - exact - misplaced);
	}

	private static List<List<String>> codes() {
		List<List<String>> codes = new ArrayList<>(7776);
		for (String a : COLORS) for (String b : COLORS) for (String c : COLORS)
			for (String d : COLORS) for (String e : COLORS) codes.add(List.of(a, b, c, d, e));
		return List.copyOf(codes);
	}

	private record Feedback(int exact, int misplaced, int absent) {
	}
}
