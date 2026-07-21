package ktanesolver.module.modded.regular.sonicthehedgehog;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class SonicTheHedgehogSolverTest {
	private static final List<String> FALLBACK_SOUNDS = List.of("Breathe", "Bumper", "Skid", "Jump");
	private final SonicTheHedgehogSolver solver = new SonicTheHedgehogSolver();

	@Test
	void solvesAllThreeLevelsInOrderAndRecordsExactSouvenirFacts() {
		ModuleEntity module = new ModuleEntity();
		assertThat(solve(module, 1, FALLBACK_SOUNDS, "Ballhog"))
			.isEqualTo(new SonicTheHedgehogOutput(1, "Rg", "Rings"));
		assertThat(module.isSolved()).isFalse();
		assertThat(solve(module, 2, FALLBACK_SOUNDS, "Annoyed Sonic"))
			.isEqualTo(new SonicTheHedgehogOutput(2, "In", "Invincibility"));
		assertThat(solve(module, 3, FALLBACK_SOUNDS, "Blue Lamppost"))
			.isEqualTo(new SonicTheHedgehogOutput(3, "In", "Invincibility"));
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState()).containsEntry("sounds", FALLBACK_SOUNDS)
			.containsEntry("pictures", List.of("Ballhog", "Annoyed Sonic", "Blue Lamppost"));
	}

	@Test
	void appliesEveryConditionInPriorityOrder() {
		assertThat(SonicTheHedgehogSolver.levelOneCondition(List.of("Boss", "Breathe", "Bumper", "Drown"))).isZero();
		assertThat(SonicTheHedgehogSolver.levelOneCondition(List.of("Breathe", "Breathe", "Bumper", "Drown"))).isEqualTo(1);
		assertThat(SonicTheHedgehogSolver.levelOneCondition(List.of("Emerald", "Breathe", "Bumper", "Drown"))).isEqualTo(2);
		assertThat(SonicTheHedgehogSolver.levelOneCondition(FALLBACK_SOUNDS)).isEqualTo(3);

		assertThat(SonicTheHedgehogSolver.levelTwoCondition(List.of("Breathe", "Bumper", "Extra Life", "Jump"), "Buzz Bomber")).isZero();
		assertThat(SonicTheHedgehogSolver.levelTwoCondition(List.of("Breathe", "Lamppost", "Skid", "Jump"), "Buzz Bomber")).isEqualTo(1);
		assertThat(SonicTheHedgehogSolver.levelTwoCondition(List.of("Spin", "Bumper", "Skid", "Jump"), "Buzz Bomber")).isEqualTo(2);
		assertThat(SonicTheHedgehogSolver.levelTwoCondition(FALLBACK_SOUNDS, "Moto Bug")).isEqualTo(3);
		assertThat(SonicTheHedgehogSolver.levelTwoCondition(List.of("Breathe", "Bumper", "Spikes", "Jump"), "Buzz Bomber")).isEqualTo(4);
		assertThat(SonicTheHedgehogSolver.levelTwoCondition(List.of("Breathe", "Bumper", "Drown", "Jump"), "Buzz Bomber")).isEqualTo(5);
		assertThat(SonicTheHedgehogSolver.levelTwoCondition(List.of("Breathe", "Emerald", "Skid", "Jump"), "Buzz Bomber")).isEqualTo(6);
		assertThat(SonicTheHedgehogSolver.levelTwoCondition(FALLBACK_SOUNDS, "Buzz Bomber")).isEqualTo(7);

		assertThat(SonicTheHedgehogSolver.levelThreeCondition(List.of("Breathe", "Bumper", "Invincibility", "Jump"), "Buzz Bomber", "Dead Sonic")).isZero();
		assertThat(SonicTheHedgehogSolver.levelThreeCondition(FALLBACK_SOUNDS, "Buzz Bomber", "Annoyed Sonic")).isEqualTo(1);
		assertThat(SonicTheHedgehogSolver.levelThreeCondition(FALLBACK_SOUNDS, "Buzz Bomber", "Drowned Sonic")).isEqualTo(2);
		assertThat(SonicTheHedgehogSolver.levelThreeCondition(List.of("Breathe", "Boss", "Spikes", "Jump"), "Buzz Bomber", "Dead Sonic")).isEqualTo(3);
		assertThat(SonicTheHedgehogSolver.levelThreeCondition(FALLBACK_SOUNDS, "Ballhog", "Dead Sonic")).isEqualTo(4);
		assertThat(SonicTheHedgehogSolver.levelThreeCondition(List.of("Breathe", "Skid", "Spikes", "Jump"), "Buzz Bomber", "Dead Sonic")).isEqualTo(5);
		assertThat(SonicTheHedgehogSolver.levelThreeCondition(FALLBACK_SOUNDS, "Buzz Bomber", "Falling Sonic")).isEqualTo(6);
		assertThat(SonicTheHedgehogSolver.levelThreeCondition(List.of("Breathe", "Drown", "Bumper", "Skid"), "Buzz Bomber", "Dead Sonic")).isEqualTo(7);
		assertThat(SonicTheHedgehogSolver.levelThreeCondition(List.of("Breathe", "Lamppost", "Skid", "Jump"), "Buzz Bomber", "Standing Sonic")).isEqualTo(8);
		assertThat(SonicTheHedgehogSolver.levelThreeCondition(List.of("Breathe", "Bumper", "Skid", "Spring"), "Buzz Bomber", "Dead Sonic")).isEqualTo(9);
		assertThat(SonicTheHedgehogSolver.levelThreeCondition(FALLBACK_SOUNDS, "Burrobot", "Dead Sonic")).isEqualTo(10);
		assertThat(SonicTheHedgehogSolver.levelThreeCondition(FALLBACK_SOUNDS, "Buzz Bomber", "Dead Sonic")).isEqualTo(11);
	}

	@Test
	void aReplacementFirstLevelOverwritesTheStruckAttempt() {
		ModuleEntity module = new ModuleEntity();
		solve(module, 1, FALLBACK_SOUNDS, "Ballhog");
		solve(module, 2, FALLBACK_SOUNDS, "Dead Sonic");
		List<String> replacementSounds = List.of("Boss", "Boss", "Boss", "Boss");

		solve(module, 1, replacementSounds, "Moto Bug");

		assertThat(module.getState()).containsEntry("sounds", replacementSounds)
			.containsEntry("pictures", List.of("Moto Bug"));
	}

	@Test
	void rejectsInvalidAndOutOfOrderInputWithoutChangingState() {
		ModuleEntity module = new ModuleEntity();
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module,
			new SonicTheHedgehogInput(2, FALLBACK_SOUNDS, "Annoyed Sonic"))).isInstanceOf(SolveFailure.class);
		assertThat(module.getState()).isEmpty();
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module,
			new SonicTheHedgehogInput(1, List.of("Unknown", "Breathe", "Bumper", "Jump"), "Ballhog")))
			.isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module,
			new SonicTheHedgehogInput(1, FALLBACK_SOUNDS, "Annoyed Sonic"))).isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module, null)).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private SonicTheHedgehogOutput solve(ModuleEntity module, int stage, List<String> sounds, String picture) {
		return ((SolveSuccess<SonicTheHedgehogOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), module, new SonicTheHedgehogInput(stage, sounds, picture))).output();
	}
}
