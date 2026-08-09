package ktanesolver.module.modded.regular.stockmarket;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record StockMarketOutput(List<String> companies, List<CompanyScore> scores) implements ModuleOutput {
	public record CompanyScore(
		String abbreviation, String name, int peakPoints, int slumpPoints, int fluctuationPoints, int total
	) {}
}
