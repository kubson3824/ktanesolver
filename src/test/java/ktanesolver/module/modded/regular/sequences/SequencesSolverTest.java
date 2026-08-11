package ktanesolver.module.modded.regular.sequences;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

class SequencesSolverTest {
    private final SequencesSolver solver = new SequencesSolver();

    @Test void derivesTheManualExampleAndEverySimplificationForm() {
        assertThat(solve(54, 75, 96).formula()).isEqualTo("21n+33");
        assertThat(solve(1, 2, 3).formula()).isEqualTo("n");
        assertThat(solve(-1, -2, -3).formula()).isEqualTo("-n");
        assertThat(solve(3, 1, -1).formula()).isEqualTo("-2n+5");
        assertThat(solve(1, 4, 7).formula()).isEqualTo("3n-2");
    }

    @Test void rejectsImpossibleSourceValuesAndNonArithmeticTerms() {
        assertThat(result(1, 2, 4)).isInstanceOf(SolveFailure.class);
        assertThat(result(7, 7, 7)).isInstanceOf(SolveFailure.class);
        assertThat(result(0, 100, 200)).isInstanceOf(SolveFailure.class);
        assertThat(result(101, 102, 103)).isInstanceOf(SolveFailure.class);
    }

    @SuppressWarnings("unchecked")
    private SequencesOutput solve(int first, int second, int third) {
        return ((SolveSuccess<SequencesOutput>) result(first, second, third)).output();
    }

    private SolveResult<SequencesOutput> result(int first, int second, int third) {
        return solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
            new SequencesInput(first, second, third));
    }
}
