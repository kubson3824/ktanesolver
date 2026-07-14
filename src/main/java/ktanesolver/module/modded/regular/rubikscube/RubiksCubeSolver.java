package ktanesolver.module.modded.regular.rubikscube;

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

@Service
@ModuleInfo(
	type = ModuleType.RUBIKS_CUBE,
	id = "RubiksCubeModule",
	name = "Rubik's Cube",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Determine the ten face rotations from the cube's center colors and the bomb serial number.",
	tags = {"cube", "colors", "sequence", "serial number"}
)
public class RubiksCubeSolver extends AbstractModuleSolver<RubiksCubeInput, RubiksCubeOutput> {
	private static final List<String> COLORS = List.of("YELLOW", "BLUE", "RED", "GREEN", "ORANGE", "WHITE");
	private static final String[][] MOVES = {
		{"L'", "F'"}, {"D'", "U'"}, {"U", "B'"}, {"F", "B"}, {"L", "D"}, {"R'", "U"},
		{"U'", "F"}, {"B'", "L'"}, {"B", "R"}, {"D", "L"}, {"R", "D'"}, {"F'", "R'"}
	};

	@Override
	protected SolveResult<RubiksCubeOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, RubiksCubeInput input
	) {
		if (input == null || input.faceColors() == null || input.faceColors().size() != 6) {
			return failure("Enter the colors of all six faces in U, L, F, D, R, B order");
		}

		List<String> colors = input.faceColors().stream()
			.map(color -> color == null ? "" : color.toUpperCase(Locale.ROOT))
			.toList();
		if (colors.stream().anyMatch(color -> !COLORS.contains(color)) || colors.stream().distinct().count() != 6) {
			return failure("Use each cube color exactly once");
		}

		String serial = bomb.getSerialNumber() == null ? "" : bomb.getSerialNumber().toUpperCase(Locale.ROOT);
		if (!serial.matches("[A-Z0-9]{6}")) return failure("Bomb serial number must contain exactly six letters or digits");

		String reducedSerial = serial.substring(0, colorValue(colors.get(3)) - 1) + serial.substring(colorValue(colors.get(3)));
		List<String[]> pairs = reducedSerial.chars().mapToObj(character -> {
			int value = Character.digit(character, 36);
			int shift = colorValue(colors.get(value % 3));
			return MOVES[(value / 3 + shift) % MOVES.length];
		}).toList();

		String right = colors.get(4);
		List<String> moves = new ArrayList<>(10);
		if (List.of("RED", "GREEN", "BLUE").contains(right)) {
			pairs.forEach(pair -> Collections.addAll(moves, pair));
		} else {
			pairs.forEach(pair -> moves.add(pair[0]));
			pairs.forEach(pair -> moves.add(pair[1]));
		}
		if (right.equals("RED") || right.equals("YELLOW")) {
			for (int i = 0; i < 5; i++) moves.set(i, opposite(moves.get(i)));
		} else if (right.equals("GREEN") || right.equals("WHITE")) {
			Collections.reverse(moves);
		}

		storeState(module, "input", new RubiksCubeInput(colors));
		return success(new RubiksCubeOutput(moves));
	}

	private static int colorValue(String color) {
		return COLORS.indexOf(color) + 1;
	}

	private static String opposite(String move) {
		return move.endsWith("'") ? move.substring(0, 1) : move + "'";
	}
}
