package ktanesolver.module.modded.regular.stockmarket;

import java.math.BigDecimal;
import java.util.List;

import ktanesolver.logic.ModuleInput;

public record StockMarketInput(List<Company> companies) implements ModuleInput {
	public record Company(String abbreviation, String color, List<BigDecimal> fluctuations) {}
}
