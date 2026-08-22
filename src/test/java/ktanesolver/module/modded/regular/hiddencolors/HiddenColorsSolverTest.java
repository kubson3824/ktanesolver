package ktanesolver.module.modded.regular.hiddencolors;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.SolveSuccess;

class HiddenColorsSolverTest {
    @Test void mapsNamedButtonsAppliesTheFirstRuleAndStoresTheLedForSouvenir() {
        BombEntity bomb = new BombEntity(); bomb.setSerialNumber("ABC456");
        List<String> colors = new ArrayList<>(java.util.Collections.nCopies(20, "blue")); colors.set(0,"red"); colors.set(1,"green");
        ModuleEntity module = new ModuleEntity();
        @SuppressWarnings("unchecked")
        HiddenColorsOutput output = ((SolveSuccess<HiddenColorsOutput>) new HiddenColorsSolver().solve(new RoundEntity(), bomb, module, new HiddenColorsInput("red", colors))).output();
        assertThat(output.namedButtons()).containsEntry("A",1).containsEntry("F",14);
        assertThat(output.appliedRule()).isEqualTo(2);
        assertThat(output.correctButton()).isEqualTo(9);
        assertThat(module.getState()).containsEntry("hiddenColorsLedColor", "Red");
    }
}
