package ktanesolver.module.modded.regular.buttongrid;

import static ktanesolver.module.modded.regular.buttongrid.ButtonGridInput.Color.*;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;

class ButtonGridSolverTest {
	private final ButtonGridSolver solver = new ButtonGridSolver();
	private final List<ButtonGridInput.Color> grid = List.of(RED, BLUE, YELLOW, GREEN, RED, BLUE, YELLOW, GREEN, RED, BLUE, YELLOW, GREEN, RED, BLUE, YELLOW, GREEN, RED, BLUE, YELLOW, GREEN);
	@Test void computesAllFiveStagesAndUsesEveryButtonOnce() {
		BombEntity bomb = bomb("BT1XZ9");
		ButtonGridOutput output = solve(bomb);
		assertThat(output.instantSolve()).isFalse();
		assertThat(output.stageOrders()).hasSize(5);
		assertThat(output.stageOrders().getFirst()).containsExactly(GREEN, RED, YELLOW, BLUE);
		assertThat(output.positions()).hasSize(20).doesNotHaveDuplicates();
	}
	@Test void appliesTheBobDviOneBatteryExceptionWithDistinctBlues() {
		BombEntity bomb = bomb("C12XYZ"); bomb.setAaBatteryCount(1); bomb.getIndicators().put("BOB", true); bomb.replacePortPlates(List.of(Set.of(PortType.DVI)));
		ButtonGridOutput output = solve(bomb);
		assertThat(output.instantSolve()).isTrue();
		assertThat(output.positions()).containsExactly(2, 1, 6, 3).doesNotHaveDuplicates();
	}
	private static BombEntity bomb(String serial) { BombEntity bomb = new BombEntity(); bomb.setSerialNumber(serial); return bomb; }
	@SuppressWarnings("unchecked") private ButtonGridOutput solve(BombEntity bomb) { ModuleEntity module = new ModuleEntity(); module.setState(new HashMap<>()); module.setSolution(new HashMap<>()); return ((SolveSuccess<ButtonGridOutput>) solver.solve(new RoundEntity(), bomb, module, new ButtonGridInput(grid))).output(); }
}
