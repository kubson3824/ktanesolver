package ktanesolver.module.modded.regular.purplearrows;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class PurpleArrowsSolverTest {
	private final PurpleArrowsSolver solver = new PurpleArrowsSolver();
	@Test void identifiesTheHiddenStartFromObservationsThenRoutesToTheAnagram() {
		ModuleEntity module = new ModuleEntity(); module.setState(new HashMap<>()); module.setSolution(new HashMap<>());
		int actual = PurpleArrowsSolver.WORDS.indexOf("THREAD"); PurpleArrowsOutput output = null;
		for (int turn = 0; turn < 20; turn++) {
			String letter = PurpleArrowsSolver.WORDS.get(actual).substring(0, 1);
			output = solve(module, new PurpleArrowsInput(letter, "SISHET", turn == 0));
			if (output.submit()) break; actual = PurpleArrowsSolver.move(actual, output.action());
		}
		assertThat(output).isNotNull(); assertThat(output.submit()).isTrue(); assertThat(output.targetWord()).isEqualTo("THESIS");
		assertThat(module.getState()).containsEntry("purpleArrowsTargetWord", "THESIS");
	}
	@SuppressWarnings("unchecked") private PurpleArrowsOutput solve(ModuleEntity module, PurpleArrowsInput input) { return ((SolveSuccess<PurpleArrowsOutput>) solver.solve(new RoundEntity(), new BombEntity(), module, input)).output(); }
}
