package ktanesolver.module.modded.regular.fizzbuzz;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.fizzbuzz.FizzBuzzInput.Color;
import ktanesolver.module.modded.regular.fizzbuzz.FizzBuzzInput.Display;
import ktanesolver.module.modded.regular.fizzbuzz.FizzBuzzOutput.Action;

class FizzBuzzSolverTest {
	private final FizzBuzzSolver solver = new FizzBuzzSolver();

	@Test
	void combinesEdgeworkAndReplacesTheNoneOffsetAtTwoStrikes() {
		BombEntity plain = bomb("ABCD12", 0, 0, 0);
		assertThat(solve(plain, displays(new Display("0000000", Color.GREEN))).actions().getFirst())
			.isEqualTo(Action.NUMBER);

		plain.setStrikes(2);
		assertThat(solve(plain, displays(new Display("0000000", Color.GREEN))).actions().getFirst())
			.isEqualTo(Action.FIZZ);

		BombEntity allEdgework = bomb("ABC123", 4, 1, 2);
		allEdgework.replacePortPlates(List.of(Set.of(PortType.SERIAL, PortType.PARALLEL, PortType.DVI, PortType.STEREO_RCA)));
		FizzBuzzOutput output = solve(allEdgework, List.of(
			new Display("0000000", Color.RED),
			new Display("0000000", Color.YELLOW),
			new Display("0000008", Color.WHITE)
		));
		assertThat(output.actions()).containsExactly(Action.FIZZ, Action.FIZZBUZZ, Action.BUZZ);
	}

	@Test
	void validatesAllThreeSevenDigitDisplays() {
		ModuleEntity module = module();
		assertThat(solver.solve(new RoundEntity(), bomb("ABC123", 0, 0, 0), module,
			new FizzBuzzInput(List.of(new Display("123", Color.RED)))))
			.isInstanceOf(SolveFailure.class);
	}

	private FizzBuzzOutput solve(BombEntity bomb, List<Display> displays) {
		return ((SolveSuccess<FizzBuzzOutput>) solver.solve(
			new RoundEntity(), bomb, module(), new FizzBuzzInput(displays))).output();
	}

	private static List<Display> displays(Display display) {
		return List.of(display, new Display("0000000", Color.BLUE), new Display("0000000", Color.WHITE));
	}

	private static BombEntity bomb(String serial, int aa, int d, int strikes) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setAaBatteryCount(aa);
		bomb.setDBatteryCount(d);
		bomb.setStrikes(strikes);
		return bomb;
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.FIZZ_BUZZ);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}
}
