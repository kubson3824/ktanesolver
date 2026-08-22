package ktanesolver.module.modded.regular.forgetthemall;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;
import org.junit.jupiter.api.Test;

class ForgetThemAllSolverTest {
    @Test void appliesBrokenLedsAndTranslatesTheKeyModule() {
        BombEntity bomb = new BombEntity(); bomb.setSerialNumber("ABC123"); bomb.setAaBatteryCount(2); bomb.setDBatteryCount(1);
        bomb.setModules(List.of(new ModuleEntity(), new ModuleEntity()));
        ForgetThemAllInput input = new ForgetThemAllInput(2, List.of(
            new ForgetThemAllInput.Stage("Wire", List.of()),
            new ForgetThemAllInput.Stage("Maze", List.of())
        ), List.of());
        @SuppressWarnings("unchecked")
        ForgetThemAllOutput output = ((SolveSuccess<ForgetThemAllOutput>) new ForgetThemAllSolver().solve(
            new RoundEntity(), bomb, new ModuleEntity(), input)).output();
        assertThat(output.finalValue()).isEqualTo(4);
        assertThat(output.keyStage()).isEqualTo(2);
        assertThat(output.keyModule()).isEqualTo("Maze");
        assertThat(output.cutColors()).containsExactly("pink", "yellow", "orange");
        assertThat(output.command()).isEqualTo("cut pink yellow orange");
    }
}
