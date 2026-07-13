package ktanesolver.module.modded.regular.bitmaps;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class BitmapsSolverTest {
	private final BitmapsSolver solver = new BitmapsSolver();

	@Test
	void followsRuleOrderAndUsesEdgeworkAnswers() {
		BombEntity squareBomb = bomb("ABC128");
		assertThat(solve(squareBomb, List.of(0, 0, 0, 0), 0, 2)).isEqualTo(new BitmapsOutput(2, 8, 2));

		BombEntity portBomb = bomb("ABC127");
		portBomb.setIndicators(Map.of("BOB", false, "CAR", false, "FRK", false, "NSA", false));
		portBomb.replacePortPlates(List.of(Set.of(PortType.RJ45, PortType.SERIAL), Set.of(PortType.RJ45)));
		assertThat(solve(portBomb, List.of(0, 0, 0, 0), 0, 2)).isEqualTo(new BitmapsOutput(3, 7, 3));

		BombEntity batteryBomb = bomb("ABC121");
		batteryBomb.setAaBatteryCount(3);
		batteryBomb.setDBatteryCount(2);
		batteryBomb.setIndicators(Map.of("BOB", true, "CAR", true, "FRK", true, "NSA", true));
		assertThat(solve(batteryBomb, List.of(16, 16, 16, 16), 0, 2)).isEqualTo(new BitmapsOutput(1, 1, 5));

		BombEntity wrappingBomb = bomb("A3BC14");
		wrappingBomb.setIndicators(Map.of("BOB", false));
		assertThat(solve(wrappingBomb, List.of(8, 8, 8, 8), 0, 0)).isEqualTo(new BitmapsOutput(3, 9, 3));

		assertThat(solve(bomb("ABC122"), List.of(8, 8, 8, 8), 6, 0)).isEqualTo(new BitmapsOutput(2, 2, 6));
	}

	@Test
	void rejectsIncompleteBitmaps() {
		assertThat(solver.solve(new RoundEntity(), bomb("ABC123"), new ModuleEntity(), new BitmapsInput(List.of(1), 0, 0)))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private BitmapsOutput solve(BombEntity bomb, List<Integer> whiteCounts, int uniformLineCoordinate, int squareCenterX) {
		return ((SolveSuccess<BitmapsOutput>)solver.solve(
			new RoundEntity(), bomb, new ModuleEntity(), new BitmapsInput(whiteCounts, uniformLineCoordinate, squareCenterX))).output();
	}

	private static BombEntity bomb(String serial) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setIndicators(new HashMap<>());
		return bomb;
	}
}
