package ktanesolver.module.modded.regular.theblock;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class TheBlockSolverTest {
	private final TheBlockSolver solver = new TheBlockSolver();

	@Test
	void honorsFirstApplicableRuleAndBlockToken() {
		BombEntity bob = bomb(); bob.setAaBatteryCount(2); bob.setDBatteryCount(1); bob.setIndicators(Map.of("BOB", true)); bob.replacePortPlates(List.of(Set.of()));
		assertThat(solve(bob, List.of("red","blue","green","yellow","red","blue"))).isEqualTo(new TheBlockOutput(1, List.of("BLOCK","BLOCK","BLOCK","BLOCK","BLOCK")));
		BombEntity vowel = bomb(); vowel.setSerialNumber("A1B2C3"); vowel.setIndicators(Map.of("SIG", false));
		assertThat(solve(vowel, List.of("red","blue","green","yellow","red","blue"))).isEqualTo(new TheBlockOutput(3, List.of("6","5","4","3","2","1")));
	}

	@Test void rejectsMissingFaces() { assertThat(solver.solve(new RoundEntity(), bomb(), new ModuleEntity(), new TheBlockInput(List.of("red")))).isInstanceOf(SolveFailure.class); }
	@SuppressWarnings("unchecked") private TheBlockOutput solve(BombEntity bomb, List<String> colors) { return ((SolveSuccess<TheBlockOutput>) solver.solve(new RoundEntity(), bomb, new ModuleEntity(), new TheBlockInput(colors))).output(); }
	private static BombEntity bomb() { BombEntity bomb = new BombEntity(); bomb.setSerialNumber("BC1D23"); return bomb; }
}
