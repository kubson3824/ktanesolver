package ktanesolver.module.modded.regular.digitstring;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class DigitStringSolverTest {
    @Test void appliesTheFirstSerialRuleAndPersistsTheInitialDisplay() {
        BombEntity bomb = new BombEntity(); bomb.setSerialNumber("1ABCDE");
        ModuleEntity module = new ModuleEntity();
        @SuppressWarnings("unchecked")
        DigitStringOutput output = ((SolveSuccess<DigitStringOutput>) new DigitStringSolver().solve(new RoundEntity(), bomb, module, new DigitStringInput("12612345"))).output();
        assertThat(output.rule()).isEqualTo("1");
        assertThat(output.expression()).isEqualTo("1 × 12345");
        assertThat(output.answer()).isEqualTo(12345);
        assertThat(module.getState()).containsEntry("digitStringInitialNumber", "12612345");
    }

    @Test void usesTheDistinctCharacterFallback() {
        BombEntity bomb = new BombEntity(); bomb.setSerialNumber("MNOPQR");
        @SuppressWarnings("unchecked")
        DigitStringOutput output = ((SolveSuccess<DigitStringOutput>) new DigitStringSolver().solve(new RoundEntity(), bomb, new ModuleEntity(), new DigitStringInput("13579246"))).output();
        assertThat(output.rule()).isEqualTo("fallback");
        assertThat(output.expression()).isEqualTo("135792 + 6");
    }
}
