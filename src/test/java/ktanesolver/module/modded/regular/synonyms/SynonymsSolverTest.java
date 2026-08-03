package ktanesolver.module.modded.regular.synonyms;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.module.modded.regular.synonyms.SynonymsInput.WordPair;

class SynonymsSolverTest {
	private final SynonymsSolver solver = new SynonymsSolver();

	@Test
	void appliesTheTableEdgeworkAndNoMatchRule() {
		ModuleEntity module = module();
		assertThat(output(new BombEntity(), module, 2)).isEqualTo(new SynonymsOutput("SEND", 7, false));
		assertThat(module.getState()).containsEntry("displayedNumber", 2);
		assertThat(output(new BombEntity(), module(), 5)).isEqualTo(new SynonymsOutput("ERASE", 3, false));
		assertThat(output(new BombEntity(), module(), 6)).isEqualTo(new SynonymsOutput("EXECUTE", 5, true));

		BombEntity swapped = new BombEntity();
		swapped.setSerialNumber("ABC1D5");
		swapped.setIndicators(Map.of("IND", true));
		assertThat(output(swapped, module(), 7)).isEqualTo(new SynonymsOutput("ANNUL", 2, false));

		BombEntity doubled = new BombEntity();
		doubled.replacePortPlates(List.of(Set.<PortType>of(), Set.<PortType>of()));
		assertThat(output(doubled, module(), 4)).isEqualTo(new SynonymsOutput("SEND", 7, false));
	}

	@Test
	void rejectsIncompletePermutationsAndMultipleMatches() {
		List<WordPair> duplicate = new ArrayList<>(pairs());
		duplicate.set(0, duplicate.get(1));
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), module(), new SynonymsInput(2, duplicate)))
			.isInstanceOf(SolveFailure.class);
	}

	private SynonymsOutput output(BombEntity bomb, ModuleEntity module, int number) {
		return ((SolveSuccess<SynonymsOutput>) solver.solve(
			new RoundEntity(), bomb, module, new SynonymsInput(number, pairs())
		)).output();
	}

	private static List<WordPair> pairs() {
		return List.of(
			new WordPair("OK", "CANCEL"), new WordPair("OKAY", "ANNUL"), new WordPair("CONFIRM", "ERASE"),
			new WordPair("ENTER", "DELETE"), new WordPair("EXECUTE", "STOP"), new WordPair("VERIFY", "OPPOSE"),
			new WordPair("SEND", "DISCARD"), new WordPair("APPROVE", "REJECT"), new WordPair("SUBMIT", "DECLINE"),
			new WordPair("SELECT", "REFUSE"), new WordPair("YES", "NO")
		);
	}

	private static ModuleEntity module() {
		ModuleEntity module = new ModuleEntity();
		module.setType(ModuleType.SYNONYMS);
		return module;
	}
}
