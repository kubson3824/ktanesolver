package ktanesolver.module.modded.regular.bitmaps;

import java.util.Arrays;

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
	type = ModuleType.BITMAPS,
	id = "bitmaps",
	name = "Bitmaps",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Press the correct button for an 8×8 bitmap",
	tags = {"grid", "pixels", "quadrants", "edgework", "modded"}
)
public class BitmapsSolver extends AbstractModuleSolver<BitmapsInput, BitmapsOutput> {
	@Override
	protected SolveResult<BitmapsOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, BitmapsInput input
	) {
		if (input.whiteCounts() == null || input.whiteCounts().size() != 4) return failure("Enter white-pixel counts for all 4 quadrants");
		if (input.whiteCounts().stream().anyMatch(count -> count == null || count < 0 || count > 16)) {
			return failure("Each quadrant must contain between 0 and 16 white pixels");
		}
		if (input.uniformLineCoordinate() < 0 || input.uniformLineCoordinate() > 8) return failure("Uniform line coordinate must be between 1 and 8");
		if (input.squareCenterX() != 0 && (input.squareCenterX() < 2 || input.squareCenterX() > 7)) {
			return failure("3×3 square center must be between columns 2 and 7");
		}

		int[] whites = input.whiteCounts().stream().mapToInt(Integer::intValue).toArray();
		int totalWhite = Arrays.stream(whites).sum();
		int mostlyWhite = (int)Arrays.stream(whites).filter(count -> count > 8).count();
		int mostlyBlack = (int)Arrays.stream(whites).filter(count -> count < 8).count();
		int litIndicators = (int)bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count();
		int unlitIndicators = (int)bomb.getIndicators().values().stream().filter(Boolean.FALSE::equals).count();

		for (int offset = 0; offset < 10; offset++) {
			int rule = (bomb.getLastDigit() + offset) % 10;
			Integer answer = switch (rule) {
				case 0 -> {
					int quadrant = onlySparseQuadrant(whites, true);
					yield quadrant < 0 ? null : totalWhite - whites[quadrant];
				}
				case 1 -> mostlyWhite == litIndicators ? bomb.getBatteryCount() : null;
				case 2 -> input.uniformLineCoordinate() == 0 ? null : input.uniformLineCoordinate();
				case 3 -> mostlyWhite < mostlyBlack ? mostlyBlack : null;
				case 4 -> totalWhite >= 36 ? totalWhite : null;
				case 5 -> mostlyWhite > mostlyBlack ? 16 - Arrays.stream(whites).max().orElse(0) : null;
				case 6 -> {
					int quadrant = onlySparseQuadrant(whites, false);
					yield quadrant < 0 ? null : 64 - totalWhite - (16 - whites[quadrant]);
				}
				case 7 -> mostlyBlack == unlitIndicators
					? bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum() : null;
				case 8 -> input.squareCenterX() == 0 ? null : input.squareCenterX();
				case 9 -> mostlyWhite == mostlyBlack
					? bomb.getSerialNumber().chars().filter(Character::isDigit).map(c -> c - '0').findFirst().orElse(0) : null;
				default -> null;
			};
			if (answer != null) {
				storeState(module, "whiteCounts", input.whiteCounts());
				storeState(module, "uniformLineCoordinate", input.uniformLineCoordinate());
				storeState(module, "squareCenterX", input.squareCenterX());
				return success(new BitmapsOutput(Math.floorMod(answer - 1, 4) + 1, rule, answer));
			}
		}
		return failure("No bitmap rule matched");
	}

	private static int onlySparseQuadrant(int[] whites, boolean countWhite) {
		int found = -1;
		for (int i = 0; i < whites.length; i++) {
			if ((countWhite ? whites[i] : 16 - whites[i]) > 5) continue;
			if (found >= 0) return -1;
			found = i;
		}
		return found;
	}
}
