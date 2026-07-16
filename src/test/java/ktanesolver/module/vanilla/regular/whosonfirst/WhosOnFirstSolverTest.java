package ktanesolver.module.vanilla.regular.whosonfirst;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveSuccess;

class WhosOnFirstSolverTest {
	@Test
	void resolvesGermanWordsUsingEnglishRuleIndexes() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.WHOS_ON_FIRST);
		module.setState(new HashMap<>());
		module.setSolution(new HashMap<>());
		Map<ButtonPosition, String> buttons = Map.of(
			ButtonPosition.TOP_LEFT, "NEIN",
			ButtonPosition.TOP_RIGHT, "JA",
			ButtonPosition.MIDDLE_LEFT, "OKAY",
			ButtonPosition.MIDDLE_RIGHT, "FERTIG",
			ButtonPosition.BOTTOM_LEFT, "KUH",
			ButtonPosition.BOTTOM_RIGHT, "DRÜCK");

		SolveSuccess<WhosOnFirstOutput> result = (SolveSuccess<WhosOnFirstOutput>) new WhosOnFirstSolver().solve(
			new RoundEntity(), new BombEntity(), module, new WhosOnFirstInput("JA", buttons, "DE"));

		assertThat(result.output().position()).isEqualTo(ButtonPosition.TOP_LEFT);
		assertThat(result.output().buttonText()).isEqualTo("NEIN");
		assertThat(module.getStateAs(WhosOnFirstState.class, () -> null).language()).isEqualTo("DE");
	}
}
