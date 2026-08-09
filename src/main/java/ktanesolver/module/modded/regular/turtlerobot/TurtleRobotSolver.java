package ktanesolver.module.modded.regular.turtlerobot;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
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
	type = ModuleType.TURTLE_ROBOT,
	id = "turtleRobot",
	name = "Turtle Robot",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Find the three extraneous Turtle drawing instructions",
	tags = {"commands", "drawing", "turtle"}
)
public class TurtleRobotSolver extends AbstractModuleSolver<TurtleRobotInput, TurtleRobotOutput> {

	private static final Pattern COMMAND = Pattern.compile(
		"^(FD)\\s+([1-9]|[12]\\d|3[0-6])$|^(LT|RT)\\s+(30|90|120|150|180)(?:\\s+([1-9]|1\\d|2[0-4]))?$"
	);
	private static final int[] FACTORS = {1, 2, 3, 4, 6};
	private static final Map<String, List<Command>> SHAPES = Map.ofEntries(
		Map.entry("Spades", program("LT 90;FD 1;RT 180 2;LT 90 2;RT 180;LT 90 2;RT 180 2;FD 1;LT 90;LT 90 2;RT 180;FD 6;RT 180;LT 90 2")),
		Map.entry("Clubs", program("LT 90;FD 1;RT 180 2;LT 90;RT 180 2;LT 90;RT 180 2;FD 1;LT 90;LT 90 2;RT 180;FD 6;RT 180;LT 90 2")),
		Map.entry("Crown", program("FD 4;RT 150;FD 3;LT 120;FD 3;RT 120;FD 3;LT 120;FD 3;RT 150;FD 4;RT 90;FD 6;RT 90")),
		Map.entry("Dog house", program("FD 4;RT 30;FD 4;RT 120;FD 4;RT 30;FD 4;RT 90;FD 1;RT 90;FD 2;LT 180 1;FD 2;RT 90;FD 1;RT 90")),
		Map.entry("Car", program("RT 90 2;LT 90;RT 180 2;LT 90;RT 90 2;RT 90;FD 1;LT 90;RT 180 1;LT 90;FD 2;LT 90;RT 180 1;LT 90;FD 1;RT 90")),
		Map.entry("Mushroom", program("FD 2;LT 90;FD 2;RT 90;RT 180 4;RT 90;FD 2;LT 90;FD 2;RT 90;FD 4;RT 90")),
		Map.entry("Bottle", program("FD 4;RT 90 1;LT 90;FD 3;RT 90;FD 1;RT 90;FD 3;LT 90;RT 90 1;FD 4;RT 90;FD 3;RT 90")),
		Map.entry("Shape shift", program("FD 2;RT 90;LT 90 1;RT 90;FD 4;RT 30;FD 4;RT 120;FD 4;RT 30;FD 4;RT 90;LT 90 1;RT 90")),
		Map.entry("Tree", program("FD 4;LT 90;FD 1;RT 180 2;LT 90;RT 180 2;LT 90;RT 180 2;FD 1;LT 90;FD 4;RT 90;FD 2;RT 90")),
		Map.entry("T-shirt", program("FD 4;LT 90;FD 1;RT 180 1;FD 2;RT 90;LT 180 1;RT 90;FD 2;RT 180 1;FD 1;LT 90;FD 4;RT 90;FD 4;RT 90")),
		Map.entry("Tulip", program("FD 4;RT 90;RT 90 2;LT 150;FD 2;RT 120;FD 2;LT 150;RT 90 2;RT 90;FD 4;RT 180 3")),
		Map.entry("Key", program("FD 1;RT 180 2;LT 90;FD 6;RT 90;FD 2;RT 90;FD 2;RT 90;FD 1;LT 90;FD 4;LT 90;RT 180 2"))
	);

