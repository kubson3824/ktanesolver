package ktanesolver.module.modded.regular.perspectivepegs;

import java.util.ArrayList;
import java.util.Collections;
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
import ktanesolver.module.modded.regular.perspectivepegs.PerspectivePegsInput.Peg;

@Service
@ModuleInfo(
	type = ModuleType.PERSPECTIVE_PEGS,
	id = "perspective-pegs",
	name = "Perspective Pegs",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Permute the clockwise peg colors to determine the key sequence for manual matching.",
	tags = { "pegs", "colors", "sequence", "perspective", "modded" },
	hasInput = true,
	hasOutput = true
)
public class PerspectivePegsSolver extends AbstractModuleSolver<PerspectivePegsInput, PerspectivePegsOutput> {

	private static final List<Rule> RULES_1_TO_2_BATTERIES = List.of(
		rule("RYY", "BPY"),
		rule("YPG", "PBR"),
		rule("RGP", "BGR"),
		rule("YBG", "BYY"),
		rule("PPR", "RYP"),
		rule("BGB", "PYG"),
		rule("YGB", "GPY"),
		rule("PGG", "GYR")
	);

	private static final List<Rule> RULES_3_TO_4_BATTERIES = List.of(
		rule("BPB", "YBG"),
		rule("YYP", "BRP"),
		rule("GRB", "YPB"),
		rule("RPY", "GBG"),
		rule("YGG", "PBR"),
		rule("GPB", "YGY"),
		rule("PRP", "BBG"),
		rule("RYR", "RPB")
	);

	private static final List<Rule> RULES_0_OR_5_PLUS_BATTERIES = List.of(
		rule("PYB", "RGB"),
		rule("YRP", "RYR"),
		rule("GYR", "GBP"),
		rule("BYG", "PGR"),
		rule("RPY", "GYB"),
		rule("PPG", "PBR"),
		rule("RYY", "BBR"),
		rule("YGP", "PYY")
	);

	@Override
	protected SolveResult<PerspectivePegsOutput> doSolve(
		RoundEntity round,
		BombEntity bomb,
		ModuleEntity module,
		PerspectivePegsInput input
	) {
		try {
			return solve(module, bomb, input);
		} catch (IllegalArgumentException e) {
			return failure(e.getMessage());
		}
	}

	private SolveResult<PerspectivePegsOutput> solve(ModuleEntity module, BombEntity bomb, PerspectivePegsInput input) {
		if (input == null) {
			return failure("Input is required.");
		}

		Color keyColor = getKeyColor(bomb);
		List<Peg> pegs = input.pegs();
		if (pegs == null || pegs.size() != 5) {
			return failure("Exactly 5 pegs are required in clockwise order.");
		}

		List<Color> pegColors = new ArrayList<>();
		int startIndex = -1;
		for (int i = 0; i < pegs.size(); i++) {
			Peg peg = pegs.get(i);
			if (peg == null) {
				return failure("Peg " + (i + 1) + " is missing.");
			}
			List<Color> sideColors = parsePegSideColors(peg, i);
			Color outerColor = sideColors.get(PegPosition.values()[i].sideIndex);
			long keyColorSideCount = sideColors.stream().filter(color -> color == keyColor).count();
			if (keyColorSideCount >= 3) {
				if (startIndex >= 0) {
					return failure("More than one peg has at least three sides in the key color.");
				}
				startIndex = i;
			}
			pegColors.add(outerColor);
		}
		if (startIndex < 0) {
			return failure("No peg has at least three sides in the key color.");
		}

		List<Color> initialSequence = readClockwiseFrom(pegColors, startIndex);
		List<Color> currentSequence = applyRules(initialSequence, getRules(bomb));
		List<Color> keySequence = currentSequence.subList(0, 3);

		PerspectivePegsOutput output = new PerspectivePegsOutput(
			keyColor.displayName,
			toDisplayNames(currentSequence),
			toDisplayNames(keySequence)
		);
		storeState(module, "input", input);
		storeState(module, "keyColor", output.keyColor());
		storeState(module, "currentSequence", output.currentSequence());
		storeState(module, "keySequence", output.keySequence());
		return success(output);
	}

	private static Color getKeyColor(BombEntity bomb) {
		List<Integer> letters = new ArrayList<>();
		for (char c : bomb.getSerialNumber().toUpperCase(Locale.ROOT).toCharArray()) {
			if (c >= 'A' && c <= 'Z') {
				letters.add(c - 'A' + 1);
			}
		}
		if (letters.size() < 2) {
			throw new IllegalArgumentException("Serial number must contain at least two letters.");
		}
		int difference = Math.abs(letters.get(0) - letters.get(1));
		if (letters.size() >= 4) {
			difference += Math.abs(letters.get(2) - letters.get(3));
		}
		return switch (difference % 10) {
			case 0, 3 -> Color.RED;
			case 4, 9 -> Color.YELLOW;
			case 1, 7 -> Color.GREEN;
			case 5, 8 -> Color.BLUE;
			case 2, 6 -> Color.PURPLE;
			default -> throw new IllegalStateException("Unexpected digit.");
		};
	}

