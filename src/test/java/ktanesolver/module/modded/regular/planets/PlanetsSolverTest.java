package ktanesolver.module.modded.regular.planets;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;

class PlanetsSolverTest {
    @Test void matchesTheSourceFormulaAndPersistsSouvenirFacts() {
        BombEntity bomb = new BombEntity(); bomb.setAaBatteryCount(2); bomb.setIndicators(Map.of("CAR", true));
        bomb.replacePortPlates(List.of(Set.of(PortType.DVI, PortType.RJ45)));
        ModuleEntity solved = new ModuleEntity(); solved.setSolved(true); bomb.setModules(List.of(solved));
        ModuleEntity module = new ModuleEntity();
        @SuppressWarnings("unchecked")
        PlanetsOutput output = ((SolveSuccess<PlanetsOutput>) new PlanetsSolver().solve(new RoundEntity(), bomb, module,
            new PlanetsInput("Earth", List.of("Aqua", "Blue", "Green", "Lime", "White"), 21, 22))).output();
        assertThat(output.numberA()).isEqualTo(379);
        assertThat(output.numberB()).isEqualTo(16);
        assertThat(output.numberC()).isEqualTo(865);
        assertThat(output.code()).hasSize(6);
        assertThat(module.getState()).containsEntry("planetsPlanet", "Earth");
        assertThat(module.getState().get("planetsStripColors")).isEqualTo(List.of("Aqua", "Blue", "Green", "Lime", "White"));
    }
}
