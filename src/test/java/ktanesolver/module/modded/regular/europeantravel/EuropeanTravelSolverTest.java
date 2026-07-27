package ktanesolver.module.modded.regular.europeantravel;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class EuropeanTravelSolverTest {
	private final EuropeanTravelSolver solver = new EuropeanTravelSolver();

	@Test
	void derivesCitiesClassTypePriceAndSeatFromEverySerialPosition() {
		assertThat(solve("Germany", "AGBZQ9")).isEqualTo(
			new EuropeanTravelOutput("SGL", "1st class", "Ulm Hbf.", "Bonn Hbf.", "4B", "177.80"));
		assertThat(solve("Belgium", "8D256U")).isEqualTo(
			new EuropeanTravelOutput("RTN", "2nd class", "Gent-Sint-Pieters", "Aarschot", "2B", "1.98"));

		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
			new EuropeanTravelInput("France", "AO1234"))).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private EuropeanTravelOutput solve(String country, String serial) {
		Object result = solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
			new EuropeanTravelInput(country, serial));
		assertThat(result).isInstanceOf(SolveSuccess.class);
		return ((SolveSuccess<EuropeanTravelOutput>) result).output();
	}
}
