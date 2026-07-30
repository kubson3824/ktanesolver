package ktanesolver.module.modded.regular.jewelvault;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.jewelvault.JewelVaultInput.GreekLetter;
import ktanesolver.module.modded.regular.jewelvault.JewelVaultInput.Jewel;
import ktanesolver.module.modded.regular.jewelvault.JewelVaultInput.Wheel;

@Service
@ModuleInfo(
	type = ModuleType.JEWEL_VAULT,
	id = "jewelVault",
	name = "The Jewel Vault",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Find each wheel's priority jewel and rotate the linked wheels to the target orientation.",
	tags = {"jewels", "greek letters", "wheels", "orientation"}
)
public class JewelVaultSolver extends AbstractModuleSolver<JewelVaultInput, JewelVaultOutput> {
	private static final int[][][] LIST_NUMBERS = {
		{
			{1, 9, 3, 11, 6, 7}, {9, 5, 6, 1, 9, 2}, {3, 6, 2, 7, 10, 8},
			{11, 1, 7, 12, 4, 5}, {6, 9, 10, 4, 10, 12}, {7, 2, 8, 5, 12, 4}
		},
		{
			{5, 8, 3, 9, 7, 4}, {8, 2, 7, 1, 5, 10}, {3, 7, 11, 6, 12, 2},
			{9, 1, 6, 4, 3, 8}, {7, 5, 12, 3, 11, 12}, {4, 10, 2, 8, 12, 9}
		},
		{
			{12, 5, 10, 1, 5, 3}, {5, 2, 6, 5, 11, 8}, {10, 6, 8, 3, 12, 2},
			{1, 5, 3, 11, 1, 10}, {5, 11, 12, 1, 4, 9}, {3, 8, 2, 10, 9, 6}
		},
		{
			{9, 4, 1, 10, 6, 2}, {4, 3, 7, 4, 12, 8}, {1, 7, 8, 11, 9, 3},
			{10, 4, 11, 1, 10, 6}, {6, 12, 9, 10, 5, 11}, {2, 8, 3, 6, 11, 7}
		}
	};
	private static final List<List<Jewel>> PRIORITIES = List.of(
		List.of(Jewel.POUDRETTEITE, Jewel.RUBY, Jewel.SAPPHIRE, Jewel.EMERALD, Jewel.ONYX, Jewel.AMETHYST, Jewel.SCAPOLITE, Jewel.GLASS),
		List.of(Jewel.AMETHYST, Jewel.ONYX, Jewel.EMERALD, Jewel.SCAPOLITE, Jewel.SAPPHIRE, Jewel.POUDRETTEITE, Jewel.GLASS, Jewel.RUBY),
		List.of(Jewel.ONYX, Jewel.SAPPHIRE, Jewel.RUBY, Jewel.AMETHYST, Jewel.SCAPOLITE, Jewel.GLASS, Jewel.EMERALD, Jewel.POUDRETTEITE),
		List.of(Jewel.EMERALD, Jewel.SCAPOLITE, Jewel.POUDRETTEITE, Jewel.SAPPHIRE, Jewel.GLASS, Jewel.RUBY, Jewel.ONYX, Jewel.AMETHYST),
		List.of(Jewel.RUBY, Jewel.AMETHYST, Jewel.SCAPOLITE, Jewel.GLASS, Jewel.EMERALD, Jewel.SAPPHIRE, Jewel.POUDRETTEITE, Jewel.ONYX),
		List.of(Jewel.SCAPOLITE, Jewel.EMERALD, Jewel.GLASS, Jewel.RUBY, Jewel.POUDRETTEITE, Jewel.ONYX, Jewel.AMETHYST, Jewel.SAPPHIRE),
		List.of(Jewel.SAPPHIRE, Jewel.GLASS, Jewel.ONYX, Jewel.POUDRETTEITE, Jewel.AMETHYST, Jewel.EMERALD, Jewel.RUBY, Jewel.SCAPOLITE),
		List.of(Jewel.GLASS, Jewel.POUDRETTEITE, Jewel.AMETHYST, Jewel.ONYX, Jewel.RUBY, Jewel.SCAPOLITE, Jewel.SAPPHIRE, Jewel.EMERALD),
		List.of(Jewel.ONYX, Jewel.SCAPOLITE, Jewel.EMERALD, Jewel.SAPPHIRE, Jewel.POUDRETTEITE, Jewel.AMETHYST, Jewel.RUBY, Jewel.GLASS),
		List.of(Jewel.POUDRETTEITE, Jewel.AMETHYST, Jewel.RUBY, Jewel.GLASS, Jewel.ONYX, Jewel.SCAPOLITE, Jewel.EMERALD, Jewel.SAPPHIRE),
		List.of(Jewel.GLASS, Jewel.EMERALD, Jewel.AMETHYST, Jewel.ONYX, Jewel.SAPPHIRE, Jewel.RUBY, Jewel.SCAPOLITE, Jewel.POUDRETTEITE),
		List.of(Jewel.SAPPHIRE, Jewel.RUBY, Jewel.SCAPOLITE, Jewel.POUDRETTEITE, Jewel.GLASS, Jewel.EMERALD, Jewel.AMETHYST, Jewel.ONYX)
	);

