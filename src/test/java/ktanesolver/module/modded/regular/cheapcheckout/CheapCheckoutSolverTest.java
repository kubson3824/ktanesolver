package ktanesolver.module.modded.regular.cheapcheckout;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.util.List;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.cheapcheckout.CheapCheckoutInput.Item;

class CheapCheckoutSolverTest {
	private final CheapCheckoutSolver solver = new CheapCheckoutSolver();

	@ParameterizedTest
	@MethodSource("weekdayTotals")
	void appliesEveryWeekdaySaleAndCommercialRounding(DayOfWeek day, String expectedTotal) {
		CheapCheckoutOutput output = solve(new ModuleEntity(), new CheapCheckoutInput(day, cart(), new BigDecimal("100.00")));

		assertThat(output.total()).isEqualByComparingTo(expectedTotal);
		assertThat(output.change()).isEqualByComparingTo(new BigDecimal("100.00").subtract(new BigDecimal(expectedTotal)));
	}

	@Test
	void keepsBothPaidAmountsWhenTheCustomerInitiallyUnderpays() {
		ModuleEntity module = new ModuleEntity();
		CheapCheckoutOutput first = solve(module, new CheapCheckoutInput(DayOfWeek.MONDAY, cart(), new BigDecimal("10.00")));

		assertThat(first.needsSecondPayment()).isTrue();
		assertThat(module.isSolved()).isFalse();
		assertThat(module.getState().get("paidAmounts")).isEqualTo(List.of("$10.00"));

		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module,
			new CheapCheckoutInput(null, null, new BigDecimal("20.00"))))
			.isInstanceOf(SolveFailure.class);

		CheapCheckoutOutput second = solve(module, new CheapCheckoutInput(null, null, new BigDecimal("25.00")));
		assertThat(second.change()).isEqualByComparingTo("4.75");
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState().get("paidAmounts")).isEqualTo(List.of("$10.00", "$25.00"));
	}

	@SuppressWarnings("unchecked")
	private CheapCheckoutOutput solve(ModuleEntity module, CheapCheckoutInput input) {
		return ((SolveSuccess<CheapCheckoutOutput>) solver.solve(new RoundEntity(), new BombEntity(), module, input)).output();
	}

	private static List<Item> cart() {
		return List.of(
			new Item("Socks", null),
			new Item("Candy Canes", null),
			new Item("Canola Oil", null),
			new Item("Chocolate Bar", null),
			new Item("Bananas", new BigDecimal("0.5")),
			new Item("Steak", new BigDecimal("1.5"))
		);
	}

	private static Stream<Arguments> weekdayTotals() {
		return Stream.of(
			Arguments.of(DayOfWeek.SUNDAY, "27.06"),
			Arguments.of(DayOfWeek.MONDAY, "20.25"),
			Arguments.of(DayOfWeek.TUESDAY, "41.76"),
			Arguments.of(DayOfWeek.WEDNESDAY, "30.52"),
			Arguments.of(DayOfWeek.THURSDAY, "17.92"),
			Arguments.of(DayOfWeek.FRIDAY, "22.87"),
			Arguments.of(DayOfWeek.SATURDAY, "20.80")
		);
	}
}
