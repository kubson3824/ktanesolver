package ktanesolver.module.modded.regular.modulusmanipulation;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class ModulusManipulationSolverTest {
	private final ModulusManipulationSolver solver = new ModulusManipulationSolver();

	@Test
	void appliesApplicableRuleSetsInManualOrder() {
		BombEntity bomb = new BombEntity(); bomb.setSerialNumber("A1B2C4"); bomb.setAaBatteryCount(2); bomb.setDBatteryCount(1); bomb.setStrikes(1);
		bomb.setIndicators(Map.of("BOB", true, "SND", false)); bomb.replacePortPlates(List.of(Set.of(PortType.PS2)));
		ModuleEntity current = new ModuleEntity(); List<ModuleEntity> modules = new ArrayList<>(List.of(current));
		for (int i = 0; i < 4; i++) { ModuleEntity other = new ModuleEntity(); other.setType(ModuleType.WIRES); modules.add(other); }
		bomb.setModules(modules);
		assertThat(solve(bomb, current, 4)).isEqualTo(new ModulusManipulationOutput(112, 4, 840, "840", 4));
	}

	@Test
	void validatesLiveMinutesAndPadsTheSubmission() {
		BombEntity bomb = new BombEntity(); bomb.setSerialNumber("AAA0B2"); bomb.setAaBatteryCount(2); bomb.setDBatteryCount(2); bomb.setStrikes(1); bomb.setIndicators(Map.of("SND", false));
		ModuleEntity current = new ModuleEntity(); bomb.setModules(List.of(current));
		assertThat(solve(bomb, current, 3).submission()).hasSize(3);
		assertThat(solver.solve(new RoundEntity(), bomb, current, new ModulusManipulationInput(-1))).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private ModulusManipulationOutput solve(BombEntity bomb, ModuleEntity module, int minutes) {
		return ((SolveSuccess<ModulusManipulationOutput>) solver.solve(new RoundEntity(), bomb, module, new ModulusManipulationInput(minutes))).output();
	}
}
