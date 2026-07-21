package ktanesolver.module.modded.regular.flags;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
	type = ModuleType.FLAGS,
	id = "FlagsModule",
	name = "Flags",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Identify seven countries by their flags, then sort them using the main country and bomb edgework.",
	tags = {"flags", "geography", "sorting", "Souvenir", "modded"}
)
public class FlagsSolver extends AbstractModuleSolver<FlagsInput, FlagsOutput> {
	private static final String WHITE_FLAG = "WHITEFLAG";
	private static final Comparator<FlagsCountry> COUNTRY_NAME = Comparator.comparing(FlagsCountry::displayName);

	@Override
	protected SolveResult<FlagsOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, FlagsInput input
	) {
		if (input == null || input.mainCountry() == null) return failure("Select the main country");
		List<FlagsCountry> countries = input.countries();
		if (countries == null || countries.size() != 7 || countries.stream().anyMatch(Objects::isNull)
			|| new HashSet<>(countries).size() != 7 || countries.contains(input.mainCountry())) {
			return failure("Select exactly 7 different countries excluding the main country");
		}
		if (input.displayedNumber() < 1 || input.displayedNumber() > 7) {
			return failure("Displayed number must be between 1 and 7");
		}

		boolean unicornRule = isUnicornRule(bomb, countries);
		storeState(module, Map.of(
			"input", input,
			"displayedNumber", input.displayedNumber(),
			"mainCountry", input.mainCountry().displayName(),
			"countries", countries.stream().map(FlagsCountry::displayName).toList(),
			"unicornRule", unicornRule
		));

		if (unicornRule) {
			return success(new FlagsOutput(
				FlagsCountry.FRANCE,
				countries.stream().sorted(COUNTRY_NAME).toList(),
				"White Flag (Unicorn)"
			));
		}

		FlagsCountry main = input.mainCountry();
		Comparator<FlagsCountry> order;
		String appliedRule;
		if (main.continent().equals("North America") && bomb.getIndicators().values().stream().noneMatch(Boolean.TRUE::equals)) {
			order = COUNTRY_NAME;
			appliedRule = "1st Condition (Country Name)";
		}
		else if (main.dialCode() > 100 && bomb.hasPort(PortType.RJ45)) {
			order = Comparator.comparingInt(FlagsCountry::dialCode);
			appliedRule = "2nd Condition (Dial Code)";
		}
		else if (main.displayName().toUpperCase(Locale.ROOT).indexOf(main.currency().charAt(2)) >= 0) {
			order = Comparator.comparing(FlagsCountry::isoCode);
			appliedRule = "3rd Condition (ISO Code)";
		}
		else if (main.capital().codePoints().filter(Character::isLetter).count() > 9) {
			order = Comparator.comparing(FlagsCountry::capital);
			appliedRule = "4th Condition (Capital)";
		}
		else if (main.continent().equals("Europe") && !main.currency().equals("EUR")) {
			order = Comparator.comparing(FlagsCountry::continent);
			appliedRule = "5th Condition (Continent)";
		}
		else if (countries.stream().anyMatch(country -> country.continent().equals(main.continent()))) {
			order = Comparator.comparing(FlagsCountry::currency);
			appliedRule = "6th Condition (Currency)";
		}
		else {
			order = COUNTRY_NAME;
			appliedRule = "Last Rule (Country Name)";
		}

		List<FlagsCountry> sorted = countries.stream().sorted(order.thenComparing(COUNTRY_NAME)).toList();
		return success(new FlagsOutput(sorted.get(input.displayedNumber() - 1), sorted, appliedRule));
	}

	private static boolean isUnicornRule(BombEntity bomb, List<FlagsCountry> countries) {
		String serial = bomb.getSerialNumber();
		return countries.contains(FlagsCountry.FRANCE) && bomb.isIndicatorUnlit("BOB") && serial != null
			&& serial.toUpperCase(Locale.ROOT).chars().anyMatch(character -> WHITE_FLAG.indexOf(character) >= 0);
	}
}
