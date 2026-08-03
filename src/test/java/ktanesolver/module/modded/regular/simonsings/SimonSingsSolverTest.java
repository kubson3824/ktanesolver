package ktanesolver.module.modded.regular.simonsings;

import static org.assertj.core.api.Assertions.assertThat;

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

class SimonSingsSolverTest {
	private final SimonSingsSolver solver = new SimonSingsSolver();
	private final BombEntity bomb = bomb();
	private final ModuleEntity module = new ModuleEntity();

	@Test
	void solvesAllStagesAndPersistsEverySouvenirFlash() {
		assertThat(solve("D", "C", "C♯", "D♯", "E", "G", "G♯", "B").press())
			.containsExactly("left A♯", "right D♯");
		assertThat(solve("F♯", "A", "A♯", "G♯", "D", "C", "B", "E").press())
			.containsExactly("left A♯", "right D♯", "left G♯", "right D");
		assertThat(solve("F", "G", "A", "G♯", "A♯", "E", "B", "C♯").press())
			.containsExactly("left A♯", "right D♯", "left G♯", "right D", "left B", "right D");

		assertThat(module.isSolved()).isTrue();
		assertThat((List<?>) module.getState().get("flashHistory")).hasSize(3);
	}

	@Test
	void rejectsRepeatedOrMissingNotes() {
		assertThat(solver.solve(new RoundEntity(), bomb, new ModuleEntity(),
			new SimonSingsInput(List.of("C", "C", "D", "E", "F", "G", "A", "B"))))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SimonSingsOutput solve(String... flashes) {
		return ((SolveSuccess<SimonSingsOutput>) solver.solve(
			new RoundEntity(), bomb, module, new SimonSingsInput(List.of(flashes)))).output();
	}

	private static BombEntity bomb() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("A1B2C3");
		bomb.setAaBatteryCount(2);
		bomb.setDBatteryCount(1);
		bomb.setIndicators(Map.of("CAR", true, "FRK", false, "SND", true));
		PortPlateEntity plate = new PortPlateEntity();
		plate.setPorts(new LinkedHashSet<>(List.of(PortType.DVI, PortType.PARALLEL, PortType.SERIAL)));
		bomb.setPortPlates(List.of(plate));
		return bomb;
	}
}
