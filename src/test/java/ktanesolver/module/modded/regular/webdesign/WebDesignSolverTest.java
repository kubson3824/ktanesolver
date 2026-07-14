package ktanesolver.module.modded.regular.webdesign;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class WebDesignSolverTest {
	private final WebDesignSolver solver = new WebDesignSolver();

	@Test
	void followsTheManualScoringBranches() {
		WebDesignOutput accept = solve("""
			body.post {
			  color: blue;
			  margin: 1em;
			  border-radius: 4px;
			  z-index: 2;
			  font-family: "Comic Sans MS";
			  box-shadow: none;
			}
			""", false);
		assertThat(accept).isEqualTo(new WebDesignOutput("Edison Daily", "#0000FF", 3, 3, 3, "ACCEPT"));

		WebDesignOutput consider = solve("img#main { color: red; position: relative; z-index: 2; }", true);
		assertThat(consider).isEqualTo(new WebDesignOutput("PNGdrop", "#FF0000", 6, 6, 6, "CONSIDER"));

		WebDesignOutput reject = solve("""
			ol {
			  font-family: "Comic Sans MS";
			  font-family: "Comic Sans MS";
			  font-family: "Comic Sans MS";
			}
			""", false);
		assertThat(reject).isEqualTo(new WebDesignOutput("BobIRS", "#7F7F7F", -12, 4, 4, "REJECT"));
	}

	@Test
	void rejectsAmbiguousOrMalformedInputAndStoresTheSuccessfulInput() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new WebDesignInput("body { color: red; }", true)))
			.isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new WebDesignInput("ol { color: red }", true)))
			.isInstanceOf(SolveFailure.class);

		ModuleEntity module = new ModuleEntity();
		solver.solve(new RoundEntity(), new BombEntity(), module, new WebDesignInput("ol { color: red; }", true));
		assertThat(module.getState()).containsKey("input");
	}

	@SuppressWarnings("unchecked")
	private WebDesignOutput solve(String css, boolean coloredButtons) {
		return ((SolveSuccess<WebDesignOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), new ModuleEntity(), new WebDesignInput(css, coloredButtons)
		)).output();
	}
}
