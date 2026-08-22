package ktanesolver.module.modded.regular.melodysequencer;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class MelodySequencerSolverTest {
    private final MelodySequencerSolver solver = new MelodySequencerSolver();

    @Test void sortsTheGivenPartsAndRecordsEveryMissingPart() {
        MelodySequencerOutput output = solve(Arrays.asList(3, null, 1, null, 8, null, 5, null));
        assertThat(output.moves()).containsExactly(
            new MelodySequencerMove(3, 1),
            new MelodySequencerMove(7, 5),
            new MelodySequencerMove(7, 8));
        assertThat(output.recordings()).containsExactly(
            new MelodySequencerRecording(2, MelodySequencerSolver.PARTS.get(1)),
            new MelodySequencerRecording(4, MelodySequencerSolver.PARTS.get(3)),
            new MelodySequencerRecording(6, MelodySequencerSolver.PARTS.get(5)),
            new MelodySequencerRecording(7, MelodySequencerSolver.PARTS.get(6)));
    }

    @Test void acceptsAlreadySortedPartsWithoutMoves() {
        assertThat(solve(Arrays.asList(1, null, 3, null, 5, null, null, 8)).moves()).isEmpty();
    }

    @Test void rejectsDuplicatesAndTheWrongNumberOfGivenParts() {
        assertThat(result(Arrays.asList(1, 1, null, null, null, null, null, null))).isInstanceOf(SolveFailure.class);
        assertThat(result(Arrays.asList(1, 2, 3, null, null, null, null, null))).isInstanceOf(SolveFailure.class);
    }

    @SuppressWarnings("unchecked")
    private MelodySequencerOutput solve(List<Integer> slots) {
        return ((SolveSuccess<MelodySequencerOutput>) result(slots)).output();
    }

    private Object result(List<Integer> slots) {
        return solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new MelodySequencerInput(slots));
    }
}
