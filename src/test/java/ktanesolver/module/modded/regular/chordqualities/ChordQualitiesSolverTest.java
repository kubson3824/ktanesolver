package ktanesolver.module.modded.regular.chordqualities;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class ChordQualitiesSolverTest {
	private final ChordQualitiesSolver solver = new ChordQualitiesSolver();

	@Test
	void identifiesAndCrossMapsTheChordAndStoresSouvenirNotes() {
		ModuleEntity module = new ModuleEntity();

		var result = solver.solve(new RoundEntity(), new BombEntity(), module,
			new ChordQualitiesInput(List.of("C", "D#", "E", "A#")));

		assertThat(result).isInstanceOf(SolveSuccess.class);
		assertThat(((SolveSuccess<ChordQualitiesOutput>) result).output())
			.isEqualTo(new ChordQualitiesOutput("C7♯9", "Aø", List.of("A", "C", "D♯", "G")));
		assertThat(module.getState()).containsEntry("givenNotes", List.of("A♯", "C", "D♯", "E"));
	}
}
