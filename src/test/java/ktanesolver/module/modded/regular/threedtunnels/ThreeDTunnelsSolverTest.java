package ktanesolver.module.modded.regular.threedtunnels;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.threedtunnels.ThreeDTunnelsSolver.Vec;

class ThreeDTunnelsSolverTest {
	private final ThreeDTunnelsSolver solver = new ThreeDTunnelsSolver();

	@Test
	void matchesTheSourceTurnAndMoveGeometry() {
		int center = ThreeDTunnelsSolver.state(13, new Vec(1, 0, 0), new Vec(0, 1, 0));
		int up = ThreeDTunnelsSolver.advance(center, "U");
		int right = ThreeDTunnelsSolver.advance(center, "R");
		assertThat(up / 24).isEqualTo(16);
		assertThat(right / 24).isEqualTo(4);
		assertThat(ThreeDTunnelsSolver.advance(ThreeDTunnelsSolver.state(2, new Vec(1, 0, 0), new Vec(0, 1, 0)), "D")).isEqualTo(-1);
	}

	@Test
	void findsAValidRouteFromEveryStateToEveryNode() {
		for (int state = 0; state < 648; state++) for (int target = 0; target < 27; target++) {
			List<String> route = ThreeDTunnelsSolver.route(state, target);
			assertThat(route).isNotNull();
			int current = state;
			for (String action : route) { current = ThreeDTunnelsSolver.advance(current, action); assertThat(current).isNotNegative(); }
			assertThat(current / 24).isEqualTo(target);
		}
	}

	@Test
	void safelyExploresUntilAVisibleSymbolAnchorsLocalization() {
		List<Integer> identified = List.of(0, 1, 5, 10, 20, 26);
		for (int initial = 0; initial < 648; initial++) {
			ModuleEntity module = module(); int actual = initial; boolean routed = false;
			String target = Character.toString(ThreeDTunnelsSolver.SYMBOLS.charAt(initial / 24));
			for (int step = 0; step < 100 && !routed; step++) {
				String visible = identified.contains(actual / 24) ? Character.toString(ThreeDTunnelsSolver.SYMBOLS.charAt(actual / 24)) : "";
				SolveSuccess<ThreeDTunnelsOutput> result = solve(module, observation(actual, target, visible, step == 0));
				for (String action : result.output().actions()) if (!action.equals("SUBMIT")) {
					actual = ThreeDTunnelsSolver.advance(actual, action); assertThat(actual).isNotNegative();
				}
				routed = !result.output().localizationStep();
			}
			assertThat(routed).as("initial state %s", initial).isTrue();
			assertThat(actual / 24).isEqualTo(ThreeDTunnelsSolver.SYMBOLS.indexOf(target));
		}
	}

	@Test
	void recordsAndSolvesAllThreeGoalNodes() {
		ModuleEntity module = module(); int actual = ThreeDTunnelsSolver.state(0, new Vec(1, 0, 0), new Vec(0, 1, 0));
		String[] targets = {"h", "n", "u"};
		for (int stage = 0; stage < 3; stage++) {
			boolean submitted = false;
			for (int step = 0; step < 20 && !submitted; step++) {
				ThreeDTunnelsInput input = observation(actual, targets[stage], Character.toString(ThreeDTunnelsSolver.SYMBOLS.charAt(actual / 24)), stage == 0 && step == 0);
				SolveSuccess<ThreeDTunnelsOutput> result = solve(module, input);
				for (String action : result.output().actions()) if (!action.equals("SUBMIT")) actual = ThreeDTunnelsSolver.advance(actual, action);
				submitted = !result.output().localizationStep();
			}
			assertThat(submitted).isTrue();
		}
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState()).containsEntry("target1", "h").containsEntry("target2", "n").containsEntry("target3", "u");
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<ThreeDTunnelsOutput> solve(ModuleEntity module, ThreeDTunnelsInput input) {
		return (SolveSuccess<ThreeDTunnelsOutput>) solver.solve(new RoundEntity(), new BombEntity(), module, input);
	}
	private static ThreeDTunnelsInput observation(int state, String target, boolean restart) { return observation(state, target, "", restart); }
	private static ThreeDTunnelsInput observation(int state, String target, String visible, boolean restart) {
		int walls = ThreeDTunnelsSolver.wallKey(state);
		return new ThreeDTunnelsInput(visible, target, (walls & 1) != 0, (walls & 2) != 0, (walls & 4) != 0, (walls & 8) != 0, (walls & 16) != 0, restart);
	}
	private static ModuleEntity module() { ModuleEntity module = new ModuleEntity(); module.setType(ModuleType.THREE_D_TUNNELS); module.setState(new HashMap<>()); module.setSolution(new HashMap<>()); return module; }
}
