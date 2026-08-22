package ktanesolver.module.modded.regular.gryphons;

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
	type = ModuleType.GRYPHONS,
	id = "gryphons",
	name = "Gryphons",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Use the gryphon's name, age, and serial number to select its type and accessory.",
	tags = {"serial number", "grid", "animals", "souvenir"}
)
public class GryphonsSolver extends AbstractModuleSolver<GryphonsInput, GryphonsOutput> {
	private static final String[] BIRDS = {"Eagle", "Falcon", "Peacock", "Cardinal", "Blue Jay", "Crow"};
	private static final String[] CATS = {"Tiger", "Lion", "Cheetah", "Panther", "Snow Leopard", "Housecat"};
	private static final String[] ACCESSORIES = {"Watch", "Visor", "Shoes", "Scarf", "Headphones", "Shades"};
	private static final int[][] VALUES = {
		{9, 2, -2, 4, 2, 4}, {5, 4, 8, 5, 4, 5}, {4, 5, 2, 4, 7, 2},
		{2, 4, -5, 2, 5, 10}, {5, 4, 2, 5, 11, 5}, {5, 2, 4, 12, 2, -4}
	};

	@Override
	protected SolveResult<GryphonsOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, GryphonsInput input) {
		if (input == null || input.name() == null || input.name().isBlank() || input.age() < 23 || input.age() > 34) {
			return failure("Enter the displayed gryphon name and age from 23 through 34");
		}
		String name = input.name().trim();
		if (!name.matches("[A-Za-z]+")) return failure("The gryphon name must contain only letters");
		String serial = bomb.getSerialNumber();
		if (serial == null || !serial.matches("[A-Za-z0-9]{6}")) return failure("A valid six-character serial number is required");
		String lower = name.toLowerCase(Locale.ROOT);
		int firstPosition = name.length() % 4 == 0 || (!lower.contains("i") && !lower.contains("e")) ? 0 : 4;
		int secondPosition = name.length() < 6 || lower.contains("z") || lower.contains("u") ? 1 : 3;
		int space = input.age() - 1 + characterValue(serial.charAt(firstPosition));
		int column = Math.floorMod(space, 6);
		int row = Math.floorMod(space / 6 + characterValue(serial.charAt(secondPosition)), 6);
		int accessory = Math.floorMod(VALUES[row][column] + input.age() + characterValue(serial.charAt(2)) + characterValue(serial.charAt(5)), 6);

		storeState(module, "gryphonsName", name);
		storeState(module, "gryphonsAge", input.age());
		return success(new GryphonsOutput(BIRDS[column], CATS[row], ACCESSORIES[accessory]));
	}

	static int characterValue(char character) {
		return Character.isDigit(character) ? character - '0' : Character.toUpperCase(character) - 'A' + 1;
	}
}
