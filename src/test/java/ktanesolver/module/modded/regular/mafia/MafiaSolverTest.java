package ktanesolver.module.modded.regular.mafia;

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
import ktanesolver.module.modded.regular.mafia.MafiaInput.Suspect;

class MafiaSolverTest {
	private static final List<Suspect> PLAYERS = List.of(
		Suspect.ROB, Suspect.TIM, Suspect.MARY, Suspect.BRIANE,
		Suspect.HUNTER, Suspect.MACY, Suspect.JOHN, Suspect.WILL
	);
	private final MafiaSolver solver = new MafiaSolver();

	@Test
	void followsTheClockwiseEliminationAndRecordsSouvenirPlayers() {
		ModuleEntity module = module();
		MafiaOutput output = solve(module, Map.of());

		assertThat(output).isEqualTo(new MafiaOutput(Suspect.MARY, Suspect.MARY,
			List.of(Suspect.ROB, Suspect.HUNTER, Suspect.TIM, Suspect.JOHN, Suspect.MACY, Suspect.WILL, Suspect.BRIANE)));
		assertThat(module.getState()).containsEntry("players", PLAYERS).containsEntry("godfather", Suspect.MARY);
	}

	@Test
	void reversesDirectionAtTwoIndicatorsAndAppliesTheSameSideRule() {
		MafiaOutput output = solve(module(), Map.of("CAR", false, "FRK", false));

		assertThat(output.lastRemaining()).isEqualTo(Suspect.JOHN);
		assertThat(output.godfather()).isEqualTo(Suspect.WILL);
	}

	private MafiaOutput solve(ModuleEntity module, Map<String, Boolean> indicators) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("ABC123");
		bomb.setIndicators(new HashMap<>(indicators));
		bomb.setModules(List.of(module));
		MafiaInput input = new MafiaInput(PLAYERS, 5, List.of(), 0, false, false, false, false, false);
		return ((SolveSuccess<MafiaOutput>) solver.solve(new RoundEntity(), bomb, module, input)).output();
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.MAFIA);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
