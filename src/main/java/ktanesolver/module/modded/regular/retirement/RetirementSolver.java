package ktanesolver.module.modded.regular.retirement;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;

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
	type = ModuleType.RETIREMENT,
	id = "retirement",
	name = "Retirement",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Score five retirement homes using Bob's edgework-derived family.",
	tags = {"names", "letters", "edgework", "homes"}
)
public class RetirementSolver extends AbstractModuleSolver<RetirementInput, RetirementOutput> {
	public static final List<String> HOMES = List.of(
		"Briar Hollow", "Broadwood", "Homestead", "Hotham Place", "Leafy Green",
		"Lodge Park", "Riverside", "Riverwell", "Sunnydale", "Sunnyside"
	);
	private static final List<String> WIVES = List.of("Eliza", "Marg", "Ruth", "Sandi", "Toni");
	private static final List<String> CHILDREN = List.of("Amie", "Ben", "Dave", "Janet", "John", "Kirsty", "Kris", "Lucy", "Mark", "Sal");

	@Override
	protected SolveResult<RetirementOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, RetirementInput input
	) {
		if (input == null || input.homes() == null || input.homes().size() != 5) {
			return failure("Enter the five currently offered homes");
		}
		List<String> homes = new ArrayList<>();
		for (String raw : input.homes()) {
			String home = canonicalHome(raw);
			if (home == null) return failure("Every home must be one of the ten names shown by the module");
			homes.add(home);
		}
		if (new HashSet<>(homes).size() != 5) return failure("The five offered homes must be distinct");
		if (bomb == null || bomb.getSerialNumber() == null || bomb.getSerialNumber().length() < 2) {
			return failure("Enter at least the first two serial-number characters");
		}

		String wife = WIVES.get(Math.floorMod(bomb.getBatteryCount(), 5));
		int ports = bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum();
		String child = CHILDREN.get(Math.floorMod(ports + bomb.getIndicators().size(), 10));
		String sibling = sibling(bomb.getSerialNumber().toUpperCase(Locale.ROOT));
		List<RetirementOutput.HomeScore> scores = homes.stream()
			.map(home -> score(home, wife, child, sibling)).toList();

		int maximum = scores.stream().mapToInt(RetirementOutput.HomeScore::total).max().orElseThrow();
		List<RetirementOutput.HomeScore> totalWinners = scores.stream().filter(score -> score.total() == maximum).toList();
		boolean tie = totalWinners.size() > 1;
		RetirementOutput.HomeScore winner;
		if (!tie) {
			winner = totalWinners.getFirst();
		} else {
			// The shipped module applies the wife tie-break to all five homes, not only the total-score tie.
			int wifeMaximum = scores.stream().mapToInt(RetirementOutput.HomeScore::wifeScore).max().orElseThrow();
			winner = scores.stream().filter(score -> score.wifeScore() == wifeMaximum)
				.min(Comparator.comparing(RetirementOutput.HomeScore::home)).orElseThrow();
		}

		List<String> unchosen = homes.stream().filter(home -> !home.equals(winner.home())).toList();
		storeState(module, "retirementUnchosenHomes", unchosen);
		return success(new RetirementOutput(winner.home(), wife, child, sibling, scores, tie));
	}

	private static RetirementOutput.HomeScore score(String home, String wife, String child, String sibling) {
		int wifeScore = common(home, wife) * 3;
		int childScore = common(home, child) * 2;
		int siblingScore = common(home, sibling);
		return new RetirementOutput.HomeScore(home, wifeScore, childScore, siblingScore, wifeScore + childScore + siblingScore);
	}

	private static int common(String home, String name) {
		String candidate = home.toLowerCase(Locale.ROOT);
		String familyName = name.toLowerCase(Locale.ROOT);
		return (int) candidate.chars().filter(character -> familyName.indexOf(character) >= 0).count();
	}

	private static String sibling(String serial) {
		char first = serial.charAt(0), second = serial.charAt(1);
		if (isOdd(first) && Character.isLetter(second)) return "Frank";
		if (isEven(first) && Character.isLetter(second)) return "Jane";
		if (Character.isLetter(first) && isOdd(second)) return "Lydia";
		if (Character.isLetter(first) && isEven(second)) return "Mike";
		if (Character.isLetter(first) && Character.isLetter(second)) return isVowel(first) == isVowel(second) ? "Pat" : "Skye";
		return "Toby";
	}

	private static boolean isOdd(char value) { return Character.isDigit(value) && (value - '0') % 2 == 1; }
	private static boolean isEven(char value) { return Character.isDigit(value) && (value - '0') % 2 == 0; }
	private static boolean isVowel(char value) { return "AEIOU".indexOf(value) >= 0; }
	private static String canonicalHome(String raw) {
		if (raw == null) return null;
		return HOMES.stream().filter(home -> home.equalsIgnoreCase(raw.trim())).findFirst().orElse(null);
	}
}
