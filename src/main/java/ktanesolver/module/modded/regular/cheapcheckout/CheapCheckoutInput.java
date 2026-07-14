package ktanesolver.module.modded.regular.cheapcheckout;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.util.List;

import ktanesolver.logic.ModuleInput;

public record CheapCheckoutInput(DayOfWeek day, List<Item> items, BigDecimal paidAmount) implements ModuleInput {
	public record Item(String name, BigDecimal weight) {}
}
