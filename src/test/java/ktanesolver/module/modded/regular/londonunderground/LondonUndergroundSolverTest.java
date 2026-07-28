package ktanesolver.module.modded.regular.londonunderground;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.londonunderground.LondonUndergroundInput.Action;

class LondonUndergroundSolverTest {
	private final LondonUndergroundSolver solver = new LondonUndergroundSolver();

	@Test
	void solvesThreeConnectedJourneysAndKeepsOnlyTheSuccessfulSouvenirHistory() {
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());

		assertThat(solve(module, new LondonUndergroundInput(Action.SOLVE_STAGE, "Hanger Lane", "Clapham South")))
			.isEqualTo(new LondonUndergroundOutput(List.of(
				new LondonUndergroundLeg("Central", "Tottenham Court Road"),
				new LondonUndergroundLeg("Northern", "Clapham South")
			), 1));
		solve(module, new LondonUndergroundInput(Action.RESET, null, null));

		solve(module, new LondonUndergroundInput(Action.SOLVE_STAGE, "Oxford Circus", "Clapham South"));
		solve(module, new LondonUndergroundInput(Action.SOLVE_STAGE, "Clapham South", "Walthamstow Central"));
		LondonUndergroundOutput finalJourney = solve(module,
			new LondonUndergroundInput(Action.SOLVE_STAGE, "Walthamstow Central", "Stonebridge Park"));

		assertThat(finalJourney.stage()).isEqualTo(3);
		assertThat(finalJourney.journey()).containsExactly(
			new LondonUndergroundLeg("Victoria", "Oxford Circus"),
			new LondonUndergroundLeg("Bakerloo", "Stonebridge Park")
		);
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState().get("departures"))
			.isEqualTo(List.of("Oxford Circus", "Clapham South", "Walthamstow Central"));
		assertThat(module.getState().get("destinations"))
			.isEqualTo(List.of("Clapham South", "Walthamstow Central", "Stonebridge Park"));
	}

	@SuppressWarnings("unchecked")
	private LondonUndergroundOutput solve(ModuleEntity module, LondonUndergroundInput input) {
		return ((SolveSuccess<LondonUndergroundOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), module, input
		)).output();
	}
}
