package ktanesolver.module.modded.regular.kudosudoku;

import static org.assertj.core.api.Assertions.assertThat;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;
import ktanesolver.logic.SolveResult;
import ktanesolver.module.modded.regular.kudosudoku.KudosudokuSolver.Coding;

class KudosudokuSolverTest {
	private final KudosudokuSolver solver = new KudosudokuSolver();
	private static final List<Integer> GRID = List.of(0,2,3,4, 3,4,1,2, 2,1,4,3, 4,3,2,1);

	@Test void solvesGridDerivesNamesAndCompletesLastCell() {
		BombEntity bomb = bomb("A1B2C3"); ModuleEntity module = new ModuleEntity();
		SolveSuccess<KudosudokuOutput> first = success(solver.solve(new RoundEntity(), bomb, module, new KudosudokuInput(GRID, null, null)));
		assertThat(first.solved()).isFalse();
		assertThat(first.output().solution()).containsExactly(1,2,3,4,3,4,1,2,2,1,4,3,4,3,2,1);
		assertThat(first.output().numberNames()).containsExactly("A","B","C","D");
		assertThat(first.output().remaining()).isEqualTo(1);
		assertThat(module.getState().get("kudosudokuPrefilledCoordinates")).asList().doesNotContain("A1").hasSize(15);
		SolveSuccess<KudosudokuOutput> second = success(solver.solve(new RoundEntity(), bomb, module, new KudosudokuInput(GRID, "a1", "Simon Samples")));
		assertThat(second.solved()).isTrue(); assertThat(second.output().submission()).isEqualTo("Kick"); assertThat(second.output().remaining()).isZero();
	}

	@Test void usesZeroAsDistanceTenAndWrapsNumberNames() { assertThat(KudosudokuSolver.numberNames(bomb("Z0A1B2"))).containsExactly("Z","J","T","D"); }

	@Test void emitsEveryBuiltInTwitchSubmissionForm() {
		Map<Coding,String> expected = Map.ofEntries(
			Map.entry(Coding.LETTERS,"A"),Map.entry(Coding.DIGITS,"1"),Map.entry(Coding.MORSE_CODE,".-"),Map.entry(Coding.SEMAPHORES,"SW.S"),
			Map.entry(Coding.BRAILLE,"1"),Map.entry(Coding.MARITIME_FLAGS,"white-blue with cutout"),Map.entry(Coding.TAP_CODE,"11"),Map.entry(Coding.BINARY,"00001"),
			Map.entry(Coding.SIMON_SAMPLES,"Kick"),Map.entry(Coding.ASTROLOGY,"fire"),Map.entry(Coding.SNOOKER,"red"),Map.entry(Coding.ARROWS,"down"),
			Map.entry(Coding.CARD_SUITS,"spades"),Map.entry(Coding.MAHJONG,"plum"),Map.entry(Coding.ZONI,"3 dots triangle inside circle"),Map.entry(Coding.CHESS_PIECES,"rook"));
		expected.forEach((coding,submission)->assertThat(KudosudokuSolver.submission(coding,1,'A')).as(coding.name()).isEqualTo(submission));
	}

	@Test void rejectsConflictingAmbiguousAndRepeatedInputs() {
		BombEntity bomb=bomb("A1B2C3");ModuleEntity module=new ModuleEntity();
		assertThat(solver.solve(new RoundEntity(),bomb,module,new KudosudokuInput(List.of(1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0),null,null))).isInstanceOf(SolveFailure.class);
		assertThat(solver.solve(new RoundEntity(),bomb,module,new KudosudokuInput(java.util.Collections.nCopies(16,0),null,null))).isInstanceOf(SolveFailure.class);
		solver.solve(new RoundEntity(),bomb,module,new KudosudokuInput(GRID,null,null));solver.solve(new RoundEntity(),bomb,module,new KudosudokuInput(GRID,"A1","DIGITS"));
		assertThat(solver.solve(new RoundEntity(),bomb,module,new KudosudokuInput(GRID,"A1","DIGITS"))).isInstanceOf(SolveFailure.class);
	}

	private static BombEntity bomb(String serial){BombEntity bomb=new BombEntity();bomb.setSerialNumber(serial);return bomb;}
	@SuppressWarnings("unchecked") private static SolveSuccess<KudosudokuOutput> success(SolveResult<KudosudokuOutput> result){return (SolveSuccess<KudosudokuOutput>)result;}
}
