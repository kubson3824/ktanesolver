package ktanesolver.module.modded.regular.thebulb;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class TheBulbSolverTest {
	private final TheBulbSolver solver = new TheBulbSolver();

	@Test
	void followsEveryInitialBranchAndBothIndicatorRoutes() {
		for (TheBulbInput.Color color : TheBulbInput.Color.values()) {
			for (boolean opaque : new boolean[]{false, true}) {
				for (boolean lightOn : new boolean[]{false, true}) {
					ModuleEntity module = new ModuleEntity();
					SolveSuccess<TheBulbOutput> first = solve(new BombEntity(), module, new TheBulbInput(color, opaque, lightOn, null));
					SolveSuccess<TheBulbOutput> last = first.solved() ? first : solve(new BombEntity(), module, new TheBulbInput(null, null, null, false));
					assertThat(last.solved()).as("%s opaque=%s on=%s", color, opaque, lightOn).isTrue();
					assertThat(last.output().actions()).isNotEmpty();
				}
			}
		}

		BombEntity withCar = new BombEntity();
		withCar.getIndicators().put("CAR", false);
		assertThat(solve(withCar, new ModuleEntity(), new TheBulbInput(TheBulbInput.Color.BLUE, false, false, null)).output().actions())
			.containsExactly("Unscrew the bulb.", "Press I.", "Press I.", "Press O.", "Screw the bulb back in.");
		assertThat(solve(new BombEntity(), new ModuleEntity(), new TheBulbInput(TheBulbInput.Color.BLUE, false, false, null)).output().actions())
			.containsExactly("Unscrew the bulb.", "Press O.", "Press O.", "Press I.", "Screw the bulb back in.");
	}

	@Test
	void continuesAtTheObservationWithoutRepeatingEarlierActions() {
		ModuleEntity module = new ModuleEntity();
		SolveSuccess<TheBulbOutput> first = solve(new BombEntity(), module, new TheBulbInput(TheBulbInput.Color.RED, false, true, null));
		assertThat(first.solved()).isFalse();
		assertThat(first.output().prompt()).isEqualTo("Did the light go off at Step 1?");

		SolveSuccess<TheBulbOutput> last = solve(new BombEntity(), module, new TheBulbInput(null, null, null, false));
		assertThat(last.solved()).isTrue();
		assertThat(last.output().continueFrom()).isEqualTo(3);
		assertThat(last.output().actions()).containsExactly("Press I.", "Press I.", "Unscrew the bulb.", "Press O.", "Screw the bulb back in.");
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<TheBulbOutput> solve(BombEntity bomb, ModuleEntity module, TheBulbInput input) {
		return (SolveSuccess<TheBulbOutput>)solver.solve(new RoundEntity(), bomb, module, input);
	}
}
