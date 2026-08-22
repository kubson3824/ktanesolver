package ktanesolver.module.modded.regular.ledmath;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class LedMathSolverTest {
    private final LedMathSolver solver = new LedMathSolver();

    @Test void appliesEveryManualBranchAndPersistsAllSouvenirColors() {
        BombEntity bomb = bomb("ABC123", 3, 2, 2);
        assertThat(solve(bomb, new LedMathInput("red", "red", "red"), new ModuleEntity()))
            .isEqualTo(new LedMathOutput(10, 9, "+", 19));
        assertThat(solve(bomb, new LedMathInput("blue", "yellow", "blue"), new ModuleEntity()))
            .isEqualTo(new LedMathOutput(11, 25, "-", -14));
        assertThat(solve(bomb, new LedMathInput("green", "blue", "yellow"), new ModuleEntity()))
            .isEqualTo(new LedMathOutput(-7, 25, "×", -175));
        assertThat(solve(bomb, new LedMathInput("blue", "red", "yellow"), new ModuleEntity()))
            .isEqualTo(new LedMathOutput(11, 0, "×", 0));

        ModuleEntity module = new ModuleEntity();
        assertThat(solve(bomb, new LedMathInput("yellow", "green", "green"), module))
            .isEqualTo(new LedMathOutput(10, 5, "×", 50));
        assertThat(module.getState().get("ledMathColors")).isEqualTo(java.util.List.of("Yellow", "Green", "Green"));
    }

    @Test void validatesColorsAndSerialDigit() {
        BombEntity bomb = bomb("ABCDEF", 0, 0, 0);
        assertThat(solver.solve(new RoundEntity(), bomb, new ModuleEntity(), new LedMathInput("red", "blue", "green")))
            .isInstanceOf(SolveFailure.class);
        bomb.setSerialNumber("ABC123");
        assertThat(solver.solve(new RoundEntity(), bomb, new ModuleEntity(), new LedMathInput("purple", "blue", "green")))
            .isInstanceOf(SolveFailure.class);
    }

    @SuppressWarnings("unchecked")
    private LedMathOutput solve(BombEntity bomb, LedMathInput input, ModuleEntity module) {
        return ((SolveSuccess<LedMathOutput>) solver.solve(new RoundEntity(), bomb, module, input)).output();
    }

    private static BombEntity bomb(String serial, int batteries, int holders, int indicators) {
        BombEntity bomb = new BombEntity();
        bomb.setSerialNumber(serial);
        bomb.setAaBatteryCount(batteries);
        bomb.setDBatteryCount(0);
        bomb.setIndicators(new LinkedHashMap<>());
        for (int i = 0; i < indicators; i++) bomb.getIndicators().put("I" + i, i % 2 == 0);
        if (holders == 2) bomb.setAaBatteryCount(2); // one AA holder plus one D holder
        bomb.setDBatteryCount(holders > 1 ? batteries - 2 : 0);
        return bomb;
    }
}
