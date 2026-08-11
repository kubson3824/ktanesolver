package ktanesolver.module.modded.regular.faultydigitalroot;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

class FaultyDigitalRootSolverTest {
    private final FaultyDigitalRootSolver solver = new FaultyDigitalRootSolver();

    @Test void usesAdditiveRootForAnEvenBrokenDisplayAndKeepsLeadingZeroes() {
        FaultyDigitalRootOutput output = solve(8, 9, 7, 4);
        assertThat(output).isEqualTo(new FaultyDigitalRootOutput(6, "0110", List.of("NO", "YES", "YES", "NO")));
    }

    @Test void repeatedlyUsesMultiplicativeRootForAnOddBrokenDisplay() {
        assertThat(solve(7, 7, 7, 3)).isEqualTo(
            new FaultyDigitalRootOutput(8, "1000", List.of("YES", "NO", "NO", "NO")));
        assertThat(solve(9, 0, 8, 1).root()).isZero();
    }

    @Test void rejectsAnythingOtherThanFourSingleDigits() {
        assertThat(result(10, 2, 3, 4)).isInstanceOf(SolveFailure.class);
        assertThat(result(1, -1, 3, 4)).isInstanceOf(SolveFailure.class);
    }

    @SuppressWarnings("unchecked")
    private FaultyDigitalRootOutput solve(int first, int second, int third, int faulty) {
        return ((SolveSuccess<FaultyDigitalRootOutput>) result(first, second, third, faulty)).output();
    }

    private SolveResult<FaultyDigitalRootOutput> result(int first, int second, int third, int faulty) {
        return solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
            new FaultyDigitalRootInput(first, second, third, faulty));
    }
}
