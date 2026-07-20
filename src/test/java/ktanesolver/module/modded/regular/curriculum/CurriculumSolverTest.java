package ktanesolver.module.modded.regular.curriculum;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.curriculum.CurriculumInput.ButtonSchedule;
import ktanesolver.module.modded.regular.curriculum.CurriculumInput.ClassPair;

class CurriculumSolverTest {
	private final CurriculumSolver solver = new CurriculumSolver();

	@Test
	void appliesConditionPriorityClassParityAndBookworm() {
		BombEntity bomb = bomb();
		CurriculumInput input = input();

		CurriculumOutput withBookworm = solve(bomb, input);
		assertThat(withBookworm.condition()).isEqualTo("Mathlete");
		assertThat(withBookworm.bookworm()).isTrue();
		assertThat(withBookworm.conflicts()).isEqualTo(1);
		assertThat(withBookworm.buttonStates()).containsExactly(2, 1, 1, 1, 1);
		assertThat(withBookworm.clicks()).containsExactly(2, 0, 5, 4, 3);
		assertThat(withBookworm.classes()).containsExactly(
			"Physics", "Philosophy", "Programming", "Linguistics", "Logic");

		bomb.setStrikes(1);
		CurriculumOutput withoutBookworm = solve(bomb, input);
		assertThat(withoutBookworm.bookworm()).isFalse();
		assertThat(withoutBookworm.conflicts()).isZero();
		assertThat(withoutBookworm.buttonStates()).containsExactly(2, 2, 1, 1, 1);
	}

	private CurriculumOutput solve(BombEntity bomb, CurriculumInput input) {
		return ((SolveSuccess<CurriculumOutput>) solver.solve(
			new RoundEntity(), bomb, new ModuleEntity(), input)).output();
	}

	private static BombEntity bomb() {
		BombEntity bomb = new BombEntity();
		bomb.setSerialNumber("24680A");
		bomb.setIndicators(new HashMap<>());
		bomb.replacePortPlates(List.of(
			Set.of(PortType.DVI, PortType.PARALLEL, PortType.PS2, PortType.RJ45, PortType.SERIAL),
			Set.of()));
		ModuleEntity solved = new ModuleEntity();
		solved.setSolved(true);
		bomb.getModules().add(solved);
		return bomb;
	}

	private static CurriculumInput input() {
		List<ClassPair> pairs = List.of(ClassPair.values());
		List<ButtonSchedule> buttons = new ArrayList<>();
		for(int button = 0; button < 5; button++) {
			List<List<Boolean>> sections = new ArrayList<>();
			for(int section = 0; section < 6; section++) sections.add(grid(26 + section % 2, 28 + section % 2));
			buttons.add(new ButtonSchedule(pairs.get(button), sections, button == 0 ? 6 : button));
		}

		buttons.get(0).sections().set(0, grid(6, 7));
		buttons.get(0).sections().set(1, grid(0, 1));
		buttons.get(0).sections().set(2, grid(2, 3));
		buttons.get(1).sections().set(0, grid(0, 4));
		buttons.get(1).sections().set(1, grid(12, 13));
		buttons.get(1).sections().set(2, grid(14, 15));
		buttons.get(2).sections().set(0, grid(16, 17));
		buttons.get(3).sections().set(0, grid(18, 19));
		buttons.get(4).sections().set(0, grid(20, 21));
		return new CurriculumInput(buttons);
	}

	private static List<Boolean> grid(int first, int second) {
		List<Boolean> grid = new ArrayList<>(java.util.Collections.nCopies(30, false));
		grid.set(first, true);
		grid.set(second, true);
		return grid;
	}
}
