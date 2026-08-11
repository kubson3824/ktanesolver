package ktanesolver.module.modded.regular.numbernimbleness;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

class NumberNimblenessSolverTest {
    private final NumberNimblenessSolver solver = new NumberNimblenessSolver();

    @Test void appliesEveryMinigameRule() {
        assertThat(solve("Nagging Numbers", 6, List.of(1, 6), 1).press()).isEqualTo(6);
        NumberNimblenessOutput nebulous = solve("Nebulous Numbers", 8, List.of(2, 4), 1);
        assertThat(nebulous.press()).isEqualTo(2);
        assertThat(nebulous.usedSequenceIndex()).isEqualTo(4);
        assertThat(nebulous.nextSequenceIndex()).isEqualTo(5);
        assertThat(solve("Nifty Numbers", 7, List.of(0, 6, 9), 1).press()).isZero();
        assertThat(solve("Nonary Numbers", 3, List.of(2, 6), 1).press()).isEqualTo(6);
        NumberNimblenessOutput nuisance = solve("Nuisance Numbers", 5, List.of(4, 9), 1);
        assertThat(nuisance.press()).isEqualTo(4);
        assertThat(nuisance.usedSequenceIndex()).isEqualTo(3);
    }

    @Test void onlyFinalButtonOfThirdWinMarksSolved() {
        assertThat(result(2, "Nifty Numbers", 0, List.of(8), 1)).isInstanceOf(SolveSuccess.class)
            .extracting(r -> ((SolveSuccess<?>) r).solved()).isEqualTo(false);
        assertThat(result(3, "Nifty Numbers", 0, List.of(8), 1)).isInstanceOf(SolveSuccess.class)
            .extracting(r -> ((SolveSuccess<?>) r).solved()).isEqualTo(true);
        assertThat(result(3, "Nifty Numbers", 0, List.of(8, 3), 1)).isInstanceOf(SolveSuccess.class)
            .extracting(r -> ((SolveSuccess<?>) r).solved()).isEqualTo(false);
    }

    @Test void validatesLiveState() {
        assertThat(result(0, "Nifty Numbers", 0, List.of(8), 1)).isInstanceOf(SolveFailure.class);
        assertThat(result(1, "Nifty Numbers", 10, List.of(8), 1)).isInstanceOf(SolveFailure.class);
        assertThat(result(1, "Nifty Numbers", 0, List.of(8, 8), 1)).isInstanceOf(SolveFailure.class);
        assertThat(result(1, "No Such Game", 0, List.of(8), 1)).isInstanceOf(SolveFailure.class);
        assertThat(result(1, "Nagging Numbers", 6, List.of(1, 2), 1)).isInstanceOf(SolveFailure.class);
    }

    private NumberNimblenessOutput solve(String game, int display, List<Integer> digits, int index) {
        return ((SolveSuccess<NumberNimblenessOutput>) result(1, game, display, digits, index)).output();
    }

    private SolveResult<NumberNimblenessOutput> result(int stage, String game, int display, List<Integer> digits, int index) {
        return solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(),
            new NumberNimblenessInput(stage, game, display, digits, index));
    }
}
