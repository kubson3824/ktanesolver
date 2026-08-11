package ktanesolver.module.modded.regular.streetfighter;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;

class StreetFighterSolverTest {
    private final StreetFighterSolver solver = new StreetFighterSolver();

    @Test void coversAllVennRegions() {
        String expected = "RHVLODUGBKMCFNST";
        for (int mask = 0; mask < 16; mask++) {
            BombEntity bomb = bomb(mask, 5);
            StreetFighterOutput output = solve(bomb);
            assertThat(output.requiredLetter()).isEqualTo(String.valueOf(expected.charAt(mask)));
            assertThat(output.fighter().toLowerCase()).contains(output.requiredLetter().toLowerCase());
            assertThat(output.eligibleFighters()).contains(output.fighter());
        }
    }

    @Test void calculatesTheOpponentFromCountryNameLengthAndModuleCount() {
        StreetFighterOutput output = solve(bomb(0, 5));
        assertThat(output.fighter()).isEqualTo("Ryu");
        assertThat(output.opponent()).isEqualTo("Ken");
    }

    @SuppressWarnings("unchecked")
    private StreetFighterOutput solve(BombEntity bomb) {
        return ((SolveSuccess<StreetFighterOutput>) solver.solve(
            new RoundEntity(), bomb, new ModuleEntity(), new StreetFighterInput())).output();
    }
    private static BombEntity bomb(int mask, int moduleCount) {
        BombEntity bomb = new BombEntity();
        bomb.setAaBatteryCount((mask & 1) != 0 ? 2 : 0);
        bomb.setSerialNumber((mask & 2) != 0 ? "ABC123" : "BCD123");
        bomb.setIndicators(new HashMap<>());
        if ((mask & 8) != 0) bomb.getIndicators().put("CAR", true);
        if ((mask & 4) != 0) {
            PortPlateEntity plate = new PortPlateEntity();
            plate.setPorts(new LinkedHashSet<>(List.of(PortType.RJ45, PortType.SERIAL)));
            bomb.setPortPlates(List.of(plate));
        }
        for (int i = 0; i < moduleCount; i++) bomb.getModules().add(new ModuleEntity());
        return bomb;
    }
}
