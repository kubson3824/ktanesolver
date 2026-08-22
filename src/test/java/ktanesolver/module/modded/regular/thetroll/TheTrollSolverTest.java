package ktanesolver.module.modded.regular.thetroll;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveSuccess;

class TheTrollSolverTest {
    @Test void calculatesPreparationActivationAndVerifiedTwitchCommands() {
        BombEntity bomb = new BombEntity(); bomb.setAaBatteryCount(12);
        List<ModuleEntity> modules = new ArrayList<>();
        for (int i = 0; i < 15; i++) { ModuleEntity candidate = new ModuleEntity(); candidate.setType(ModuleType.WIRES); candidate.setSolved(i < 6); modules.add(candidate); }
        ModuleEntity troll = new ModuleEntity(); troll.setType(ModuleType.THE_TROLL); modules.add(troll); bomb.setModules(modules);
        @SuppressWarnings("unchecked")
        TheTrollOutput output = ((SolveSuccess<TheTrollOutput>) new TheTrollSolver().solve(new RoundEntity(), bomb, troll, new TheTrollInput())).output();
        assertThat(output.prepPresses()).isEqualTo(9);
        assertThat(output.additionalSolvesToActivate()).isEqualTo(2);
        assertThat(output.timerDigit()).isEqualTo(2);
        assertThat(output.prepCommand()).isEqualTo("press 9");
        assertThat(output.activationCommand()).isEqualTo("press at 2");
    }
}
