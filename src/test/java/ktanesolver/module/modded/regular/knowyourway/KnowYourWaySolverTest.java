package ktanesolver.module.modded.regular.knowyourway;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class KnowYourWaySolverTest {
	private final KnowYourWaySolver solver = new KnowYourWaySolver();

	@Test
	void followsAllFourManualTablesAndRecordsSouvenirFacts() {
		ModuleEntity module = module();
		SolveSuccess<KnowYourWayOutput> result = solve(module, new KnowYourWayInput("up", "U", "U"));
		assertThat(result.output()).isEqualTo(new KnowYourWayOutput(
			List.of("D", "R", "R", "U"),
			List.of("RIGHT", "LEFT", "UP", "DOWN"),
			List.of("LEFT", "UP", "RIGHT", "DOWN")));
		assertThat(module.getState()).containsEntry("arrowDirection", "Up").containsEntry("greenLed", "Top");
	}

	@Test
	void everyObservationProducesFourValidButtonLabels() {
		for (String led : List.of("UP", "LEFT", "DOWN", "RIGHT"))
			for (String arrow : List.of("UP", "LEFT", "DOWN", "RIGHT"))
				for (String upper : List.of("U", "L", "D", "R")) {
					KnowYourWayOutput output = solve(module(), new KnowYourWayInput(led, arrow, upper)).output();
					assertThat(output.presses()).hasSize(4).allMatch("ULDR"::contains);
					assertThat(output.indications()).hasSize(4).allMatch(List.of("UP", "LEFT", "DOWN", "RIGHT")::contains);
					assertThat(output.orientations()).hasSize(4).allMatch(List.of("UP", "LEFT", "DOWN", "RIGHT")::contains);
				}
	}

	@Test
	void rejectsInvalidObservations() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(),
			new KnowYourWayInput("north", "UP", "U"))).isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(),
			new KnowYourWayInput("UP", "UP", "X"))).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SolveSuccess<KnowYourWayOutput> solve(ModuleEntity module, KnowYourWayInput input) {
		return (SolveSuccess<KnowYourWayOutput>) solver.solve(new RoundEntity(), new BombEntity(), module, input);
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.KNOW_YOUR_WAY);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
