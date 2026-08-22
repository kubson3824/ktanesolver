package ktanesolver.module.modded.regular.thehexabutton;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class TheHexabuttonSolverTest {
    private final TheHexabuttonSolver solver = new TheHexabuttonSolver();

    @Test void returnsAReachableTimedTapForTheFirstApplicableRule() {
        BombEntity bomb = bomb(); bomb.setAaBatteryCount(6);
        TheHexabuttonOutput output = solve(bomb, new ModuleEntity(), new TheHexabuttonInput("Boom", "Black", List.of(), null, null, null));
        assertThat(output.action()).isEqualTo("TAP");
        assertThat(output.suggestedTime()).isEqualTo("9:38");
    }

    @Test void requestsTheHeldObservationThenPersistsItsSouvenirColor() {
        BombEntity bomb = bomb(); bomb.setIndicators(Map.of("SND", false));
        TheHexabuttonOutput initial = solve(bomb, new ModuleEntity(), new TheHexabuttonInput("Boom", "Black", List.of(), null, null, null));
        assertThat(initial.action()).isEqualTo("HOLD"); assertThat(initial.needsLightObservation()).isTrue();
        ModuleEntity module = new ModuleEntity();
        TheHexabuttonOutput release = solve(bomb, module, new TheHexabuttonInput("Boom", "Black", List.of(), "SOLID", "PURPLE", null));
        assertThat(release.action()).isEqualTo("RELEASE"); assertThat(release.suggestedTime()).isEqualTo("9:00");
        assertThat(module.getState()).containsEntry("hexabuttonLightColor", "Purple");
    }

    @SuppressWarnings("unchecked")
    private TheHexabuttonOutput solve(BombEntity bomb, ModuleEntity module, TheHexabuttonInput input) {
        return ((SolveSuccess<TheHexabuttonOutput>) solver.solve(new RoundEntity(), bomb, module, input)).output();
    }

    private static BombEntity bomb() { BombEntity bomb = new BombEntity(); bomb.setSerialNumber("ABC123"); return bomb; }
}
