package ktanesolver.module.modded.regular.painting;

import static org.assertj.core.api.Assertions.assertThat;

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
import ktanesolver.module.modded.regular.painting.PaintingInput.Cell;

class PaintingSolverTest {
	private final PaintingSolver solver = new PaintingSolver();

	@Test
	void followsRulePriorityAndColorSwaps() {
		BombEntity ruleA = bomb(2, Map.of("SIG", false), List.of(Set.of(
			PortType.DVI, PortType.PARALLEL, PortType.PS2, PortType.RJ45, PortType.SERIAL
		)));
		PaintingOutput ruleAResult = solve(ruleA);
		assertThat(ruleAResult.ruleset()).isEqualTo("Tritanopia");
		assertThat(ruleAResult.repaints()).extracting(PaintingOutput.Repaint::to)
			.containsExactly("GRAY", "BLUE", "BLACK", "PURPLE", "BLUE", "RED", "ORANGE");

		assertThat(solve(bomb(0, Map.of("SIG", false), List.of())).ruleset()).isEqualTo("Tritanopia");
		assertThat(solve(new BombEntity()).ruleset()).isEqualTo("Protanomaly");
	}

	@Test
	void appliesTheCreativityExceptionBeforeOtherRules() {
		BombEntity bomb = bomb(6, Map.of("CLR", true), List.of(
			Set.of(PortType.DVI, PortType.RJ45), Set.of(PortType.DVI)
		));
		PaintingOutput output = solve(bomb);
		assertThat(output.creativityRule()).isTrue();
		assertThat(output.repaints()).hasSize(9).allSatisfy(repaint -> assertThat(repaint.to()).isNotEqualTo(repaint.from()));
	}

	@Test
	void rejectsIncompletePaintings() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new PaintingInput(List.of())))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private PaintingOutput solve(BombEntity bomb) {
		PaintingInput input = new PaintingInput(List.of(
			cell("A", "BLUE"), cell("B", "GRAY"), cell("C", "PURPLE"),
			cell("D", "BLACK"), cell("E", "GREEN"), cell("F", "ORANGE"),
			cell("G", "RED"), cell("H", "YELLOW"), cell("I", "PINK")
		));
		return ((SolveSuccess<PaintingOutput>) solver.solve(
			new RoundEntity(), bomb, new ModuleEntity(), input
		)).output();
	}

	private static Cell cell(String label, String color) {
		return new Cell(label, color);
	}

	private static BombEntity bomb(int batteries, Map<String, Boolean> indicators, List<Set<PortType>> ports) {
		BombEntity bomb = new BombEntity();
		bomb.setAaBatteryCount(batteries);
		bomb.setIndicators(indicators);
		bomb.replacePortPlates(ports);
		return bomb;
	}
}