	@Override
	protected SolveResult<TurtleRobotOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, TurtleRobotInput input
	) {
		if (input == null || input.commands() == null || input.commands().size() < 15 || input.commands().size() > 22) {
			return failure("Enter all 15 to 22 displayed commands");
		}

		List<Command> commands = new ArrayList<>(input.commands().size());
		List<String> normalizedInput = new ArrayList<>(input.commands().size());
		for (int i = 0; i < input.commands().size(); i++) {
			String line = input.commands().get(i);
			Command command = line == null ? null : parse(line);
			if (command == null) {
				return failure("Line " + (i + 1) + " must be FD distance, LT degrees [radius], or RT degrees [radius]");
			}
			commands.add(command);
			normalizedInput.add(command.toString());
		}

		List<Match> matches = findMatches(commands);
		if (matches.isEmpty()) {
			return failure("No valid Turtle Robot drawing remains after removing three commands");
		}
		if (matches.size() > 1) {
			return failure("The entered commands have more than one possible set of bugs; check the transcription");
		}

		Match match = matches.getFirst();
		storeState(module, "input", new TurtleRobotInput(normalizedInput));
		return success(new TurtleRobotOutput(match.shape(), match.bugLines()));
	}

	private static List<Match> findMatches(List<Command> commands) {
		List<Match> matches = new ArrayList<>();
		for (int first = 0; first < commands.size() - 2; first++) {
			for (int second = first + 1; second < commands.size() - 1; second++) {
				for (int third = second + 1; third < commands.size(); third++) {
					List<Command> remaining = new ArrayList<>(commands);
					remaining.remove(third);
					remaining.remove(second);
					remaining.remove(first);
					String shape = matchingShape(remaining);
					if (shape != null) {
						matches.add(new Match(shape, List.of(first + 1, second + 1, third + 1)));
						if (matches.size() > 1) return matches;
					}
				}
			}
		}
		return matches;
	}

	private static String matchingShape(List<Command> commands) {
		for (int start = 0; start < commands.size(); start++) {
			List<Command> rotated = new ArrayList<>(commands.size());
			rotated.addAll(commands.subList(start, commands.size()));
			rotated.addAll(commands.subList(0, start));
			List<Command> normalized = mergeSplitCommands(rotated);
			for (Map.Entry<String, List<Command>> shape : SHAPES.entrySet()) {
				for (int factor : FACTORS) {
					for (boolean mirrored : List.of(false, true)) {
						for (boolean reversed : List.of(false, true)) {
							if (cyclicallyEqual(normalized, transform(shape.getValue(), factor, mirrored, reversed))) {
								return shape.getKey();
							}
						}
					}
				}
			}
		}
		return null;
	}

	private static List<Command> mergeSplitCommands(List<Command> commands) {
		List<Command> merged = new ArrayList<>();
		for (Command command : commands) {
			if (!merged.isEmpty() && canMerge(merged.getLast(), command)) {
				Command replacement = merge(merged.removeLast(), command);
				if (replacement != null) merged.add(replacement);
			} else {
				merged.add(command);
			}
		}
		return merged;
	}

	private static boolean canMerge(Command first, Command second) {
		return first.isLine() && second.isLine()
			|| first.isRotation() && second.isRotation()
			|| first.isArc() && second.isArc() && first.verb().equals(second.verb()) && first.distance() == second.distance();
	}

	private static Command merge(Command first, Command second) {
		if (first.isLine()) return new Command("FD", 0, first.distance() + second.distance());
		if (first.isArc()) return new Command(first.verb(), first.degrees() + second.degrees(), first.distance());
		int angle = signedDegrees(first) + signedDegrees(second);
		angle %= 360;
		if (angle == 0) return null;
		if (Math.abs(angle) > 180) angle -= Integer.signum(angle) * 360;
		return new Command(angle > 0 ? "LT" : "RT", Math.abs(angle), 0);
	}

	private static int signedDegrees(Command command) {
		return command.verb().equals("LT") ? command.degrees() : -command.degrees();
	}

	private static List<Command> transform(List<Command> commands, int factor, boolean mirrored, boolean reversed) {
		List<Command> transformed = new ArrayList<>(commands.stream()
			.map(command -> new Command(
				mirrored && !command.isLine() ? command.verb().equals("LT") ? "RT" : "LT" : command.verb(),
				command.degrees(),
				command.distance() * factor
			))
			.toList());
		if (reversed) Collections.reverse(transformed);
		return transformed;
	}

	private static boolean cyclicallyEqual(List<Command> actual, List<Command> expected) {
		if (actual.size() != expected.size()) return false;
		for (int offset = 0; offset < actual.size(); offset++) {
			boolean equal = true;
			for (int i = 0; i < actual.size(); i++) {
				if (!equivalent(actual.get(i), expected.get((i + offset) % expected.size()))) {
					equal = false;
					break;
				}
			}
			if (equal) return true;
		}
		return false;
	}

	private static boolean equivalent(Command first, Command second) {
		return first.degrees() == second.degrees()
			&& first.distance() == second.distance()
			&& (first.verb().equals(second.verb())
				|| first.isRotation() && second.isRotation() && first.degrees() == 180);
	}

	private static List<Command> program(String source) {
		return List.of(source.split(";")).stream().map(TurtleRobotSolver::parse).toList();
	}

	private static Command parse(String source) {
		Matcher match = COMMAND.matcher(source.strip().toUpperCase(Locale.ROOT).replaceAll("\\s+", " "));
		if (!match.matches()) return null;
		if (match.group(1) != null) return new Command("FD", 0, Integer.parseInt(match.group(2)));
		return new Command(match.group(3), Integer.parseInt(match.group(4)), match.group(5) == null ? 0 : Integer.parseInt(match.group(5)));
	}

	private record Command(String verb, int degrees, int distance) {
		boolean isLine() { return verb.equals("FD"); }
		boolean isRotation() { return !isLine() && distance == 0; }
		boolean isArc() { return !isLine() && distance > 0; }

		@Override
		public String toString() {
			return verb + " " + (isLine() ? distance : degrees + (distance == 0 ? "" : " " + distance));
		}
	}

	private record Match(String shape, List<Integer> bugLines) {}
}
