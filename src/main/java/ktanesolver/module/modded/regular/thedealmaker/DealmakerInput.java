package ktanesolver.module.modded.regular.thedealmaker;

import java.math.BigDecimal;
import ktanesolver.logic.ModuleInput;

public record DealmakerInput(DealKind kind, BigDecimal quantity, Unit unit, Item item, BigDecimal price, Currency currency) implements ModuleInput {
	public enum DealKind { BUY, SELL }

	public enum Unit {
		GRAM("0.001", false), ESTERLING("0.001415", false), PENNYWEIGHT("0.00155517384", false),
		KILOGRAM("1", false), STONEWEIGHT("6.35029318", false), BABYLONIAN_TALENT("30.2", false), HUNDREDWEIGHT("50", false),
		SINGLE("1", true), FULL_HAND("5", true), DOZEN("12", true), SCORE("20", true),
		GREAT_HUNDRED("120", true), SMALL_GROSS("120", true), GROSS("144", true), GREAT_GROSS("1728", true);

		final BigDecimal factor;
		final boolean countable;

		Unit(String factor, boolean countable) {
			this.factor = new BigDecimal(factor);
			this.countable = countable;
		}
	}

	public enum Item {
		SHILLING("0.06", true), WOOD("0.5", false), IRON("0.7", false), STEEL("0.8", false),
		CAN_OF_WORMS("1.8", true), COPPER("3.2", false), COIN("9.4", true), CAT("10.4", true),
		FAKE_GOLD_INGOT_WITH_COPPER_CORE("12.8", true), FLUFFY_ALPACA("20.5", true),
		ABORT_BUTTON("26", true), EMPTY_BOMB_CASE("35", true), OLD_PHONE("48", true), HYPERCUBE("64.7", true);

		final BigDecimal valueEur;
		final boolean countable;

		Item(String valueEur, boolean countable) {
			this.valueEur = new BigDecimal(valueEur);
			this.countable = countable;
		}
	}

	public enum Currency {
		SEK("0.09"), NOK("0.10"), DKK("0.13"), PLN("0.23"), PEN("0.27"), WST("0.34"), BYN("0.43"),
		AUD("0.61"), CAD("0.67"), CHF("0.89"), USD("0.89"), EUR("1"), IMP("1.11"), GBP("1.12");

		final BigDecimal valueEur;

		Currency(String valueEur) {
			this.valueEur = new BigDecimal(valueEur);
		}
	}
}
