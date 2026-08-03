package ktanesolver.module.modded.regular.subways;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.subways.SubwaysInput.City;
import ktanesolver.module.modded.regular.subways.SubwaysInput.Commuter;
import ktanesolver.module.modded.regular.subways.SubwaysInput.Day;

class SubwaysSolverTest {
	private final SubwaysSolver solver = new SubwaysSolver();

	@Test
	void resolvesManualAndBatteryCountEntries() {
		assertThat(solve(0, new SubwaysInput(City.LONDON, Commuter.KATIE, Day.FRIDAY)))
			.isEqualTo(new SubwaysOutput(16, "10 PM", List.of("King’s Cross St. Pancras", "Warren Street", "Green Park")));
		assertThat(solve(14, new SubwaysInput(City.NEW_YORK, Commuter.MIKE, Day.MONDAY)))
			.isEqualTo(new SubwaysOutput(7, "2 PM", List.of("World Trade Center E", "Canal St A-C-E", "Chambers St A-C")));
	}

	@Test
	void rejectsIncompleteDisplay() {
		SolveResult<SubwaysOutput> result = solver.solve(new RoundEntity(), new BombEntity(), module(),
			new SubwaysInput(City.PARIS, null, Day.MONDAY));

		assertThat(result).isInstanceOf(SolveFailure.class);
		assertThat(((SolveFailure<SubwaysOutput>) result).getReason()).isEqualTo("Select the city, commuter, and day shown on the module");
	}

	private SubwaysOutput solve(int batteries, SubwaysInput input) {
		BombEntity bomb = new BombEntity();
		bomb.setAaBatteryCount(batteries);
		ModuleEntity module = module();
		SolveResult<SubwaysOutput> result = solver.solve(new RoundEntity(), bomb, module, input);
		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(module.isSolved()).isTrue();
		return ((SolveSuccess<SubwaysOutput>) result).output();
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.SUBWAYS);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
