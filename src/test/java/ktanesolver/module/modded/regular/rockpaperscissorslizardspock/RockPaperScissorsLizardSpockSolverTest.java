package ktanesolver.module.modded.regular.rockpaperscissorslizardspock;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;

class RockPaperScissorsLizardSpockSolverTest {
	private final RockPaperScissorsLizardSpockSolver solver = new RockPaperScissorsLizardSpockSolver();

	@Test
	void followsRowPrioritySkipsDecoyWinnersAndFallsBack() {
		assertThat(solve(bomb("RRR123", Map.of(), List.of()), null))
			.extracting(RockPaperScissorsLizardSpockOutput::targetSign, RockPaperScissorsLizardSpockOutput::signsToPress, RockPaperScissorsLizardSpockOutput::scoringRule)
			.containsExactly("ROCK", List.of("PAPER", "SPOCK"), "serial number letters");

		assertThat(solve(bomb("XY", Map.of("FRK", true), List.of(Set.of(PortType.DVI))), "LIZARD"))
			.extracting(RockPaperScissorsLizardSpockOutput::targetSign, RockPaperScissorsLizardSpockOutput::signsToPress, RockPaperScissorsLizardSpockOutput::scoringRule)
			.containsExactly("ROCK", List.of("PAPER", "SPOCK"), "lit indicators");

		assertThat(solve(bomb("XY", Map.of("TRN", true), List.of(Set.of(PortType.PS2))), "PAPER"))
			.extracting(RockPaperScissorsLizardSpockOutput::targetSign, RockPaperScissorsLizardSpockOutput::signsToPress, RockPaperScissorsLizardSpockOutput::scoringRule)
			.containsExactly(null, List.of("ROCK", "SCISSORS", "LIZARD", "SPOCK"), "no applicable scoring row");
	}

	private RockPaperScissorsLizardSpockOutput solve(BombEntity bomb, String decoy) {
		var result = (SolveSuccess<RockPaperScissorsLizardSpockOutput>)solver.solve(
			new RoundEntity(), bomb, new ModuleEntity(), new RockPaperScissorsLizardSpockInput(decoy));
		return result.output();
	}

	private static BombEntity bomb(String serial, Map<String, Boolean> indicators, List<Set<PortType>> ports) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setIndicators(indicators);
		bomb.replacePortPlates(ports);
		return bomb;
	}
}
