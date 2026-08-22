package ktanesolver.module.modded.regular.leftandright;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class LeftAndRightSolverTest {
    private final LeftAndRightSolver solver = new LeftAndRightSolver();

    @Test void buildsAndDynamicallyInvertsTheRemainingSequence() {
        LeftAndRightOutput output = solve(bomb(), "LEFT");
        assertThat(output.constructedNumber()).isEqualTo("3135");
        assertThat(output.initialBinarySequence()).isEqualTo("110000111111");
        assertThat(output.greenSwitchAfter()).isEqualTo(3);
        assertThat(output.blueSwitchAfter()).isEqualTo(2);
        assertThat(output.pressSequence()).containsExactly("RIGHT", "RIGHT", "RIGHT", "RIGHT", "LEFT", "LEFT", "RIGHT", "RIGHT", "LEFT", "RIGHT", "RIGHT", "LEFT");
    }

    @Test void appliesTheSpecialNoSwitchRule() {
        BombEntity bomb = bomb();
        bomb.setIndicators(Map.of("FRK", true, "NSA", false));
        bomb.replacePortPlates(List.of(new LinkedHashSet<>(List.of(PortType.PS2, PortType.PARALLEL, PortType.SERIAL, PortType.RJ45, PortType.DVI))));
        LeftAndRightOutput output = solve(bomb, "RIGHT");
        assertThat(output.greenSwitchAfter()).isEqualTo(-1);
        assertThat(output.blueSwitchAfter()).isEqualTo(-1);
    }

    @Test void requiresTheGreenButtonSide() {
        assertThat(solver.solve(new RoundEntity(), bomb(), new ModuleEntity(), new LeftAndRightInput(""))).isInstanceOf(SolveFailure.class);
    }

    @SuppressWarnings("unchecked")
    private LeftAndRightOutput solve(BombEntity bomb, String side) {
        return ((SolveSuccess<LeftAndRightOutput>) solver.solve(new RoundEntity(), bomb, new ModuleEntity(), new LeftAndRightInput(side))).output();
    }

    private static BombEntity bomb() {
        BombEntity bomb = new BombEntity();
        bomb.setSerialNumber("ABC123"); bomb.setAaBatteryCount(2); bomb.setDBatteryCount(1); bomb.setIndicators(Map.of("CAR", true));
        return bomb;
    }
}
