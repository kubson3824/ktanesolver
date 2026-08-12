package ktanesolver.module.modded.regular.skinnywires;

import static ktanesolver.module.modded.regular.skinnywires.SkinnyWiresInput.LetterPort.A;
import static ktanesolver.module.modded.regular.skinnywires.SkinnyWiresInput.LetterPort.B;
import static ktanesolver.module.modded.regular.skinnywires.SkinnyWiresInput.LetterPort.C;
import static ktanesolver.module.modded.regular.skinnywires.SkinnyWiresInput.WireColor.BLACK;
import static ktanesolver.module.modded.regular.skinnywires.SkinnyWiresInput.WireColor.BLUE;
import static ktanesolver.module.modded.regular.skinnywires.SkinnyWiresInput.WireColor.GREEN;
import static ktanesolver.module.modded.regular.skinnywires.SkinnyWiresInput.WireColor.ORANGE;
import static ktanesolver.module.modded.regular.skinnywires.SkinnyWiresInput.WireColor.PINK;
import static ktanesolver.module.modded.regular.skinnywires.SkinnyWiresInput.WireColor.RED;
import static ktanesolver.module.modded.regular.skinnywires.SkinnyWiresInput.WireColor.WHITE;
import static ktanesolver.module.modded.regular.skinnywires.SkinnyWiresInput.WireColor.YELLOW;
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
import ktanesolver.module.modded.regular.skinnywires.SkinnyWiresInput.LetterPort;
import ktanesolver.module.modded.regular.skinnywires.SkinnyWiresInput.Wire;
import ktanesolver.module.modded.regular.skinnywires.SkinnyWiresInput.WireColor;

class SkinnyWiresSolverTest {
	private final SkinnyWiresSolver solver = new SkinnyWiresSolver();

	@Test
	void appliesTheFirstMatchingRule() {
		assertSolve(1, "A1", RED,
			wire(RED, A, 1), wire(BLACK, A, 2), wire(WHITE, B, 1), wire(GREEN, B, 2), wire(ORANGE, C, 3));
	}

	@Test
	void handlesPortAndAlphabeticalRules() {
		assertSolve(3, "A1", RED,
			wire(BLUE, A, 2), wire(GREEN, B, 2), wire(RED, A, 1), wire(WHITE, C, 3), wire(YELLOW, B, 3));
		assertSolve(4, "A1", PINK,
			wire(PINK, A, 1), wire(RED, A, 2), wire(RED, B, 1), wire(PINK, B, 2), wire(RED, C, 3));
		assertSolve(5, "A1", WHITE,
			wire(WHITE, A, 1), wire(WHITE, A, 2), wire(WHITE, A, 3), wire(RED, B, 1), wire(BLUE, C, 2));
	}

	@Test
	void handlesExclusiveAndFallbackPortRules() {
		assertSolve(8, "B2", WHITE,
			wire(BLACK, A, 1), wire(WHITE, B, 2), wire(GREEN, C, 3), wire(RED, B, 3), wire(PINK, C, 2));
		assertSolve(14, "A1", BLUE,
			wire(BLUE, A, 1), wire(RED, B, 2), wire(WHITE, B, 3), wire(BLACK, C, 2), wire(ORANGE, C, 3));
		assertSolve(15, "B3", RED,
			wire(GREEN, A, 1), wire(GREEN, B, 1), wire(WHITE, C, 1), wire(RED, B, 3), wire(PINK, C, 3));
	}

	@Test
	void rejectsMissingAndDuplicateConnections() {
		assertThat(solve(List.of(wire(RED, A, 1)))).isInstanceOf(SolveFailure.class);
		assertThat(solve(List.of(
			wire(RED, A, 1), wire(BLUE, A, 1), wire(GREEN, B, 1), wire(WHITE, B, 2), wire(YELLOW, C, 3)
		))).isInstanceOf(SolveFailure.class);
	}

	private void assertSolve(int rule, String coordinate, WireColor color, Wire... wires) {
		var result = solve(List.of(wires));
		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(((SolveSuccess<SkinnyWiresOutput>) result).output())
			.isEqualTo(new SkinnyWiresOutput(coordinate, color, rule));
	}

	private Object solve(List<Wire> wires) {
		return solver.solve(new RoundEntity(), new BombEntity(), module(), new SkinnyWiresInput(wires));
	}

	private static Wire wire(WireColor color, LetterPort letter, int number) {
		return new Wire(color, letter, number);
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.SKINNY_WIRES);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
