package ktanesolver.module.modded.regular.stainedglass;

import static ktanesolver.module.modded.regular.stainedglass.StainedGlassInput.Color.*;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class StainedGlassSolverTest {
	@Test void evaluatesEveryFixedRuleAgainstAnAllIceWindow() {
		StainedGlassOutput output = solve(new StainedGlassInput(java.util.Collections.nCopies(25, ICE)));
		assertThat(output.smashPositions()).containsExactly("21", "31", "41", "53", "62", "63", "71", "91");
		assertThat(output.twitchCommand()).isEqualTo("press 21 31 41 53 62 63 71 91");
	}

	@Test void usesVisualRowsAndDiagonalAboveBelowPanes() {
		List<StainedGlassInput.Color> colors = new java.util.ArrayList<>(java.util.Collections.nCopies(25, ICE));
		colors.set(5, MALACHITE); // Rule 6: its only pane above is position 22.
		colors.set(2, AMBER);
		colors.set(9, AMETHYST); // Rule 10: one of the two panes below is position 55.
		colors.set(14, AMETHYST);
		StainedGlassOutput output = solve(new StainedGlassInput(colors));
		assertThat(output.smashPositions()).contains("33", "44");
	}

	@SuppressWarnings("unchecked") private static StainedGlassOutput solve(StainedGlassInput input) {
		ModuleEntity module = new ModuleEntity(); module.setState(new HashMap<>()); module.setSolution(new HashMap<>());
		return ((SolveSuccess<StainedGlassOutput>) new StainedGlassSolver().solve(new RoundEntity(), new BombEntity(), module, input)).output();
	}
}
