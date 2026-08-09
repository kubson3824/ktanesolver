package ktanesolver.module.modded.regular.stockmarket;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.stockmarket.StockMarketInput.Company;

class StockMarketSolverTest {
	private final StockMarketSolver solver = new StockMarketSolver();

	@Test
	void appliesAllManualRanksAndFluctuationThresholds() {
		StockMarketOutput output = solve(List.of(
			company("ADM", "YELLOW", "49.99", "49.99", "49.99", "49.99"),
			company("CNA", "RED", "-49.99", "-49.99", "-49.99", "-49.99"),
			company("GSK", "GREEN", "5", "5", "5", "5"),
			company("HSB", "BLUE", "-5", "-5", "-5", "-5")
		));
		assertThat(output.companies()).containsExactly("ADM");
		assertThat(output.scores()).extracting(score -> score.total()).containsExactly(125, -98, 24, 3);
		assertThat(StockMarketSolver.fluctuationPoints(new BigDecimal("24.99"))).isEqualTo(8);
		assertThat(StockMarketSolver.fluctuationPoints(new BigDecimal("25.00"))).isEqualTo(10);
		assertThat(StockMarketSolver.fluctuationPoints(new BigDecimal("30.00"))).isEqualTo(14);
		assertThat(StockMarketSolver.fluctuationPoints(new BigDecimal("-24.99"))).isEqualTo(-8);
		assertThat(StockMarketSolver.fluctuationPoints(new BigDecimal("-25.00"))).isEqualTo(-10);
		assertThat(StockMarketSolver.fluctuationPoints(new BigDecimal("-30.00"))).isEqualTo(-14);
		assertThat(List.of("BLUE", "RED", "MAGENTA", "GREEN", "YELLOW", "ORANGE", "CYAN", "PURPLE"))
			.allMatch(color -> StockMarketSolver.startingValue(color) != null);
	}

	@Test
	void returnsEveryCompanyTiedForTheHighestTotal() {
		StockMarketOutput output = solve(List.of(
			company("ADM", "PURPLE", "49", "-24", "-5", "25"),
			company("CNA", "PURPLE", "5", "10", "24", "24"),
			company("GSK", "PURPLE", "-24", "-24", "49", "24"),
			company("HSB", "PURPLE", "-15", "24", "24", "25")
		));
		assertThat(output.companies()).containsExactly("ADM", "CNA");
		assertThat(output.scores()).extracting(score -> score.total()).containsExactly(41, 41, 24, 34);
	}

	@Test
	void rejectsDuplicateCompaniesAndInvalidObservations() {
		List<Company> duplicate = List.of(
			company("ADM", "BLUE", "5", "5", "5", "5"), company("ADM", "RED", "5", "5", "5", "5"),
			company("GSK", "GREEN", "5", "5", "5", "5"), company("HSB", "CYAN", "5", "5", "5", "5")
		);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(), new StockMarketInput(duplicate)))
			.isInstanceOf(SolveFailure.class);
		List<Company> tooSmall = List.of(
			company("ADM", "BLUE", "4.99", "5", "5", "5"), company("CNA", "RED", "5", "5", "5", "5"),
			company("GSK", "GREEN", "5", "5", "5", "5"), company("HSB", "CYAN", "5", "5", "5", "5")
		);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(), new StockMarketInput(tooSmall)))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private StockMarketOutput solve(List<Company> companies) {
		return ((SolveSuccess<StockMarketOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), module(), new StockMarketInput(companies))).output();
	}

	private static Company company(String abbreviation, String color, String... fluctuations) {
		return new Company(abbreviation, color, java.util.Arrays.stream(fluctuations).map(BigDecimal::new).toList());
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.THE_STOCK_MARKET);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
