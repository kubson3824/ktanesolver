package ktanesolver.module.modded.regular.flags;

import static ktanesolver.module.modded.regular.flags.FlagsCountry.*;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class FlagsSolverTest {
	private static final List<FlagsCountry> CHOICES = List.of(
		UNITED_STATES, CANADA, FRANCE, GERMANY, JAPAN, CHILE, AUSTRALIA
	);
	private static final List<FlagsCountry> BY_NAME = List.of(
		AUSTRALIA, CANADA, CHILE, FRANCE, GERMANY, JAPAN, UNITED_STATES
	);
	private final FlagsSolver solver = new FlagsSolver();

	@Test
	void containsTheCurrentManualCountryTable() {
		assertThat(FlagsCountry.values()).hasSize(36);
		assertThat(CUBA.continent()).isEqualTo("North America");
	}

	@Test
	void rejectsInvalidInputsWithoutPersistingThem() {
		assertInvalid(null);
		assertInvalid(new FlagsInput(null, CHOICES, 1));
		assertInvalid(new FlagsInput(GREENLAND, null, 1));
		assertInvalid(new FlagsInput(GREENLAND, CHOICES.subList(0, 6), 1));
		assertInvalid(new FlagsInput(GREENLAND,
			Arrays.asList(UNITED_STATES, CANADA, FRANCE, GERMANY, JAPAN, CHILE, null), 1));
		assertInvalid(new FlagsInput(GREENLAND,
			List.of(UNITED_STATES, CANADA, FRANCE, GERMANY, JAPAN, CHILE, CHILE), 1));
		assertInvalid(new FlagsInput(GREENLAND,
			List.of(GREENLAND, CANADA, FRANCE, GERMANY, JAPAN, CHILE, AUSTRALIA), 1));
		assertInvalid(new FlagsInput(GREENLAND, CHOICES, 0));
		assertInvalid(new FlagsInput(GREENLAND, CHOICES, 8));
	}

	@Test
	void appliesTheFirstMatchingManualRuleAndCountryNameTieBreaks() {
		BombEntity firstRule = bomb("XYZ123");
		firstRule.replacePortPlates(List.of(Set.of(PortType.RJ45)));
		assertRule(firstRule, GREENLAND, CHOICES, 4, "1st Condition (Country Name)", BY_NAME);

		BombEntity secondRule = bomb("XYZ123");
		secondRule.replacePortPlates(List.of(Set.of(PortType.RJ45)));
		List<FlagsCountry> dialChoices = List.of(UNITED_STATES, CANADA, BELGIUM, FRANCE, GERMANY, CHILE, JAPAN);
		assertRule(secondRule, ALGERIA, dialChoices, 2, "2nd Condition (Dial Code)",
			List.of(CANADA, UNITED_STATES, BELGIUM, FRANCE, GERMANY, CHILE, JAPAN));

		assertRule(bomb("XYZ123"), AUSTRIA, CHOICES, 5, "3rd Condition (ISO Code)",
			List.of(AUSTRALIA, CANADA, CHILE, GERMANY, FRANCE, JAPAN, UNITED_STATES));

		BombEntity fourthRule = bomb("XYZ123");
		fourthRule.setIndicators(Map.of("CAR", true));
		assertRule(fourthRule, MEXICO, CHOICES, 4, "4th Condition (Capital)",
			List.of(GERMANY, AUSTRALIA, CANADA, FRANCE, CHILE, JAPAN, UNITED_STATES));

		assertRule(bomb("XYZ123"), NORWAY, CHOICES, 5, "5th Condition (Continent)",
			List.of(JAPAN, FRANCE, GERMANY, CANADA, UNITED_STATES, AUSTRALIA, CHILE));

		assertRule(bomb("XYZ123"), CHINA, CHOICES, 4, "6th Condition (Currency)", BY_NAME);
		assertRule(bomb("XYZ123"), INDIA, CHOICES, 7, "Last Rule (Country Name)", BY_NAME);
	}

	@Test
	void whiteFlagOverrideWinsAndPersistsUserFacingFacts() {
		BombEntity bomb = bomb("xgz123");
		bomb.setIndicators(Map.of("BOB", false));
		bomb.replacePortPlates(List.of(Set.of(PortType.RJ45)));
		FlagsInput input = new FlagsInput(GREENLAND, CHOICES, 7);
		ModuleEntity module = new ModuleEntity();

		assertThat(solve(bomb, module, input)).isEqualTo(new FlagsOutput(FRANCE, BY_NAME, "White Flag (Unicorn)"));
		assertThat(module.getState()).containsEntry("input", input)
			.containsEntry("displayedNumber", 7)
			.containsEntry("mainCountry", "Greenland")
			.containsEntry("countries", CHOICES.stream().map(FlagsCountry::displayName).toList())
			.containsEntry("unicornRule", true);
	}

	private void assertRule(
		BombEntity bomb,
		FlagsCountry main,
		List<FlagsCountry> countries,
		int number,
		String rule,
		List<FlagsCountry> expectedOrder
	) {
		ModuleEntity module = new ModuleEntity();
		FlagsOutput output = solve(bomb, module, new FlagsInput(main, countries, number));
		assertThat(output).isEqualTo(new FlagsOutput(expectedOrder.get(number - 1), expectedOrder, rule));
		assertThat(module.getState()).containsEntry("unicornRule", false);
	}

	private void assertInvalid(FlagsInput input) {
		ModuleEntity module = new ModuleEntity();
		assertThat(solver.solve(new RoundEntity(), bomb("XYZ123"), module, input)).isInstanceOf(SolveFailure.class);
		assertThat(module.getState()).isEmpty();
	}

	@SuppressWarnings("unchecked")
	private FlagsOutput solve(BombEntity bomb, ModuleEntity module, FlagsInput input) {
		return ((SolveSuccess<FlagsOutput>)solver.solve(new RoundEntity(), bomb, module, input)).output();
	}

	private static BombEntity bomb(String serial) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setIndicators(new HashMap<>());
		return bomb;
	}
}
