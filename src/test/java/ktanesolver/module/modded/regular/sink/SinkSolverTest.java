package ktanesolver.module.modded.regular.sink;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.sink.SinkOutput.Knob;

class SinkSolverTest {
	private final SinkSolver solver = new SinkSolver();

	@Test
	void followsEachBatteryBandAndRelevantEdgework() {
		assertThat(solve(bomb("A1BC23", 1, Map.of("NSA", false), Set.of()), new SinkInput(false, false, false, false)))
			.containsExactly(Knob.HOT, Knob.HOT, Knob.COLD);
		assertThat(solve(bomb("B1CD23", 3, Map.of(), Set.of(PortType.RJ45)), new SinkInput(true, false, false, false)))
			.containsExactly(Knob.COLD, Knob.COLD, Knob.HOT);
		assertThat(solve(bomb("B1CD23", 5, Map.of("NSA", false), Set.of()), new SinkInput(false, false, true, false)))
			.containsExactly(Knob.COLD, Knob.HOT, Knob.COLD);
		assertThat(solve(bomb("B1CD23", 7, Map.of(), Set.of()), new SinkInput(false, true, false, true)))
			.containsExactly(Knob.COLD, Knob.HOT, Knob.HOT);
	}

	private List<Knob> solve(BombEntity bomb, SinkInput input) {
		var result = (SolveSuccess<SinkOutput>) solver.solve(new RoundEntity(), bomb, new ModuleEntity(), input);
		return result.output().sequence();
	}

	private static BombEntity bomb(String serial, int batteries, Map<String, Boolean> indicators, Set<PortType> ports) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setAaBatteryCount(batteries);
		bomb.setIndicators(indicators);
		bomb.replacePortPlates(ports.isEmpty() ? List.of() : List.of(ports));
		return bomb;
	}
}
