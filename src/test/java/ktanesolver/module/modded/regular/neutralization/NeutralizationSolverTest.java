package ktanesolver.module.modded.regular.neutralization;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class NeutralizationSolverTest {
	private final NeutralizationSolver solver = new NeutralizationSolver();

	@Test
	void followsTheOrderedBaseRules() {
		BombEntity nsa = bomb("BCDF12");
		nsa.setAaBatteryCount(2); nsa.setDBatteryCount(1); nsa.setIndicators(Map.of("NSA", false, "CAR", true));
		assertThat(solve(nsa, "RED", 10).baseFormula()).isEqualTo("NH3");

		BombEntity lit = bomb("BCDF12");
		lit.setIndicators(Map.of("CAR", true));
		assertThat(solve(lit, "RED", 10).baseFormula()).isEqualTo("KOH");

		assertThat(solve(bomb("ABC123"), "RED", 10).baseFormula()).isEqualTo("LiOH");

		BombEntity commonLetter = bomb("BCDF12");
		commonLetter.setIndicators(Map.of("BOB", false)); commonLetter.replacePortPlates(List.of(Set.of(PortType.DVI)));
		assertThat(solve(commonLetter, "RED", 10).baseFormula()).isEqualTo("KOH");

		BombEntity dBatteries = bomb("BCDF12");
		dBatteries.setDBatteryCount(1); dBatteries.replacePortPlates(List.of(Set.of(PortType.DVI)));
		assertThat(solve(dBatteries, "RED", 10).baseFormula()).isEqualTo("NH3");

		BombEntity lowAnion = bomb("BCDF12");
		lowAnion.replacePortPlates(List.of(Set.of(PortType.DVI)));
		assertThat(solve(lowAnion, "GREEN", 10).baseFormula()).isEqualTo("NaOH");
		assertThat(solve(lowAnion, "BLUE", 10).baseFormula()).isEqualTo("LiOH");
	}

	@Test
	void calculatesConcentrationsDropsFilterAndSouvenirFacts() {
		BombEntity bomb = bomb("BCDF12");
		bomb.setIndicators(Map.of("CAR", true));
		ModuleEntity module = new ModuleEntity();
		NeutralizationOutput output = solve(bomb, module, "BLUE", 15);

		assertThat(output).isEqualTo(new NeutralizationOutput("HI", "Potassium hydroxide", "KOH", 0.6, 20, 9, false));
		assertThat(module.getState()).containsEntry("acidColor", "BLUE").containsEntry("acidVolume", 15);
		assertThat(solver.solve(new RoundEntity(), bomb, new ModuleEntity(), new NeutralizationInput("purple", 12)))
			.isInstanceOf(SolveFailure.class);
	}

	private NeutralizationOutput solve(BombEntity bomb, String color, int volume) {
		return solve(bomb, new ModuleEntity(), color, volume);
	}

	@SuppressWarnings("unchecked")
	private NeutralizationOutput solve(BombEntity bomb, ModuleEntity module, String color, int volume) {
		return ((SolveSuccess<NeutralizationOutput>) solver.solve(
			new RoundEntity(), bomb, module, new NeutralizationInput(color, volume))).output();
	}

	private static BombEntity bomb(String serial) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setIndicators(new HashMap<>());
		return bomb;
	}
}
