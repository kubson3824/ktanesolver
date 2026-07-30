package ktanesolver.module.modded.regular.thecube;

import java.util.ArrayList;
import java.util.List;
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
import ktanesolver.module.modded.regular.thecube.TheCubeInput.Button;
import ktanesolver.module.modded.regular.thecube.TheCubeInput.Color;
import ktanesolver.module.modded.regular.thecube.TheCubeInput.Rotation;
import ktanesolver.module.modded.regular.thecube.TheCubeOutput.StageSolution;

@Service
@ModuleInfo(
	type = ModuleType.THE_CUBE,
	id = "cube",
	name = "The Cube",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Calculate the three ciphers and the square buttons to press across all eight stages.",
	tags = {"buttons", "cipher", "colors", "multi-stage"}
)
public class TheCubeSolver extends AbstractModuleSolver<TheCubeInput, TheCubeOutput> {
	private static final String[] DIGIT_LABELS = {
		"AFIL", "BEKO", "DNQ", "CGP", "HJM", "EJQ", "FLP", "AKM", "CGHO", "BDIN"
	};

	@Override
	protected SolveResult<TheCubeOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, TheCubeInput input
	) {
		if (input == null || input.rotations() == null || input.faces() == null || input.wires() == null
			|| input.buttons() == null || input.executeButton() == null) {
			return failure("Enter all cube, wire, button, and cipher observations");
		}
		if (input.rotations().size() != 6 || input.rotations().stream().anyMatch(rotation -> rotation == null)) {
			return failure("Enter exactly six cube rotations");
		}
		if (input.faces().size() != 6 || input.faces().stream().anyMatch(face -> face == null || face < 0 || face > 9)) {
			return failure("Enter six cube face digits from 0 to 9");
		}
		if (input.wires().size() != 4 || input.wires().stream().anyMatch(wire -> wire == null)) {
			return failure("Enter exactly four wire colors");
		}
		if (input.buttons().size() != 8 || input.buttons().stream().anyMatch(button -> !validButton(button))
			|| !validButton(input.executeButton())) {
			return failure("Enter a color and one-letter label for all eight square buttons and the execute button");
		}

		String cipherTwo = normalizeCipher(input.cipherTwo());
		String cipherThree = normalizeCipher(input.cipherThree());
		if (cipherTwo == null || cipherThree == null) return failure("Enter both translated ciphers as eight letters from A–Q or X");

		List<Button> buttons = input.buttons().stream()
			.map(button -> new Button(button.color(), button.label().trim().toUpperCase(Locale.ROOT)))
			.toList();
		Button execute = new Button(
			input.executeButton().color(),
			input.executeButton().label().trim().toUpperCase(Locale.ROOT)
		);
		List<Integer> rotationCodes = input.rotations().stream()
			.map(rotation -> rotationCode(rotation, bomb, input.wires(), buttons))
			.toList();
		List<Integer> wireCodes = new ArrayList<>(4);
		for (int position = 0; position < input.wires().size(); position++) {
			wireCodes.add(wireCode(input.wires().get(position), position, input.faces(), buttons, bomb));
		}

		int[] cipherOneDigits = {
			(rotationCodes.get(0) + input.faces().get(5) + wireCodes.get(2)) % 10,
			(rotationCodes.get(1) + input.faces().get(4) + wireCodes.get(3)) % 10,
			(rotationCodes.get(2) + input.faces().get(3) + wireCodes.get(0)) % 10,
			(rotationCodes.get(3) + input.faces().get(2) + wireCodes.get(1)) % 10,
			(rotationCodes.get(4) + input.faces().get(1)) % 8,
			(rotationCodes.get(5) + input.faces().get(0)) % 9
		};
		int[] finalDigits = new int[8];
		for (int index = 0; index < finalDigits.length; index++) {
			int first = index < cipherOneDigits.length ? cipherOneDigits[index] : 0;
			finalDigits[index] = (first + cipherDigit(cipherTwo.charAt(index)) + cipherDigit(cipherThree.charAt(index))) % 10;
		}

		List<StageSolution> stages = new ArrayList<>(8);
		for (int index = 0; index < finalDigits.length; index++) {
			stages.add(stageSolution(index + 1, finalDigits[index], buttons, execute, input.wires()));
		}
		String cipherOne = digits(cipherOneDigits);
		String finalCipher = digits(finalDigits);
		List<String> rotations = input.rotations().stream().map(Rotation::displayName).toList();
		storeState(module, Map.of(
			"rotations", rotations,
			"input", input,
			"cipherOne", cipherOne,
			"finalCipher", finalCipher
		));
		return success(new TheCubeOutput(cipherOne, finalCipher, stages));
	}

	private static boolean validButton(Button button) {
		return button != null && button.color() != null && button.label() != null
			&& button.label().trim().toUpperCase(Locale.ROOT).matches("[A-QX]");
	}

	private static String normalizeCipher(String cipher) {
		if (cipher == null) return null;
		String normalized = cipher.replaceAll("\\s+", "").toUpperCase(Locale.ROOT);
		return normalized.matches("[A-QX]{8}") ? normalized : null;
	}

	private static int rotationCode(Rotation rotation, BombEntity bomb, List<Color> wires, List<Button> buttons) {
		return switch (rotation) {
			case ROTATE_CLOCKWISE -> 4;
			case ROTATE_COUNTERCLOCKWISE -> 7;
			case TIP_FORWARDS -> bomb.getSerialNumber().chars().filter(Character::isDigit)
				.map(character -> character - '0').findFirst().orElse(0);
			case TIP_BACKWARDS -> bomb.getLastDigit();
			case TIP_LEFT -> count(buttons, wires.get(2));
			case TIP_RIGHT -> count(buttons, wires.get(0));
		};
	}

	private static int wireCode(Color color, int position, List<Integer> faces, List<Button> buttons, BombEntity bomb) {
		return switch (color) {
			case BLUE -> position + 6;
			case GREEN -> (count(buttons, Color.BLUE) + 7) % 10;
			case ORANGE -> (count(buttons, Color.GREEN) + 3) % 10;
			case PURPLE -> faces.stream().mapToInt(Integer::intValue).sum() % 10;
			case RED -> (bomb.getModules().size() + 7) % 10;
			case WHITE -> 6;
		};
	}

	private static int count(List<Button> buttons, Color color) {
		return (int) buttons.stream().filter(button -> button.color() == color).count();
	}

	private static int cipherDigit(char letter) {
		return (letter - 'A' + 1) % 10;
	}

	private static StageSolution stageSolution(
		int stage, int digit, List<Button> buttons, Button execute, List<Color> wires
	) {
		boolean[] selected = new boolean[buttons.size()];
		for (int index = 0; index < buttons.size(); index++) {
			selected[index] = DIGIT_LABELS[digit].indexOf(buttons.get(index).label()) >= 0;
		}
		switch (stage) {
			case 2 -> selectMatchingLabels(selected, buttons, execute.label());
			case 4 -> selectMatchingColors(selected, buttons, execute.color());
			case 6 -> selectMatchingColors(selected, buttons, wires.get(0));
			case 7 -> selectMatchingColors(selected, buttons, wires.get(2));
			case 8 -> {
				for (int index = 0; index < selected.length; index++) selected[index] = !selected[index];
			}
			default -> { }
		}
		List<Integer> presses = new ArrayList<>();
		for (int index = 0; index < selected.length; index++) if (selected[index]) presses.add(index + 1);
		return new StageSolution(stage, digit, List.copyOf(presses));
	}

	private static void selectMatchingLabels(boolean[] selected, List<Button> buttons, String label) {
		for (int index = 0; index < buttons.size(); index++) {
			if (buttons.get(index).label().equals(label)) selected[index] = true;
		}
	}

	private static void selectMatchingColors(boolean[] selected, List<Button> buttons, Color color) {
		for (int index = 0; index < buttons.size(); index++) {
			if (buttons.get(index).color() == color) selected[index] = true;
		}
	}

	private static String digits(int[] digits) {
		StringBuilder result = new StringBuilder(digits.length);
		for (int digit : digits) result.append(digit);
		return result.toString();
	}
}
