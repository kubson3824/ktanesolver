package ktanesolver.module.modded.regular.digitalcipher;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class DigitalCipherSolverTest {
    private final DigitalCipherSolver solver = new DigitalCipherSolver();

    @Test void pairsMirroredLettersAndCalculatesDigitalRoots() {
        assertThat(solve("AZBYCXDWEVFUGTH").pressSequence()).isEqualTo("GHGHGHGHGHGHGHG");
        assertThat(solve("AAAAAAAAAAAAAAA").pressSequence()).isEqualTo("AAAAAAAAAAAAAAA");
    }

    @Test void normalizesCaseAndRejectsInvalidDisplays() {
        assertThat(solve("abcdefghijklmno").displayedString()).isEqualTo("ABCDEFGHIJKLMNO");
        assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new DigitalCipherInput("ABC"))).isInstanceOf(SolveFailure.class);
        assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new DigitalCipherInput("ABCDEFGHIJKLMN1"))).isInstanceOf(SolveFailure.class);
    }

    @SuppressWarnings("unchecked")
    private DigitalCipherOutput solve(String message) {
        return ((SolveSuccess<DigitalCipherOutput>) solver.solve(
            new RoundEntity(), new BombEntity(), new ModuleEntity(), new DigitalCipherInput(message))).output();
    }
}
