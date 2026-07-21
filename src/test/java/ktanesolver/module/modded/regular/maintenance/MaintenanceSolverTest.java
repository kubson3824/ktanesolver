package ktanesolver.module.modded.regular.maintenance;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class MaintenanceSolverTest {
	private final MaintenanceSolver solver = new MaintenanceSolver();

	@Test
	void appliesAllVennConditionsAndTheManualOrderingExceptions() {
		MaintenanceOutput output = solve("BN69 MMA", 4);

		assertThat(output.vennLetter()).isEqualTo("K");
		assertThat(output.model()).isEqualTo("Mercedes-Benz");
		assertThat(output.manufactured()).isEqualTo("September 2019");
		assertThat(output.insuranceCompany()).isEqualTo("Admiral");
		assertThat(output.writeOff()).isFalse();
		assertThat(output.jobs()).containsExactly(
			"Exhaust welding", "Head gasket replacement", "Four tyres", "Wash");
	}

	@Test
	void writesOffWhenUncoveredRepairsExceedTheCarValue() {
		MaintenanceOutput output = solve("AD02 XXY", 4);

		assertThat(output.vennLetter()).isEqualTo("A");
		assertThat(output.carValue()).isEqualTo(420);
		assertThat(output.uncoveredCost()).isEqualTo(688);
		assertThat(output.jobs()).isEqualTo(List.of("Write-off"));
	}

	@Test
	void excludesInsuranceCoveredJobsFromTheWriteOffCost() {
		MaintenanceOutput output = solve("BM69 AMV", 4);

		assertThat(output.insuranceCompany()).isEqualTo("AA");
		assertThat(output.vennLetter()).isEqualTo("N");
		assertThat(output.uncoveredCost()).isEqualTo(19);
		assertThat(output.jobs()).containsExactly("Headlight bulb", "Wiper replacement", "Oil change", "Wash");
	}

	@Test
	void writesOffEveryPre2004HondaRegardlessOfRepairCost() {
		MaintenanceOutput output = solve("HN02 XXY", 2);

		assertThat(output.uncoveredCost()).isEqualTo(28);
		assertThat(output.carValue()).isEqualTo(120);
		assertThat(output.writeOff()).isTrue();
	}

	@Test
	void rejectsUnknownModelAndDateCodes() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
			new MaintenanceInput("ZZ20 ABC", 2))).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private MaintenanceOutput solve(String numberPlate, int numberOfJobs) {
		ModuleEntity module = new ModuleEntity();
		MaintenanceInput input = new MaintenanceInput(numberPlate, numberOfJobs);
		SolveSuccess<MaintenanceOutput> result = (SolveSuccess<MaintenanceOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), module, input);
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getSolution()).containsKey("input");
		return result.output();
	}
}
