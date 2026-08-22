package ktanesolver.module.modded.regular.daylightdirections;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class DaylightDirectionsSolverTest {
	private final DaylightDirectionsSolver solver = new DaylightDirectionsSolver();

	@Test
	void appliesSunAndColorRotationsAndChoosesTheShorterTurn() {
		BombEntity bomb = bomb("BC1D35");
		assertThat(solve(bomb, new DaylightDirectionsInput("right", "purple", "right")))
			.isEqualTo(new DaylightDirectionsOutput("LEFT", "CLOCKWISE", 4));
		BombEntity withD = bomb("BC1D34"); withD.setDBatteryCount(1);
		assertThat(solve(withD, new DaylightDirectionsInput("left", "green", "down")))
			.isEqualTo(new DaylightDirectionsOutput("UP_RIGHT", "COUNTERCLOCKWISE", 3));
	}

	@Test
	void rejectsUnknownDisplayValues() {
		assertThat(solver.solve(new RoundEntity(), bomb("ABC123"), new ModuleEntity(), new DaylightDirectionsInput("top", "red", "right")))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private DaylightDirectionsOutput solve(BombEntity bomb, DaylightDirectionsInput input) {
		return ((SolveSuccess<DaylightDirectionsOutput>) solver.solve(new RoundEntity(), bomb, new ModuleEntity(), input)).output();
	}
	private static BombEntity bomb(String serial) { BombEntity bomb = new BombEntity(); bomb.setSerialNumber(serial); bomb.setIndicators(Map.of()); return bomb; }
}
