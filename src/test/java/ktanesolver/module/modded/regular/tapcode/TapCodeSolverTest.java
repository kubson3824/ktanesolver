package ktanesolver.module.modded.regular.tapcode;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;

import org.junit.jupiter.api.Test;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

class TapCodeSolverTest {

	private final TapCodeSolver solver = new TapCodeSolver();

	@Test
	void usesTheCanonicalModuleId() {
		ModuleInfo info = TapCodeSolver.class.getAnnotation(ModuleInfo.class);

		assertThat(info.id()).isEqualTo("tapCode");
		assertThat(info.type()).isEqualTo(ModuleType.TAP_CODE);
	}

	@Test
	void movesInEachSerialDirectionAndWraps() {
		assertThat(solve("child", "AB1C23").solutionWord()).isEqualTo("funny");
		assertThat(solve("child", "12ABC4").solutionWord()).isEqualTo("cover");
		assertThat(solve("child", "A1BCD2").solutionWord()).isEqualTo("cheat");
		assertThat(solve("child", "1ABCD2").solutionWord()).isEqualTo("shake");
	}

	@Test
	void sumsSerialDigitsWhenTheSerialContainsZero() {
		assertThat(solve("child", "A0B123").solutionWord()).isEqualTo("axion");
	}

	@Test
	void encodesTheSolutionAndSubstitutesCForK() {
		TapCodeOutput output = solve("shake", "ABCD00");

		assertThat(output.solutionWord()).isEqualTo("shake");
		assertThat(output.tapCode()).containsExactly("43", "23", "11", "13", "15");
	}

	@Test
	void rejectsWordsOutsideTheManualTable() {
		ModuleEntity module = module();
		SolveResult<TapCodeOutput> result = solver.solve(
			new RoundEntity(), bomb("ABCD12"), module, new TapCodeInput("hello")
		);

		assertThat(result).isInstanceOf(SolveFailure.class);
		assertThat(module.isSolved()).isFalse();
	}

	private TapCodeOutput solve(String receivedWord, String serial) {
		ModuleEntity module = module();
		SolveResult<TapCodeOutput> result = solver.solve(
			new RoundEntity(), bomb(serial), module, new TapCodeInput(receivedWord)
		);

		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(module.getState()).containsEntry("receivedWord", receivedWord);
		return ((SolveSuccess<TapCodeOutput>) result).output();
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.TAP_CODE);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		return module;
	}

	private static BombEntity bomb(String serial) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		return bomb;
	}
}
