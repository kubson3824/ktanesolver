package ktanesolver.module.modded.regular.perspectivepegs;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

class PerspectivePegsSolverTest {

	private final PerspectivePegsSolver solver = new PerspectivePegsSolver();

	@Test
	void catalogUsesPerspectivePegsMetadata() {
		ModuleInfo info = PerspectivePegsSolver.class.getAnnotation(ModuleInfo.class);

		assertThat(info).isNotNull();
		assertThat(info.name()).isEqualTo("Perspective Pegs");
		assertThat(info.type()).isEqualTo(ModuleType.PERSPECTIVE_PEGS);
		assertThat(info.id()).isEqualTo("perspective-pegs");
	}

	@Test
	void solveFindsKeySequenceInUpperRightViewForReportedFailureCase() {
		PerspectivePegsOutput output = solve(
			bomb("AB12", 0, 0),
			new PerspectivePegsInput(List.of(
				new PerspectivePegsInput.Peg(List.of("Red", "Purple", "Red", "Blue", "Red")),
				new PerspectivePegsInput.Peg(List.of("Blue", "Red", "Blue", "Yellow", "Blue")),
				new PerspectivePegsInput.Peg(List.of("Yellow", "Purple", "Purple", "Red", "Purple")),
				new PerspectivePegsInput.Peg(List.of("Yellow", "Blue", "Yellow", "Yellow", "Blue")),
				new PerspectivePegsInput.Peg(List.of("Green", "Green", "Green", "Green", "Blue"))
			))
		);

		assertThat(output.keyColor()).isEqualTo("Green");
		assertThat(output.currentSequence()).containsExactly("Blue", "Red", "Green", "Yellow", "Blue");
		assertThat(output.keySequence()).containsExactly("Blue", "Red", "Green");
	}

	@Test
	void solveRejectsInputsWithoutExactlyFivePegs() {
		ModuleEntity module = module();
		SolveResult<PerspectivePegsOutput> result = solver.solve(
			new RoundEntity(),
			bomb("AB12", 0, 0),
			module,
			new PerspectivePegsInput(List.of())
		);

		assertThat(result).isInstanceOf(SolveFailure.class);
		assertThat(((SolveFailure<PerspectivePegsOutput>) result).getReason())
			.isEqualTo("Exactly 5 pegs are required in clockwise order.");
		assertThat(module.isSolved()).isFalse();
	}

	private PerspectivePegsOutput solve(BombEntity bomb, PerspectivePegsInput input) {
		ModuleEntity module = module();
		SolveResult<PerspectivePegsOutput> result = solver.solve(new RoundEntity(), bomb, module, input);

		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(module.isSolved()).isTrue();

		return ((SolveSuccess<PerspectivePegsOutput>) result).output();
	}

	private static BombEntity bomb(String serialNumber, int aaBatteryCount, int dBatteryCount) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serialNumber);
		bomb.setAaBatteryCount(aaBatteryCount);
		bomb.setDBatteryCount(dBatteryCount);
		bomb.setIndicators(new HashMap<>());
		return bomb;
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.PERSPECTIVE_PEGS);
		module.setSolution(new HashMap<>());
		module.setState(new HashMap<>());
		return module;
	}
}
