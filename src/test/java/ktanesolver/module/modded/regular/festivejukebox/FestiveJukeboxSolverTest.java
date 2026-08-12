package ktanesolver.module.modded.regular.festivejukebox;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class FestiveJukeboxSolverTest {
	private final FestiveJukeboxSolver solver = new FestiveJukeboxSolver();

	@Test
	void containsEverySourceSongAndSixLyricsInSourceOrder() {
		assertThat(FestiveJukeboxSolver.SONGS).hasSize(20);
		assertThat(FestiveJukeboxSolver.SONGS).allSatisfy(song -> assertThat(song.words()).hasSize(6).doesNotHaveDuplicates());
		assertThat(FestiveJukeboxSolver.SONGS.getFirst().words())
			.containsExactly("Christmas", "Time", "Afraid", "Light", "Banish", "Shade");
		assertThat(FestiveJukeboxSolver.SONGS.getLast().words())
			.containsExactly("Better", "Watch", "Cry", "Pout", "Claus", "Coming");
	}

	@Test
	void identifiesTheSongAndOrdersThePhysicalButtons() {
		FestiveJukeboxOutput output = solve(List.of("Face", "Snowman", "Great"));

		assertThat(output.songTitle()).isEqualTo("I Wish it Could be Christmas Every Day");
		assertThat(output.artist()).isEqualTo("Wizzard");
		assertThat(output.positions()).containsExactly(2, 3, 1);
		assertThat(output.orderedWords()).containsExactly("Snowman", "Great", "Face");
	}

	@Test
	void validatesDistinctWordsThatUniquelyIdentifyASong() {
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
			new FestiveJukeboxInput(List.of("Christmas", "Christmas", "Afraid"))))
			.isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
			new FestiveJukeboxInput(List.of("Christmas", "Time", "Not a lyric"))))
			.isInstanceOf(SolveFailure.class);
	}

	@SuppressWarnings("unchecked")
	private FestiveJukeboxOutput solve(List<String> words) {
		return ((SolveSuccess<FestiveJukeboxOutput>) solver.solve(
			new RoundEntity(), new BombEntity(), new ModuleEntity(), new FestiveJukeboxInput(words)
		)).output();
	}
}
