package ktanesolver.module.modded.regular.yahtzee;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class YahtzeeSolverTest {
	private final YahtzeeSolver solver = new YahtzeeSolver();

	@Test
	void appliesFirstRollCategoriesAndEdgeworkPriorities() {
		BombEntity serial = bomb("AB4CD6");
		assertThat(solve(serial, module(), 1, 2, 3, 4, 5).keepColors()).containsExactly("WHITE");
		assertThat(solve(bomb("ABC123"), module(), 1, 2, 3, 4, 6).keepColors()).containsExactly("BLACK");

		BombEntity indicators = bomb("ABC123");
		indicators.setIndicators(Map.of("CAR", true, "FRK", true));
		assertThat(solve(indicators, module(), 2, 2, 2, 5, 4).keepColors()).containsExactly("WHITE");

		BombEntity batteries = bomb("ABC123");
		batteries.setAaBatteryCount(2);
		batteries.setDBatteryCount(1);
		assertThat(solve(batteries, module(), 3, 2, 3, 4, 4).keepColors()).containsExactly("PURPLE", "BLUE");

		BombEntity ports = bomb("ABC123");
		ports.setPortPlates(List.of(plate(PortType.PARALLEL)));
		assertThat(solve(ports, module(), 6, 2, 3, 4, 2).keepColors()).containsExactly("PURPLE");
		assertThat(solve(bomb("ABC123"), module(), 1, 3, 5, 2, 6).action()).isEqualTo("ROLL_ALL");
	}

	@Test
	void followsLaterRollRulesAndPreservesKeptDice() {
		BombEntity bomb = bomb("ABC123");
		ModuleEntity module = module();
		assertThat(solve(bomb, module, 3, 5, 2, 2, 6).keepColors()).containsExactly("YELLOW");
		assertThat(solve(bomb, module, 1, 5, 2, 3, 4).keepColors()).containsExactly("PURPLE");

		assertThat(solver.solve(new RoundEntity(), bomb, module, new YahtzeeInput(List.of(2, 6, 2, 3, 4))))
			.isInstanceOf(SolveFailure.class);

		BombEntity duplicatePorts = bomb("ABC123");
		duplicatePorts.setPortPlates(List.of(plate(PortType.SERIAL), plate(PortType.SERIAL)));
		ModuleEntity fullHouse = module();
		fullHouse.getState().putAll(Map.of(
			"rollNumber", 1,
			"nextRollCount", 3,
			"dice", List.of(2, 2, 4, 5, 6),
			"keptColors", List.of("PURPLE", "YELLOW")
		));
		assertThat(solve(duplicatePorts, fullHouse, 2, 2, 4, 4, 4).keepColors())
			.containsExactly("BLUE", "WHITE", "BLACK");
	}

	@Test
	void recordsTheInitialCategoryAndSolvesOnYahtzee() {
		ModuleEntity module = module();
		YahtzeeOutput output = solve(bomb("ABC123"), module, 4, 4, 4, 4, 4);

		assertThat(output.action()).isEqualTo("SOLVED");
		assertThat(module.isSolved()).isTrue();
		assertThat(module.getState()).containsEntry("initialRollCategory", "yahtzee");
	}

	@SuppressWarnings("unchecked")
	private YahtzeeOutput solve(BombEntity bomb, ModuleEntity module, Integer... dice) {
		return ((SolveSuccess<YahtzeeOutput>) solver.solve(
			new RoundEntity(), bomb, module, new YahtzeeInput(List.of(dice))
		)).output();
	}

	private static BombEntity bomb(String serial) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		return bomb;
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.YAHTZEE);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}

	private static PortPlateEntity plate(PortType... ports) {
		PortPlateEntity plate = new PortPlateEntity();
		plate.setPorts(new LinkedHashSet<>(List.of(ports)));
		return plate;
	}
}
