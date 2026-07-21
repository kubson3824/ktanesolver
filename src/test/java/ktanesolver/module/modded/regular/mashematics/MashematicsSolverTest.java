package ktanesolver.module.modded.regular.mashematics;

import static ktanesolver.module.modded.regular.mashematics.MashematicsInput.Operator.ADD;
import static ktanesolver.module.modded.regular.mashematics.MashematicsInput.Operator.MULTIPLY;
import static ktanesolver.module.modded.regular.mashematics.MashematicsInput.Operator.SUBTRACT;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class MashematicsSolverTest {
	private final MashematicsSolver solver = new MashematicsSolver();

	@Test
	void appliesPrecedenceAndNormalizesBothDirections() {
		assertThat(solve(new MashematicsInput(10, ADD, 20, MULTIPLY, 3)))
			.isEqualTo(new MashematicsOutput(70, 70));
		assertThat(solve(new MashematicsInput(90, MULTIPLY, 2, ADD, 30)))
			.isEqualTo(new MashematicsOutput(210, 60));
		assertThat(solve(new MashematicsInput(5, SUBTRACT, 20, SUBTRACT, 41)))
			.isEqualTo(new MashematicsOutput(-56, 44));
	}

	@SuppressWarnings("unchecked")
	private MashematicsOutput solve(MashematicsInput input) {
		ModuleEntity module = new ModuleEntity();
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		MashematicsOutput output = ((SolveSuccess<MashematicsOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), module, input)).output();
		assertThat(module.getState().get("numbers")).isEqualTo(List.of(input.first(), input.second(), input.third()));
		return output;
	}
}
