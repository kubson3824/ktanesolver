package ktanesolver.module.modded.regular.thedealmaker;

import static org.assertj.core.api.Assertions.assertThat;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.thedealmaker.DealmakerInput.Currency;
import ktanesolver.module.modded.regular.thedealmaker.DealmakerInput.DealKind;
import ktanesolver.module.modded.regular.thedealmaker.DealmakerInput.Item;
import ktanesolver.module.modded.regular.thedealmaker.DealmakerInput.Unit;

class TheDealmakerSolverTest {
	private final TheDealmakerSolver solver = new TheDealmakerSolver();

	@Test void calculatesConversionsAndMatchesTheSourceEqualityBoundary() {
		var discountedBuy = solve(new DealmakerInput(DealKind.BUY, bd("1"), Unit.KILOGRAM, Item.WOOD, bd("0.5"), Currency.USD));
		assertThat(discountedBuy.output().goodsValueEur()).isEqualByComparingTo("0.5");
		assertThat(discountedBuy.output().offerValueEur()).isEqualByComparingTo("0.445");
		assertThat(discountedBuy.output().action()).isEqualTo("deal");
		assertThat(discountedBuy.solved()).isTrue();

		var underpricedSell = solve(new DealmakerInput(DealKind.SELL, bd("2"), Unit.FULL_HAND, Item.CAT, bd("100"), Currency.EUR));
		assertThat(underpricedSell.output().goodsValueEur()).isEqualByComparingTo("104");
		assertThat(underpricedSell.output().action()).isEqualTo("nodeal");
		assertThat(underpricedSell.solved()).isFalse();

		assertThat(solve(new DealmakerInput(DealKind.SELL, bd("1"), Unit.KILOGRAM, Item.WOOD, bd("0.5"), Currency.EUR)).output().goodDeal()).isTrue();
		assertThat(solve(new DealmakerInput(DealKind.BUY, bd("1"), Unit.KILOGRAM, Item.WOOD, bd("0.5"), Currency.EUR)).output().goodDeal()).isFalse();
	}

	@Test void rejectsIncompatibleUnitsAndFractionalCounts() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new DealmakerInput(DealKind.BUY, bd("1"), Unit.GRAM, Item.CAT, bd("1"), Currency.EUR))).isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new DealmakerInput(DealKind.BUY, bd("1.5"), Unit.SINGLE, Item.CAT, bd("1"), Currency.EUR))).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<DealmakerOutput> solve(DealmakerInput input) {
		return (SolveSuccess<DealmakerOutput>) solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), input);
	}

	private static BigDecimal bd(String value) { return new BigDecimal(value); }
}
