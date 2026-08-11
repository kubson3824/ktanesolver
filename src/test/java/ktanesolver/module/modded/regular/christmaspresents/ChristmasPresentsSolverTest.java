package ktanesolver.module.modded.regular.christmaspresents;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class ChristmasPresentsSolverTest {
    private final ChristmasPresentsSolver solver = new ChristmasPresentsSolver();

    @Test void calculatesExactSourceValuesIncludingZeroDifferenceRule() {
        BombEntity bomb = new BombEntity();
        bomb.setAaBatteryCount(2);
        bomb.setIndicators(new LinkedHashMap<>(java.util.Map.of("BOB", true, "FRK", false)));
        bomb.replacePortPlates(List.of(Set.of(PortType.SERIAL, PortType.PARALLEL), Set.of(PortType.SERIAL)));
        ChristmasPresentsOutput output = solve(bomb, new ChristmasPresentsInput(2, 3, 4, 2, 2));
        assertThat(output).isEqualTo(new ChristmasPresentsOutput(3, 4, 14, 7));
    }

    @Test void takesAbsoluteValuesAndWrapsHourThroughTwenty() {
        BombEntity bomb = new BombEntity();
        ChristmasPresentsOutput output = solve(bomb, new ChristmasPresentsInput(0, 0, 8, 5, 0));
        assertThat(output.valueX()).isEqualTo(8);
        assertThat(output.valueY()).isEqualTo(5);
        assertThat(output.hour()).isEqualTo(19);
    }

    @Test void rejectsCountsThatCannotBeGenerated() {
        BombEntity bomb = new BombEntity();
        assertThat(result(bomb, new ChristmasPresentsInput(1, 1, 1, 1, 1))).isInstanceOf(SolveFailure.class);
        assertThat(result(bomb, new ChristmasPresentsInput(-1, 2, 3, 4, 5))).isInstanceOf(SolveFailure.class);
    }
    private ChristmasPresentsOutput solve(BombEntity bomb, ChristmasPresentsInput input) { return ((SolveSuccess<ChristmasPresentsOutput>) result(bomb, input)).output(); }
    private Object result(BombEntity bomb, ChristmasPresentsInput input) { return solver.solve(new RoundEntity(), bomb, new ModuleEntity(), input); }
}
