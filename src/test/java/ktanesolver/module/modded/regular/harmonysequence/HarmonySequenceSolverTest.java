package ktanesolver.module.modded.regular.harmonysequence;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class HarmonySequenceSolverTest {
    private final HarmonySequenceSolver solver = new HarmonySequenceSolver();

    @Test void sortsEveryPitchPermutationAndPersistsAllFourStages() {
        ModuleEntity module = new ModuleEntity();
        assertThat(solve(module, 1, List.of(4, 1, 3, 2)).pressPositions()).containsExactly(2, 4, 3, 1);
        assertThat(solve(module, 2, List.of(1, 2, 3, 4)).pressPositions()).containsExactly(1, 2, 3, 4);
        assertThat(solve(module, 3, List.of(2, 4, 1, 3)).pressPositions()).containsExactly(3, 1, 4, 2);
        assertThat(solve(module, 4, List.of(3, 2, 4, 1)).pressPositions()).containsExactly(4, 2, 1, 3);
        assertThat(module.getState().get("harmonySequenceStages")).isEqualTo(List.of(
            List.of(2, 4, 3, 1), List.of(1, 2, 3, 4), List.of(3, 1, 4, 2), List.of(4, 2, 1, 3)));
        assertThat(module.isSolved()).isTrue();
    }

    @Test void rejectsDuplicateRanksAndSkippedStages() {
        ModuleEntity module = new ModuleEntity();
        assertThat(result(module, 1, List.of(1, 1, 3, 4))).isInstanceOf(SolveFailure.class);
        assertThat(result(module, 2, List.of(1, 2, 3, 4))).isInstanceOf(SolveFailure.class);
    }

    @SuppressWarnings("unchecked")
    private HarmonySequenceOutput solve(ModuleEntity module, int stage, List<Integer> ranks) {
        return ((SolveSuccess<HarmonySequenceOutput>) result(module, stage, ranks)).output();
    }

    private Object result(ModuleEntity module, int stage, List<Integer> ranks) {
        return solver.solve(new RoundEntity(), new BombEntity(), module, new HarmonySequenceInput(stage, ranks));
    }
}