	private static List<Rule> getRules(BombEntity bomb) {
		int batteries = bomb.getAaBatteryCount() + bomb.getDBatteryCount();
		if (batteries >= 1 && batteries <= 2) {
			return RULES_1_TO_2_BATTERIES;
		}
		if (batteries >= 3 && batteries <= 4) {
			return RULES_3_TO_4_BATTERIES;
		}
		return RULES_0_OR_5_PLUS_BATTERIES;
	}

	private static List<Color> readClockwiseFrom(List<Color> colors, int startIndex) {
		List<Color> result = new ArrayList<>();
		for (int i = 0; i < colors.size(); i++) {
			result.add(colors.get((startIndex + i) % colors.size()));
		}
		return result;
	}

	private static List<Color> parsePegSideColors(Peg peg, int pegIndex) {
		if (peg.sideColors() == null || peg.sideColors().size() != 5) {
			throw new IllegalArgumentException("Peg " + (pegIndex + 1) + " must have exactly 5 side colors.");
		}

		List<Color> colors = new ArrayList<>();
		for (int side = 0; side < peg.sideColors().size(); side++) {
			colors.add(parseColor(peg.sideColors().get(side), "peg " + (pegIndex + 1) + " " + PegSide.values()[side].displayName + " side"));
		}
		return colors;
	}

	private static List<Color> applyRules(List<Color> original, List<Rule> rules) {
		List<Color> current = new ArrayList<>(original);
		for (Rule rule : rules) {
			int first = firstIndexOf(current, rule.prime);
			if (first >= 0) {
				replace(current, first, rule.alternate);
				continue;
			}
			List<Color> reversedPrime = reversed(rule.prime);
			int last = lastIndexOf(current, reversedPrime);
			if (last >= 0) {
				replace(current, last, reversed(rule.alternate));
			}
		}
		return current;
	}

	private static int firstIndexOf(List<Color> sequence, List<Color> target) {
		for (int i = 0; i <= sequence.size() - target.size(); i++) {
			if (sequence.subList(i, i + target.size()).equals(target)) {
				return i;
			}
		}
		return -1;
	}

	private static int lastIndexOf(List<Color> sequence, List<Color> target) {
		for (int i = sequence.size() - target.size(); i >= 0; i--) {
			if (sequence.subList(i, i + target.size()).equals(target)) {
				return i;
			}
		}
		return -1;
	}

	private static void replace(List<Color> sequence, int start, List<Color> replacement) {
		for (int i = 0; i < replacement.size(); i++) {
			sequence.set(start + i, replacement.get(i));
		}
	}

	private static List<Color> reversed(List<Color> sequence) {
		List<Color> result = new ArrayList<>(sequence);
		Collections.reverse(result);
		return result;
	}

	private static List<String> toDisplayNames(List<Color> colors) {
		return colors.stream().map(color -> color.displayName).toList();
	}

	private static Color parseColor(String raw, String field) {
		if (raw == null || raw.trim().isEmpty()) {
			throw new IllegalArgumentException("Missing color for " + field + ".");
		}
		String normalized = raw.trim().toUpperCase(Locale.ROOT);
		return switch (normalized) {
			case "R", "RED" -> Color.RED;
			case "Y", "YELLOW" -> Color.YELLOW;
			case "G", "GREEN" -> Color.GREEN;
			case "B", "BLUE" -> Color.BLUE;
			case "P", "PURPLE" -> Color.PURPLE;
			default -> throw new IllegalArgumentException("Invalid color for " + field + ": " + raw);
		};
	}

	private static Rule rule(String prime, String alternate) {
		return new Rule(parseSequence(prime), parseSequence(alternate));
	}

	private static List<Color> parseSequence(String sequence) {
		return sequence.chars()
			.mapToObj(c -> parseColor(String.valueOf((char) c), "rule"))
			.toList();
	}

	private enum Color {
		RED("Red"),
		YELLOW("Yellow"),
		GREEN("Green"),
		BLUE("Blue"),
		PURPLE("Purple");

		private final String displayName;

		Color(String displayName) {
			this.displayName = displayName;
		}
	}

	private enum PegSide {
		TOP("top"),
		UPPER_RIGHT("upper-right"),
		LOWER_RIGHT("lower-right"),
		LOWER_LEFT("lower-left"),
		UPPER_LEFT("upper-left");

		private final String displayName;

		PegSide(String displayName) {
			this.displayName = displayName;
		}
	}

	private enum PegPosition {
		TOP("Top", 0.0, -1.0, PegSide.TOP.ordinal()),
		UPPER_RIGHT("Upper right", 1.0, 0.0, PegSide.UPPER_RIGHT.ordinal()),
		LOWER_RIGHT("Lower right", 0.6, 1.0, PegSide.LOWER_RIGHT.ordinal()),
		LOWER_LEFT("Lower left", -0.6, 1.0, PegSide.LOWER_LEFT.ordinal()),
		UPPER_LEFT("Upper left", -1.0, 0.0, PegSide.UPPER_LEFT.ordinal());

		private final String displayName;
		private final double x;
		private final double y;
		private final int sideIndex;

		PegPosition(String displayName, double x, double y, int sideIndex) {
			this.displayName = displayName;
			this.x = x;
			this.y = y;
			this.sideIndex = sideIndex;
		}
	}

	private record Rule(List<Color> prime, List<Color> alternate) {
	}
}
