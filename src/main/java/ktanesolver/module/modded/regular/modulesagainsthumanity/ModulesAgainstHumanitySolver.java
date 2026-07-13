package ktanesolver.module.modded.regular.modulesagainsthumanity;

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
	type = ModuleType.MODULES_AGAINST_HUMANITY,
	id = "modules_against_humanity",
	name = "Modules Against Humanity",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Find the secondary and final black and white cards using their text and bomb edgework",
	tags = {"cards", "modules", "edgework", "two-step", "modded"}
)
public class ModulesAgainstHumanitySolver extends AbstractModuleSolver<ModulesAgainstHumanityInput, ModulesAgainstHumanityOutput> {
	@Override
	protected SolveResult<ModulesAgainstHumanityOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, ModulesAgainstHumanityInput input
	) {
		if (input == null || input.initialBlackText() == null || input.initialBlackText().isBlank()
			|| input.initialWhiteText() == null || input.initialWhiteText().isBlank()) {
			return failure("Enter the text on both initial cards");
		}
		if ((input.secondaryBlackPresent() == null) != (input.secondaryWhitePresent() == null)) {
			return failure("Select whether both secondary cards refer to modules on the bomb");
		}

		int ports = bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum();
		long litIndicators = bomb.getIndicators().values().stream().filter(Boolean.TRUE::equals).count();
		int secondaryBlack = spellsPoop(input.initialBlackText())
			? 2 : position((int) (bomb.getIndicators().size() - litIndicators) + ports);
		int secondaryWhite = spellsPoop(input.initialWhiteText())
			? 2 : position((int) litIndicators + bomb.getBatteryCount());

		storeState(module, "input", input);
		if (input.secondaryBlackPresent() == null) {
			return success(new ModulesAgainstHumanityOutput(
				"SECONDARY", secondaryBlack, secondaryWhite, null, null), false);
		}

		int finalBlack = secondaryBlack;
		int finalWhite = secondaryWhite;
		if (input.secondaryBlackPresent() && input.secondaryWhitePresent()) {
			finalBlack = position(finalBlack + 4);
			finalWhite = position(finalWhite + 3);
		} else if (input.secondaryBlackPresent()) {
			finalWhite = position(finalWhite + 2);
		} else if (input.secondaryWhitePresent()) {
			finalBlack = position(finalBlack + 1);
		} else if (bomb.getSerialNumber() != null
			&& bomb.getSerialNumber().toUpperCase(Locale.ROOT).chars().anyMatch(c -> c == 'M' || c == 'A' || c == 'H')) {
			finalBlack = position(finalBlack - 2);
			finalWhite = position(finalWhite - 2);
		} else if (input.blackOnLeft()) {
			finalBlack = position((int) bomb.getPortPlates().stream()
				.flatMap(plate -> plate.getPorts().stream()).distinct().count());
			finalWhite = position(bomb.getIndicators().size());
		} else {
			finalBlack = position((int) bomb.getModules().stream().map(ModuleEntity::getType).distinct().count());
		}

		return success(new ModulesAgainstHumanityOutput(
			"FINAL", secondaryBlack, secondaryWhite, finalBlack, finalWhite));
	}

	private static boolean spellsPoop(String text) {
		String normalized = text.toUpperCase(Locale.ROOT);
		return normalized.chars().filter(c -> c == 'P').count() >= 2
			&& normalized.chars().filter(c -> c == 'O').count() >= 2;
	}

	private static int position(int value) {
		return Math.floorMod(value - 1, 10) + 1;
	}
}
