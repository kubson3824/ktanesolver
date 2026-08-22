package ktanesolver.module.modded.regular.pigpenrotations;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class PigpenRotationsSolverTest {
    private final PigpenRotationsSolver solver = new PigpenRotationsSolver();

    @Test void reversesTheSourceRotationAndWrapsLetters() {
        assertThat(solve("DEFCDEBCYZAB", 3)).isEqualTo(new PigpenRotationsOutput("ABCZABYZVWXY", 3));
        assertThat(solve("NOPQRSTUVWXY", 0)).isEqualTo(new PigpenRotationsOutput("ABCDEFGHIJKL", 13));
    }

    @Test void requiresExactlyTwelveLetters() {
        assertThat(result("ABC123", 2)).isInstanceOf(SolveFailure.class);
        assertThat(result("ABCDEFGHIJKLM", 2)).isInstanceOf(SolveFailure.class);
    }

    @SuppressWarnings("unchecked")
    private PigpenRotationsOutput solve(String displayed, int batteries) {
        return ((SolveSuccess<PigpenRotationsOutput>) result(displayed, batteries)).output();
    }

    private Object result(String displayed, int batteries) {
        BombEntity bomb = new BombEntity();
        bomb.setAaBatteryCount(batteries);
        return solver.solve(new RoundEntity(), bomb, new ModuleEntity(), new PigpenRotationsInput(displayed));
    }
}
