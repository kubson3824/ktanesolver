package ktanesolver.module.modded.regular.stockmarket;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.IntStream;

import org.springframework.stereotype.Service;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.stockmarket.StockMarketInput.Company;
import ktanesolver.module.modded.regular.stockmarket.StockMarketOutput.CompanyScore;

@Service
@ModuleInfo(
	type = ModuleType.THE_STOCK_MARKET,
	id = "stockMarket",
	name = "The Stock Market",
	category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
	description = "Rank four companies by quarterly peaks, slumps, and fluctuations.",
	tags = {"companies", "stocks", "quarterly", "ranking"}
)
public class StockMarketSolver extends AbstractModuleSolver<StockMarketInput, StockMarketOutput> {
	private static final Map<String, String> NAMES = Map.ofEntries(
		Map.entry("ADM", "Admiral Grp."), Map.entry("CNA", "Centrica"),
		Map.entry("GSK", "GlaxoSmithKline"), Map.entry("HSB", "HSBC"),
		Map.entry("IMB", "Imperial Brands"), Map.entry("MKS", "Marks and Spencer"),
		Map.entry("NXT", "Next plc."), Map.entry("QLT", "Quilter"),
		Map.entry("RMG", "Royal Mail"), Map.entry("SVT", "Severn Trent"),
		Map.entry("TUI", "TUI Grp."), Map.entry("VOD", "Vodafone Grp.")
	);
	private static final Map<String, BigDecimal> STARTS = Map.of(
		"BLUE", new BigDecimal("408.37"), "RED", new BigDecimal("411.06"),
		"MAGENTA", new BigDecimal("396.82"), "GREEN", new BigDecimal("392.97"),
		"YELLOW", new BigDecimal("414.51"), "ORANGE", new BigDecimal("402.84"),
		"CYAN", new BigDecimal("406.73"), "PURPLE", new BigDecimal("399.48")
	);

	@Override
	protected SolveResult<StockMarketOutput> doSolve(
		RoundEntity round, BombEntity bomb, ModuleEntity module, StockMarketInput input
	) {
		if (input == null || input.companies() == null || input.companies().size() != 4) {
			return failure("Enter exactly four companies");
		}
		List<Company> companies = new ArrayList<>();
		Set<String> seen = new HashSet<>();
		for (Company raw : input.companies()) {
			if (raw == null || raw.abbreviation() == null || raw.color() == null || raw.fluctuations() == null) {
				return failure("Enter each company, color, and four fluctuations");
			}
			String abbreviation = raw.abbreviation().trim().toUpperCase(Locale.ROOT);
			String color = raw.color().trim().toUpperCase(Locale.ROOT);
			if (!NAMES.containsKey(abbreviation)) return failure("Unknown company abbreviation: " + abbreviation);
			if (!seen.add(abbreviation)) return failure("The four companies must be distinct");
			if (!STARTS.containsKey(color)) return failure("Unknown company color: " + color);
			if (raw.fluctuations().size() != 4 || raw.fluctuations().stream().anyMatch(value -> !validFluctuation(value))) {
				return failure("Each company needs four fluctuations from ±5.00 through ±49.99");
			}
			companies.add(new Company(abbreviation, color, List.copyOf(raw.fluctuations())));
		}

		List<BigDecimal> peaks = new ArrayList<>(), slumps = new ArrayList<>();
		int[] peakPoints = new int[4], slumpPoints = new int[4], fluctuationPoints = new int[4];
		for (int i = 0; i < 4; i++) {
			Company company = companies.get(i);
			BigDecimal value = STARTS.get(company.color());
			List<BigDecimal> quarterly = new ArrayList<>();
			for (BigDecimal fluctuation : company.fluctuations()) {
				value = value.add(fluctuation);
				quarterly.add(value);
				fluctuationPoints[i] += fluctuationPoints(fluctuation);
			}
			peaks.add(quarterly.stream().max(BigDecimal::compareTo).orElseThrow());
			slumps.add(quarterly.stream().min(BigDecimal::compareTo).orElseThrow());
		}

		List<Integer> peakOrder = IntStream.range(0, 4).boxed()
			.sorted(Comparator.comparing(peaks::get).reversed()).toList();
		List<Integer> slumpOrder = IntStream.range(0, 4).boxed()
			.sorted(Comparator.comparing(slumps::get)).toList();
		for (int rank = 0; rank < 4; rank++) {
			peakPoints[peakOrder.get(rank)] = 30 - rank * 3;
			slumpPoints[slumpOrder.get(rank)] = -15 + rank * 2;
		}

		List<CompanyScore> scores = new ArrayList<>();
		int highest = Integer.MIN_VALUE;
		for (int i = 0; i < 4; i++) {
			Company company = companies.get(i);
			int total = peakPoints[i] + slumpPoints[i] + fluctuationPoints[i];
			scores.add(new CompanyScore(company.abbreviation(), NAMES.get(company.abbreviation()),
				peakPoints[i], slumpPoints[i], fluctuationPoints[i], total));
			highest = Math.max(highest, total);
		}
		int winningScore = highest;
		List<String> winners = scores.stream().filter(score -> score.total() == winningScore)
			.map(CompanyScore::abbreviation).toList();
		storeState(module, "companies", companies);
		return success(new StockMarketOutput(winners, scores));
	}

	private static boolean validFluctuation(BigDecimal value) {
		return value != null && value.stripTrailingZeros().scale() <= 2
			&& value.abs().compareTo(new BigDecimal("5.00")) >= 0
			&& value.abs().compareTo(new BigDecimal("50.00")) < 0;
	}

	static int fluctuationPoints(BigDecimal fluctuation) {
		int units = fluctuation.intValue() / 5;
		if (units >= 5) return 10 + (units - 5) * 4;
		if (units <= -5) return (units + 5) * 4 - 10;
		return units * 2;
	}

	static BigDecimal startingValue(String color) {
		return STARTS.get(color);
	}
}
