package ktanesolver.module.modded.regular.simonscreams;

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

class SimonScreamsSolverTest {
	private static final List<SimonScreamsColor> CLOCKWISE = List.of(
		SimonScreamsColor.ORANGE, SimonScreamsColor.RED, SimonScreamsColor.YELLOW,
		SimonScreamsColor.GREEN, SimonScreamsColor.PURPLE, SimonScreamsColor.BLUE);
	private final SimonScreamsSolver solver = new SimonScreamsSolver();
	private final BombEntity bomb = bomb();
	private final ModuleEntity module = new ModuleEntity();

	@Test
	void appliesRulePriorityEdgeworkAndGrowingStageHistory() {
		SimonScreamsOutput first = solve(1, SimonScreamsColor.ORANGE, SimonScreamsColor.GREEN, SimonScreamsColor.PURPLE);
		assertThat(first.rule()).isEqualTo("at most one color flashed out of red, yellow, and blue");
		assertThat(first.press()).containsExactly(SimonScreamsColor.RED, SimonScreamsColor.BLUE, SimonScreamsColor.PURPLE, SimonScreamsColor.YELLOW);

		SimonScreamsOutput second = solve(2, SimonScreamsColor.ORANGE, SimonScreamsColor.GREEN, SimonScreamsColor.PURPLE, SimonScreamsColor.RED);
		assertThat(second.press()).containsExactly(SimonScreamsColor.YELLOW, SimonScreamsColor.PURPLE, SimonScreamsColor.ORANGE, SimonScreamsColor.GREEN);

		SimonScreamsOutput third = solve(3, SimonScreamsColor.ORANGE, SimonScreamsColor.GREEN, SimonScreamsColor.PURPLE, SimonScreamsColor.RED, SimonScreamsColor.YELLOW);
		assertThat(third.rule()).isEqualTo("two adjacent colors flashed in clockwise order");
		assertThat(third.press()).containsExactly(SimonScreamsColor.RED, SimonScreamsColor.BLUE, SimonScreamsColor.PURPLE, SimonScreamsColor.YELLOW);
		assertThat(module.isSolved()).isTrue();
		assertThat((List<?>) module.getState().get("flashHistory")).hasSize(3);
	}

	@Test
	void rejectsAStageThatDoesNotExtendThePreviousSequence() {
		solve(1, SimonScreamsColor.ORANGE, SimonScreamsColor.GREEN, SimonScreamsColor.PURPLE);
		assertThat(solver.solve(new RoundEntity(), bomb, module,
			new SimonScreamsInput(2, CLOCKWISE, List.of(SimonScreamsColor.RED, SimonScreamsColor.GREEN, SimonScreamsColor.PURPLE, SimonScreamsColor.ORANGE))))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SimonScreamsOutput solve(int stage, SimonScreamsColor... flashes) {
		return ((SolveSuccess<SimonScreamsOutput>) solver.solve(new RoundEntity(), bomb, module,
			new SimonScreamsInput(stage, CLOCKWISE, List.of(flashes)))).output();
	}

	private static BombEntity bomb() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("A1B2C3");
		bomb.setAaBatteryCount(2);
		bomb.setIndicators(Map.of("CAR", true, "FRK", false, "SND", true));
		PortPlateEntity plate = new PortPlateEntity();
		plate.setPorts(new LinkedHashSet<>(List.of(PortType.DVI, PortType.PARALLEL, PortType.SERIAL)));
		bomb.setPortPlates(List.of(plate));
		return bomb;
	}
}
