package ktanesolver.module.modded.regular.monsplodefight;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveSuccess;

class MonsplodeFightSolverTest {
	private final MonsplodeFightSolver solver = new MonsplodeFightSolver();

	@Test
	void choosesHighestNetDamageAndAppliesMoveRules() {
		BombEntity bomb = bomb("ABO0D9", 0, 0);
		MonsplodeFightOutput output = solve(bomb, new MonsplodeFightInput(
			"Buhar", List.of("Cave In", "Battery Power", "Boo", "Tac"), null));

		assertThat(output.move()).isEqualTo("Boo");
		assertThat(output.netDamage()).isEqualTo(6);
	}

	@Test
	void opponentOverridesAndLowestDamageAreHonored() {
		BombEntity bomb = bomb("ABC123", 0, 0);
		assertThat(solve(bomb, new MonsplodeFightInput(
			"Pouse", List.of("Flame Spear", "Tac", "Candle", "Toe"), null)).move()).isEqualTo("Tac");
		assertThat(solve(bomb, new MonsplodeFightInput(
			"Cutie Pie", List.of("Tac", "Candle", "Tic", "Toe"), null)).move()).isEqualTo("Toe");
	}

	@Test
	void forcedMovesOverrideDamage() {
		BombEntity bomb = bomb("ABC123", 0, 0);
		assertThat(solve(bomb, new MonsplodeFightInput(
			"Docsplode", List.of("Tac", "Boom", "Tic", "Toe"), null)).move()).isEqualTo("Boom");
		assertThat(solve(bomb, new MonsplodeFightInput(
			"Percy", List.of("Tac", "Splash", "Tic", "Toe"), null)).move()).isEqualTo("Splash");
	}

	private MonsplodeFightOutput solve(BombEntity bomb, MonsplodeFightInput input) {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.MONSPLODE_FIGHT);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		bomb.getModules().add(module);
		return ((SolveSuccess<MonsplodeFightOutput>)solver.solve(new RoundEntity(), bomb, module, input)).output();
	}

	private static BombEntity bomb(String serial, int aa, int d) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setAaBatteryCount(aa);
		bomb.setDBatteryCount(d);
		bomb.setIndicators(new HashMap<>(Map.of()));
		return bomb;
	}
}
