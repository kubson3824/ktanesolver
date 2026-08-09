package ktanesolver.module.modded.regular.maritimeflags;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class MaritimeFlagsSolverTest {
	private final MaritimeFlagsSolver solver = new MaritimeFlagsSolver();

	@Test
	void loadsTheCompleteDefaultCallsignTableAndCombinesBearings() {
		assertThat(MaritimeFlagsSolver.callsignCount()).isEqualTo(315);
		assertThat(MaritimeFlagsSolver.callsignBearing("1STMATE")).isEqualTo(355);
		assertThat(MaritimeFlagsSolver.callsignBearing("CAPTAIN")).isEqualTo(1);
		assertThat(MaritimeFlagsSolver.callsignBearing("STATION")).isEqualTo(359);
		ModuleEntity module = module();
		SolveSuccess<MaritimeFlagsOutput> result = solve(module, new MaritimeFlagsInput("captain", 100));
		assertThat(result.output()).isEqualTo(new MaritimeFlagsOutput(1, 101, "E"));
		assertThat(module.getState()).containsEntry("callsign", "CAPTAIN").containsEntry("signalledBearing", 100);
	}

	@Test
	void matchesEveryCompassBoundaryAndRejectsUnknownCallsigns() {
		assertThat(MaritimeFlagsSolver.direction(0)).isEqualTo("N");
		assertThat(MaritimeFlagsSolver.direction(11)).isEqualTo("N");
		assertThat(MaritimeFlagsSolver.direction(12)).isEqualTo("NNE");
		assertThat(MaritimeFlagsSolver.direction(348)).isEqualTo("NNW");
		assertThat(MaritimeFlagsSolver.direction(349)).isEqualTo("N");
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(), new MaritimeFlagsInput("UNKNOWN", 42)))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<MaritimeFlagsOutput> solve(ModuleEntity module, MaritimeFlagsInput input) {
		return (SolveSuccess<MaritimeFlagsOutput>) solver.solve(new RoundEntity(), new BombEntity(), module, input);
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.MARITIME_FLAGS);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
