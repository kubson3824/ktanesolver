package ktanesolver.module.modded.regular.hyperactivenumbers;

import static org.assertj.core.api.Assertions.assertThat;

import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;
import org.junit.jupiter.api.Test;

class HyperactiveNumbersSolverTest {
    @Test void combinesTheTwoManualTables() {
        assertThat(solve(24, 71)).isEqualTo(new HyperactiveNumbersOutput("blue", "odd", "submit blue odd"));
        assertThat(solve(75, 53)).isEqualTo(new HyperactiveNumbersOutput("yellow", "even", "submit yellow even"));
    }

    @SuppressWarnings("unchecked")
    private static HyperactiveNumbersOutput solve(int left, int right) {
        return ((SolveSuccess<HyperactiveNumbersOutput>) new HyperactiveNumbersSolver().solve(
            new RoundEntity(), new BombEntity(), new ModuleEntity(), new HyperactiveNumbersInput(left, right))).output();
    }
}
