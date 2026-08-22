package ktanesolver.module.modded.regular.simonsounds;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class SimonSoundsSolverTest {
    private final SimonSoundsSolver solver = new SimonSoundsSolver();

    @Test void mapsEveryOfficialTableRowInSourceOrder() {
        List<String> samples = List.of("RED", "BLUE", "YELLOW", "GREEN");
        assertThat(SimonSoundsSolver.presses(0, 0, samples)).containsExactly("GREEN", "RED", "YELLOW", "BLUE");
        assertThat(SimonSoundsSolver.presses(1, 1, samples)).containsExactly("YELLOW", "RED", "BLUE", "GREEN");
        assertThat(SimonSoundsSolver.presses(2, 2, samples)).containsExactly("YELLOW", "RED", "BLUE", "GREEN");
        assertThat(SimonSoundsSolver.presses(3, 3, samples)).containsExactly("BLUE", "RED", "GREEN", "YELLOW");
        assertThat(SimonSoundsSolver.presses(4, 4, samples)).containsExactly("BLUE", "RED", "YELLOW", "GREEN");
    }

    @Test void recordsEverySouvenirStageAndOnlySolvesOnTheFinalStage() {
        BombEntity bomb = bomb();
        ModuleEntity module = new ModuleEntity();
        assertThat(solve(bomb, module, new SimonSoundsInput(1, List.of("RED"), false)).stage()).isEqualTo(1);
        assertThat(solve(bomb, module, new SimonSoundsInput(2, List.of("RED", "GREEN"), false)).presses()).hasSize(2);
        assertThat(solve(bomb, module, new SimonSoundsInput(3, List.of("RED", "GREEN", "BLUE"), true)).presses()).hasSize(3);
        assertThat(module.getState().get("simonSoundsSamples")).isEqualTo(List.of("red", "green", "blue"));
        assertThat(module.isSolved()).isTrue();
    }

    @Test void validatesStageOrderAndCumulativeLength() {
        BombEntity bomb = bomb();
        assertThat(solver.solve(new RoundEntity(), bomb, new ModuleEntity(), new SimonSoundsInput(2, List.of("RED"), false))).isInstanceOf(SolveFailure.class);
        assertThat(solver.solve(new RoundEntity(), bomb, new ModuleEntity(), new SimonSoundsInput(2, List.of("RED", "BLUE"), false))).isInstanceOf(SolveFailure.class);
    }

    @SuppressWarnings("unchecked")
    private SimonSoundsOutput solve(BombEntity bomb, ModuleEntity module, SimonSoundsInput input) {
        return ((SolveSuccess<SimonSoundsOutput>) solver.solve(new RoundEntity(), bomb, module, input)).output();
    }

    private static BombEntity bomb() {
        BombEntity bomb = new BombEntity();
        bomb.setSerialNumber("ABC123");
        bomb.setIndicators(new LinkedHashMap<>(Map.of("BOB", true)));
        bomb.setModules(List.of(new ModuleEntity(), new ModuleEntity()));
        return bomb;
    }
}
