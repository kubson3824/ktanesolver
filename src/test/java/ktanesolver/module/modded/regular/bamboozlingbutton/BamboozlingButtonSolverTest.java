package ktanesolver.module.modded.regular.bamboozlingbutton;

import static ktanesolver.module.modded.regular.bamboozlingbutton.BamboozlingButtonInput.Color.*;
import static ktanesolver.module.modded.regular.bamboozlingbutton.BamboozlingButtonInput.QuoteStyle.*;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class BamboozlingButtonSolverTest {
	private final BamboozlingButtonSolver solver = new BamboozlingButtonSolver();

	@Test void handlesTheTopLabelSpecialCaseAndAdvancesStages() {
		ModuleEntity module = module();
		BamboozlingButtonOutput first = solve(module, input("B", "C", "B", "D", NONE));
		assertThat(first.doubleTap()).isTrue();
		assertThat(first.twitchCommands()).containsExactly("dtap 2");
		assertThat(first.stage()).isEqualTo(1);
		assertThat(module.getState()).containsEntry("bamboozlingButtonStage", 2).containsKey("bamboozlingButtonStage1");
		assertThat(solve(module, input("B", "C", "D", "E", NONE)).stage()).isEqualTo(2);
	}

	@Test void calculatesDefaultAndQuotedTimingCommands() {
		ModuleEntity normal = module();
		BamboozlingButtonOutput plain = solve(normal, input("B", "C", "D", "E", NONE));
		assertThat(plain.firstValue()).isEqualTo(3);
		assertThat(plain.secondValue()).isEqualTo(8);
		assertThat(plain.twitchCommands()).containsExactly("press 3", "press 8");

		ModuleEntity quoted = module();
		BamboozlingButtonOutput single = solve(quoted, input("B", "C", "D", "E", SINGLE));
		assertThat(single.firstValue()).isEqualTo(7);
		assertThat(single.secondValue()).isEqualTo(3);
		assertThat(single.twitchCommands()).containsExactly("press 07", "press 03");
	}

	private static BamboozlingButtonInput input(String fourth, String fifth, String top, String bottom, BamboozlingButtonInput.QuoteStyle quotes) {
		return new BamboozlingButtonInput(WHITE, "A LETTER", false, "A WORD", fourth, RED, fifth, ORANGE, top, bottom, quotes);
	}
	private static ModuleEntity module() { ModuleEntity module = new ModuleEntity(); module.setState(new HashMap<>()); module.setSolution(new HashMap<>()); return module; }
	@SuppressWarnings("unchecked") private BamboozlingButtonOutput solve(ModuleEntity module, BamboozlingButtonInput input) { return ((SolveSuccess<BamboozlingButtonOutput>) solver.solve(new RoundEntity(), new BombEntity(), module, input)).output(); }
}
