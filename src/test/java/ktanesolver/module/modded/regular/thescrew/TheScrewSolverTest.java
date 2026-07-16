package ktanesolver.module.modded.regular.thescrew;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class TheScrewSolverTest {
	private final TheScrewSolver solver = new TheScrewSolver();

	@Test
	void solvesThreeStagesAndAdvancesWhenTheCalculatedHoleAlreadyContainsTheScrew() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("AB1CD1");
		bomb.setDBatteryCount(1);
		bomb.setIndicators(new HashMap<>(Map.of("CLR", true)));
		PortPlateEntity plate = new PortPlateEntity();
		plate.setPorts(new LinkedHashSet<>(List.of(PortType.DVI, PortType.RJ45)));
		bomb.setPortPlates(List.of(plate));
		ModuleEntity module = module();
		List<String> colors = List.of("WHITE", "YELLOW", "BLUE", "MAGENTA", "RED", "GREEN");

		TheScrewOutput first = solve(bomb, module, new TheScrewInput(colors, List.of("A", "B", "C", "D")));
		assertThat(first).isEqualTo(new TheScrewOutput(1, 2, "YELLOW", 3, "C"));
		assertThat(module.isSolved()).isFalse();

		TheScrewOutput second = solve(bomb, module, new TheScrewInput(colors, List.of("A", "C", "D", "B")));
		assertThat(second).isEqualTo(new TheScrewOutput(2, 3, "BLUE", 4, "B"));

		TheScrewOutput third = solve(bomb, module, new TheScrewInput(colors, List.of("D", "A", "C", "B")));
		assertThat(third).isEqualTo(new TheScrewOutput(3, 4, "MAGENTA", 2, "A"));
		assertThat(module.isSolved()).isTrue();
	}

	@Test
	void rejectsDuplicateLayoutValues() {
		TheScrewInput input = new TheScrewInput(List.of("RED", "RED", "GREEN", "BLUE", "MAGENTA", "WHITE"), List.of("A", "B", "C", "D"));
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(), input)).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private TheScrewOutput solve(BombEntity bomb, ModuleEntity module, TheScrewInput input) {
		return ((SolveSuccess<TheScrewOutput>) solver.solve(new RoundEntity(), bomb, module, input)).output();
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
