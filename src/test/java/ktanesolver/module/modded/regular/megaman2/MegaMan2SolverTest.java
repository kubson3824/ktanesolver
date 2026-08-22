package ktanesolver.module.modded.regular.megaman2;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class MegaMan2SolverTest {
    private final MegaMan2Solver solver = new MegaMan2Solver();
    @Test void createsAllNinePasswordPointsAndHonorsDisplayedImages() {
        BombEntity bomb = new BombEntity(); bomb.setSerialNumber("ABC123"); bomb.setAaBatteryCount(2); bomb.getIndicators().put("CAR", false);
        var output = ((SolveSuccess<MegaMan2Output>) solver.solve(new RoundEntity(), bomb, new ModuleEntity(), new MegaMan2Input("Air Man", "Crash Man", 45))).output();
        assertThat(output.eTanks()).isEqualTo(1);
        assertThat(output.password()).hasSize(9).startsWith("A1", "E1", "D2", "D4");
    }
    @Test void rejectsTheSameMasterAndWeapon() {
        assertThat(solver.solve(new RoundEntity(), new BombEntity(), new ModuleEntity(), new MegaMan2Input("Air Man", "Air Man", 30))).isInstanceOf(SolveFailure.class);
    }
}
