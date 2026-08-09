package ktanesolver.module.modded.regular.splittingtheloot;

import java.util.ArrayList;
import java.util.HashSet;
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

@Service
@ModuleInfo(
	type = ModuleType.SPLITTING_THE_LOOT,
	id = "SplittingTheLootModule",
	name = "Splitting The Loot",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Split all diamond bags and any needed money bags into two equal-value teams.",
	tags = {"bags", "diamonds", "partition", "money"}
)
public class SplittingTheLootSolver extends AbstractModuleSolver<SplittingTheLootInput, SplittingTheLootOutput> {
	private static final int[][] TABLE = {
		{20, 19, 13, 26, 23, 34, 12, 14, 35, 16},
		{10, 21, 13, 25, 24, 11, 11, 30, 19, 39},
		{39, 38, 25, 30, 24, 23, 28, 34, 15, 36},
		{14, 18, 33, 22, 31, 32, 22, 37, 36, 31},
		{40, 20, 26, 12, 32, 33, 28, 15, 38, 17},
		{19, 29, 18, 16, 17, 21, 35, 27, 27, 37}
	};
	private static final List<String> COLORS = List.of("NORMAL", "RED", "BLUE");

	@Override
	protected SolveResult<SplittingTheLootOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, SplittingTheLootInput input
	) {
		if (input == null || input.bags() == null || input.bags().size() != 7)
			return failure("Enter all seven bag labels in reading order");
		if (input.coloredBag() < 1 || input.coloredBag() > 7)
			return failure("Initially colored bag must be between 1 and 7");
		String lockedColor = input.coloredBagColor() == null ? "" : input.coloredBagColor().trim().toUpperCase(Locale.ROOT);
		if (!lockedColor.equals("RED") && !lockedColor.equals("BLUE"))
			return failure("Initially colored bag must be red or blue");

		List<String> labels = new ArrayList<>();
		List<Integer> values = new ArrayList<>();
		Set<String> diamondLabels = new HashSet<>();
		boolean[] diamonds = new boolean[7];
		for (int i = 0; i < 7; i++) {
			String label = input.bags().get(i) == null ? "" : input.bags().get(i).trim().toUpperCase(Locale.ROOT);
			if (label.matches("[A-J][1-6]")) {
				if (!diamondLabels.add(label)) return failure("Diamond bag labels must be distinct");
				diamonds[i] = true;
				labels.add(label);
				values.add(value(label));
			} else if (label.matches("\\d{1,2}") && Integer.parseInt(label) >= 1) {
				int amount = Integer.parseInt(label);
				labels.add(String.format("%02d", amount));
				values.add(amount);
			} else return failure("Each bag must be a diamond code A1–J6 or a money value 01–99");
		}
		if (diamondLabels.size() != 3) return failure("Exactly three bags must contain diamonds");

		int locked = input.coloredBag() - 1;
		int lockedColorIndex = COLORS.indexOf(lockedColor);
		for (int encoded = 0; encoded < 2187; encoded++) {
			int remainder = encoded;
			int red = 0, blue = 0, redCount = 0, blueCount = 0;
			List<String> colors = new ArrayList<>();
			boolean valid = true;
			for (int i = 0; i < 7; i++) {
				int color = remainder % 3;
				remainder /= 3;
				if ((i == locked && color != lockedColorIndex) || (diamonds[i] && color == 0)) valid = false;
				colors.add(COLORS.get(color));
				if (color == 1) { red += values.get(i); redCount++; }
				if (color == 2) { blue += values.get(i); blueCount++; }
			}
			if (valid && redCount > 0 && blueCount > 0 && red == blue) {
				storeState(module, "initiallyColoredBag", labels.get(locked));
				return success(new SplittingTheLootOutput(colors, values, red, input.coloredBag()));
			}
		}
		return failure("These bags have no valid equal split; check the labels and initially colored bag");
	}

	static int value(String label) {
		int column = label.charAt(0) - 'A';
		int row = label.charAt(1) - '1';
		return TABLE[row][column];
	}
}
