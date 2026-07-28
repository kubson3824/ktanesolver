package ktanesolver.module.modded.regular.thewire;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
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
import ktanesolver.module.modded.regular.thewire.TheWireInput.WireColor;

class TheWireSolverTest {
	private final TheWireSolver solver = new TheWireSolver();

	@Test
	void solvesFlowChartAndVennDiagramAndStoresSouvenirFacts() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("G12ABC");
		bomb.setAaBatteryCount(2);
		bomb.setIndicators(Map.of("CAR", true, "NSA", false));
		bomb.replacePortPlates(List.of(Set.of(PortType.SERIAL, PortType.RJ45)));
		bomb.setModules(List.of(new ModuleEntity(), new ModuleEntity(), new ModuleEntity()));
		ModuleEntity module = module();

		var result = solver.solve(new RoundEntity(), bomb, module, new TheWireInput(
			WireColor.BLUE, WireColor.GREY, WireColor.BLUE, WireColor.PURPLE, 4, 2
		));

		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(((SolveSuccess<TheWireOutput>) result).output()).isEqualTo(new TheWireOutput("Q", "E", "Y", 4));
		assertThat(module.getState()).containsEntry("displayedNumber", 4).containsKey("dialColors");
	}

	@Test
	void rejectsInvalidDisplayAndInitiationCount() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("ABC123");
		assertThat(solver.solve(new RoundEntity(), bomb, module(), new TheWireInput(
			WireColor.BLUE, WireColor.GREEN, WireColor.RED, WireColor.GREY, 10, 0
		))).isInstanceOf(SolveFailure.class);
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.THE_WIRE);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
