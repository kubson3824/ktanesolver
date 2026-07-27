package ktanesolver.module.modded.regular.errorcodes;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class ErrorCodesSolverTest {
	private final ErrorCodesSolver solver = new ErrorCodesSolver();

	@Test
	void selectsAndFormatsTheActiveCodeForEveryEdgeworkBranch() {
		List<String> codes = List.of("30", "20", "10", "0a");

		assertThat(solve(bomb("A1BC23", 2), codes))
			.isEqualTo(new ErrorCodesOutput("30", 53, "Decimal", "053"));
		assertThat(solve(bomb("A1BC23", 1), codes))
			.isEqualTo(new ErrorCodesOutput("20", 69, "Octal", "105"));
		assertThat(solve(bomb("Z1BC23", 2), codes))
			.isEqualTo(new ErrorCodesOutput("10", 85, "Hexadecimal", "55"));
		assertThat(solve(bomb("Z1BC23", 1), codes))
			.isEqualTo(new ErrorCodesOutput("0A", 91, "Binary", "1011011"));
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
			new ErrorCodesInput(List.of("00", "01", "02", "FF")))).isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private ErrorCodesOutput solve(BombEntity bomb, List<String> codes) {
		return ((SolveSuccess<ErrorCodesOutput>) solver.solve(
			new RoundEntity(), bomb, new ModuleEntity(), new ErrorCodesInput(codes))).output();
	}

	private static BombEntity bomb(String serial, int batteries) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setAaBatteryCount(batteries);
		return bomb;
	}
}
