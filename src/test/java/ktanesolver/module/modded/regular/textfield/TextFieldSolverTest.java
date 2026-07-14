package ktanesolver.module.modded.regular.textfield;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.textfield.TextFieldOutput.Position;

class TextFieldSolverTest {
	private final TextFieldSolver solver = new TextFieldSolver();

	@Test
	void usesTheFirstMatchingEdgeworkRuleAndReturnsEveryMatchingPosition() {
		BombEntity bomb = bomb("ABC124", 4, Map.of("CLR", true), Set.of(PortType.DVI));
		ModuleEntity module = module();
		assertThat(output(solver.solve(new RoundEntity(), bomb, module, new TextFieldInput("A"))))
			.isEqualTo(new TextFieldOutput("1459", List.of(new Position(2, 1))));
		assertThat(module.getState()).containsEntry("displayedLetter", "A");
		assertThat(solve(bomb, "C")).isEqualTo(new TextFieldOutput("AA12", List.of(new Position(2, 3), new Position(4, 3))));

		bomb = bomb("BCD124", 2, Map.of("SIG", true), Set.of(PortType.SERIAL));
		assertThat(solve(bomb, "D")).isEqualTo(new TextFieldOutput("BBFF", List.of(new Position(1, 1), new Position(1, 2))));

		module = module();
		assertThat(solver.solve(new RoundEntity(), bomb, module, new TextFieldInput("G"))).isInstanceOf(SolveFailure.class);
	}

	private TextFieldOutput solve(BombEntity bomb, String letter) {
		return output(solver.solve(new RoundEntity(), bomb, module(), new TextFieldInput(letter)));
	}

	@SuppressWarnings("unchecked")
	private static TextFieldOutput output(SolveResult<TextFieldOutput> result) {
		return ((SolveSuccess<TextFieldOutput>) result).output();
	}

	private static BombEntity bomb(String serial, int batteries, Map<String, Boolean> indicators, Set<PortType> ports) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setAaBatteryCount(batteries);
		bomb.setIndicators(new HashMap<>(indicators));
		PortPlateEntity plate = new PortPlateEntity();
		plate.setPorts(ports);
		bomb.getPortPlates().add(plate);
		return bomb;
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.TEXT_FIELD);
		return module;
	}
}