	@Override
	protected SolveResult<JewelVaultOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, JewelVaultInput input
	) {
		if (input == null || input.wheels() == null || input.wheels().size() != 4) {
			return failure("Enter all four wheels");
		}
		if (input.physicalWheelsByLetter() == null || input.physicalWheelsByLetter().size() != 4
			|| input.physicalWheelsByLetter().stream().anyMatch(wheel -> wheel == null || wheel < 1 || wheel > 4)
			|| input.physicalWheelsByLetter().stream().distinct().count() != 4) {
			return failure("Assign physical wheels 1–4 exactly once to letters A–D");
		}

		int[] counts = new int[Jewel.values().length];
		List<Jewel> correctJewels = new ArrayList<>();
		int[] correctOrientations = new int[4];
		for (int index = 0; index < 4; index++) {
			Wheel wheel = input.wheels().get(index);
			if (wheel == null || wheel.jewelsClockwiseFromNorth() == null || wheel.jewelsClockwiseFromNorth().size() != 4
				|| wheel.jewelsClockwiseFromNorth().stream().anyMatch(jewel -> jewel == null)
				|| wheel.jewelsClockwiseFromNorth().stream().distinct().count() != 4) {
				return failure("Each wheel must contain four different jewels in north-east-south-west order");
			}
			if (wheel.firstLetter() == null || wheel.secondLetter() == null
				|| wheel.firstLetter().ordinal() / 6 != index || wheel.secondLetter().ordinal() / 6 != index) {
				return failure("Select both Greek letters from the group printed on each wheel");
			}
			wheel.jewelsClockwiseFromNorth().forEach(jewel -> counts[jewel.ordinal()]++);
			List<Jewel> priority = PRIORITIES.get(LIST_NUMBERS[index][wheel.firstLetter().ordinal() % 6][wheel.secondLetter().ordinal() % 6] - 1);
			Jewel correct = priority.stream().filter(wheel.jewelsClockwiseFromNorth()::contains).findFirst().orElseThrow();
			correctJewels.add(correct);
			correctOrientations[index] = wheel.jewelsClockwiseFromNorth().indexOf(correct);
		}

		int maximum = Arrays.stream(counts).max().orElseThrow();
		List<Jewel> mostAbundant = Arrays.stream(Jewel.values()).filter(jewel -> counts[jewel.ordinal()] == maximum).toList();
		int serialList = bomb.getLastDigit() == 0 ? 9 : bomb.getLastDigit() - 1;
		Jewel reference = mostAbundant.size() == 1 ? mostAbundant.getFirst()
			: PRIORITIES.get(serialList).stream().filter(mostAbundant::contains).findFirst().orElseThrow();
		int target = switch (reference) {
			case GLASS, POUDRETTEITE -> 0;
			case AMETHYST, EMERALD -> 1;
			case ONYX, SAPPHIRE -> 2;
			case RUBY, SCAPOLITE -> 3;
		};

		int[] currentByLetter = new int[4];
		for (int letter = 0; letter < 4; letter++) {
			currentByLetter[letter] = correctOrientations[input.physicalWheelsByLetter().get(letter) - 1];
		}
		int[] turns = new int[4];
		for (int letter = 3; letter >= 0; letter--) {
			turns[letter] = Math.floorMod(target - currentByLetter[letter] + (letter == 3 ? 0 : turns[letter + 1]), 4);
		}

		List<String> actions = new ArrayList<>(List.of("reset"));
		for (int letter = 0; letter < 4; letter++) {
			if (turns[letter] > 0) {
				actions.add("turn " + input.physicalWheelsByLetter().get(letter) + (turns[letter] == 1 ? "" : " " + turns[letter]));
			}
		}
		actions.add("submit");

		List<String> wheelTurns = new ArrayList<>();
		for (int physicalWheel = 1; physicalWheel <= 4; physicalWheel++) {
			int letter = input.physicalWheelsByLetter().indexOf(physicalWheel);
			wheelTurns.add(letter == 0 ? "none" : String.valueOf(input.physicalWheelsByLetter().get(letter - 1)));
		}
		storeState(module, "wheelTurns", wheelTurns);
		return success(new JewelVaultOutput(correctJewels, List.of("North", "East", "South", "West").get(target), actions));
	}
}
