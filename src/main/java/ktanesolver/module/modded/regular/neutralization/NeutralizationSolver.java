package ktanesolver.module.modded.regular.neutralization;

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
	type = ModuleType.NEUTRALIZATION,
	id = "neutralization",
	name = "Neutralization",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Neutralize the displayed acid with the correct base, drop count, and filter state",
	tags = {"chemistry", "acid", "edgework", "modded"}
)
public class NeutralizationSolver extends AbstractModuleSolver<NeutralizationInput, NeutralizationOutput> {
	private static final Acid[] ACIDS = {
		new Acid("YELLOW", "HF", "F", 9),
		new Acid("GREEN", "HCl", "Cl", 17),
		new Acid("RED", "HBr", "Br", 35),
		new Acid("BLUE", "HI", "I", 53)
	};
	private static final Base[] BASES = {
		new Base("Ammonia", "NH3", "H", 1),
		new Base("Lithium hydroxide", "LiOH", "Li", 3),
		new Base("Sodium hydroxide", "NaOH", "Na", 11),
		new Base("Potassium hydroxide", "KOH", "K", 19)
	};
	private static final boolean[][] FILTER_ON = {
		{true, true, false, false},
		{true, false, true, true},
		{false, true, false, true},
		{false, false, true, false}
	};

	@Override
	protected SolveResult<NeutralizationOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, NeutralizationInput input
	) {
		if (input == null || input.acidColor() == null) return failure("Select the acid color");
		String color = input.acidColor().trim().toUpperCase(Locale.ROOT);
		int acidIndex = -1;
		for (int i = 0; i < ACIDS.length; i++) if (ACIDS[i].color().equals(color)) acidIndex = i;
		if (acidIndex < 0) return failure("Acid color must be yellow, green, red, or blue");
		if (input.acidVolume() < 5 || input.acidVolume() > 20 || input.acidVolume() % 5 != 0) {
			return failure("Acid volume must be 5, 10, 15, or 20 mL");
		}

		Acid acid = ACIDS[acidIndex];
		int baseIndex = chooseBase(bomb, acid);
		Base base = BASES[baseIndex];
		int acidConcentrationTenths = acidConcentrationTenths(acid, base, input.acidVolume());
		int baseConcentration = baseConcentration(bomb, acid, base);
		int drops = (20 / baseConcentration) * (input.acidVolume() * acidConcentrationTenths / 10);

		storeState(module, "acidColor", color);
		storeState(module, "acidVolume", input.acidVolume());
		return success(new NeutralizationOutput(
			acid.formula(), base.name(), base.formula(), acidConcentrationTenths / 10.0,
			baseConcentration, drops, FILTER_ON[acidIndex][baseIndex]
		));
	}

	private static int chooseBase(BombEntity bomb, Acid acid) {
		if (bomb.hasIndicator("NSA") && bomb.getBatteryCount() == 3) return 0;
		if (Set.of("CAR", "FRQ", "IND").stream().anyMatch(bomb::isIndicatorLit)) return 3;
		if (bomb.getPortPlates().stream().allMatch(plate -> plate.getPorts().isEmpty()) && bomb.serialHasVowel()) return 1;
		String indicators = String.join("", bomb.getIndicators().keySet()).toUpperCase(Locale.ROOT);
		if (acid.formula().toUpperCase(Locale.ROOT).chars().anyMatch(character -> indicators.indexOf(character) >= 0)) return 3;
		if (bomb.getDBatteryCount() > bomb.getAaBatteryCount()) return 0;
		return acid.atomicNumber() < 20 ? 2 : 1;
	}

	private static int acidConcentrationTenths(Acid acid, Base base, int acidVolume) {
		int value = acid.atomicNumber() - base.atomicNumber();
		if (hasVowel(acid.symbol()) || hasVowel(base.symbol())) value -= 4;
		if (acid.symbol().length() == base.symbol().length()) value *= 3;
		value = Math.abs(value) % 10;
		return value == 0 ? acidVolume * 2 / 5 : value;
	}

	private static int baseConcentration(BombEntity bomb, Acid acid, Base base) {
		if ((acid.formula().equals("HI") && base.formula().equals("KOH"))
			|| (acid.formula().equals("HCl") && base.formula().equals("NH3"))) return 20;
		int holders = bomb.getBatteryHolders();
		long portTypes = bomb.getPortPlates().stream().flatMap(plate -> plate.getPorts().stream()).distinct().count();
		int indicators = bomb.getIndicators().size();
		if (holders > portTypes && holders > indicators) return 5;
		if (portTypes > holders && portTypes > indicators) return 10;
		if (indicators > holders && indicators > portTypes) return 20;
		return base.atomicNumber() >= 15 ? 20 : base.atomicNumber() >= 7 ? 10 : 5;
	}

	private static boolean hasVowel(String symbol) {
		return symbol.toUpperCase(Locale.ROOT).chars().anyMatch(character -> "AEIOU".indexOf(character) >= 0);
	}

	private record Acid(String color, String formula, String symbol, int atomicNumber) {}
	private record Base(String name, String formula, String symbol, int atomicNumber) {}
}
