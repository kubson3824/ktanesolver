package ktanesolver.module.modded.regular.modulesagainsthumanity;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class ModulesAgainstHumanitySolverTest {
	private final ModulesAgainstHumanitySolver solver = new ModulesAgainstHumanitySolver();

	@Test
	void calculatesSecondaryAndEveryFinalRuleBranch() {
		BombEntity bomb = bomb("ZX9Q2B");
		ModuleEntity module = new ModuleEntity();

		ModulesAgainstHumanityOutput secondary = solve(bomb, module,
			new ModulesAgainstHumanityInput("Pop open the popcorn", "plain card", true, null, null));
		assertThat(secondary).isEqualTo(new ModulesAgainstHumanityOutput("SECONDARY", 2, 3, null, null));
		assertThat(module.isSolved()).isFalse();

		assertThat(solve(bomb, new ModuleEntity(), input(true, true, true)))
			.extracting(ModulesAgainstHumanityOutput::finalBlackPosition, ModulesAgainstHumanityOutput::finalWhitePosition)
			.containsExactly(9, 6);
		assertThat(solve(bomb, new ModuleEntity(), input(true, true, false)).finalWhitePosition()).isEqualTo(5);
		assertThat(solve(bomb, new ModuleEntity(), input(true, false, true)).finalBlackPosition()).isEqualTo(6);
		assertThat(solve(bomb, new ModuleEntity(), input(true, false, false)))
			.extracting(ModulesAgainstHumanityOutput::finalBlackPosition, ModulesAgainstHumanityOutput::finalWhitePosition)
			.containsExactly(3, 2);
		assertThat(solve(bomb, new ModuleEntity(), input(false, false, false)))
			.extracting(ModulesAgainstHumanityOutput::finalBlackPosition, ModulesAgainstHumanityOutput::finalWhitePosition)
			.containsExactly(3, 3);

		BombEntity mahSerial = bomb("M12XYZ");
		assertThat(solve(mahSerial, new ModuleEntity(), input(true, false, false)))
			.extracting(ModulesAgainstHumanityOutput::finalBlackPosition, ModulesAgainstHumanityOutput::finalWhitePosition)
			.containsExactly(3, 1);
	}

	@Test
	void validatesBothCardTextsAndPresenceAnswers() {
		BombEntity bomb = bomb("ZX9Q2B");
		assertThat(solver.solve(new RoundEntity(), bomb, new ModuleEntity(),
			new ModulesAgainstHumanityInput("", "white", true, null, null))).isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), bomb, new ModuleEntity(),
			new ModulesAgainstHumanityInput("black", "white", true, true, null))).isInstanceOf(SolveFailure.class);
	}

	private static ModulesAgainstHumanityInput input(boolean blackOnLeft, Boolean blackPresent, Boolean whitePresent) {
		return new ModulesAgainstHumanityInput("black card", "white card", blackOnLeft, blackPresent, whitePresent);
	}

	@SuppressWarnings("unchecked")
	private ModulesAgainstHumanityOutput solve(BombEntity bomb, ModuleEntity module, ModulesAgainstHumanityInput input) {
		return ((SolveSuccess<ModulesAgainstHumanityOutput>) solver.solve(new RoundEntity(), bomb, module, input)).output();
	}

	private static BombEntity bomb(String serial) {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber(serial);
		bomb.setAaBatteryCount(2);
		bomb.setDBatteryCount(0);
		bomb.setIndicators(Map.of("CAR", true, "FRK", false));
		PortPlateEntity first = new PortPlateEntity();
		first.setPorts(new LinkedHashSet<>(List.of(PortType.DVI, PortType.SERIAL)));
		PortPlateEntity second = new PortPlateEntity();
		second.setPorts(new LinkedHashSet<>(List.of(PortType.SERIAL, PortType.RJ45)));
		bomb.setPortPlates(List.of(first, second));
		ModuleEntity one = new ModuleEntity();
		one.setType(ModuleType.WIRES);
		ModuleEntity two = new ModuleEntity();
		two.setType(ModuleType.WIRES);
		ModuleEntity three = new ModuleEntity();
		three.setType(ModuleType.BUTTON);
		ModuleEntity four = new ModuleEntity();
		four.setType(ModuleType.MODULES_AGAINST_HUMANITY);
		bomb.setModules(List.of(one, two, three, four));
		return bomb;
	}
}
