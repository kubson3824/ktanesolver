package ktanesolver.module.modded.regular.passportcontrol;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveSuccess;

class PassportControlSolverTest {
    private final PassportControlSolver solver = new PassportControlSolver();

    @Test void appliesEveryNormalRestrictionAndSolvesOnTheThirdPassage() {
        PassportControlOutput approved = solve(bomb(), input(2, true, "ARRIVAL", 18, 5, 2009));
        assertThat(approved.ruleDate()).isEqualTo("18/5/2009");
        assertThat(approved.activeRestrictions()).containsExactly("Arrivals only", "Arstotzkans only", "Age 18 or older");
        assertThat(approved.decision()).isEqualTo("APPROVE");
        Object result = solver.solve(new RoundEntity(), bomb(), new ModuleEntity(), input(2, true, "ARRIVAL", 18, 5, 2009));
        assertThat(((SolveSuccess<?>) result).solved()).isTrue();
    }

    @Test void deniesWrongNationalityAndExpiredPassports() {
        PassportControlOutput output = solve(bomb(), input(0, false, "ARRIVAL", 17, 5, 2009));
        assertThat(output.decision()).isEqualTo("DENY");
        assertThat(output.reasons()).containsExactly("Not Arstotzkan", "Passport is expired");
    }

    @Test void specialInstructionsOverrideOrdinaryPassportRules() {
        BombEntity pass = bomb(); pass.setIndicators(Map.of("BOB", true, "CAR", true, "NSA", true));
        assertThat(solve(pass, input(0, false, "DEPARTURE", 1, 1, 1900)).decision()).isEqualTo("APPROVE");
        BombEntity deny = bomb(); deny.setIndicators(Map.of("BOB", false, "CAR", true));
        deny.replacePortPlates(List.of(new LinkedHashSet<>(List.of(PortType.PS2))));
        assertThat(solve(deny, input(0, true, "ARRIVAL", 31, 12, 2200)).decision()).isEqualTo("DENY");
    }

    @SuppressWarnings("unchecked")
    private PassportControlOutput solve(BombEntity bomb, PassportControlInput input) {
        return ((SolveSuccess<PassportControlOutput>) solver.solve(new RoundEntity(), bomb, new ModuleEntity(), input)).output();
    }

    private static PassportControlInput input(int passages, boolean arstotzkan, String flight, int expiryDay, int expiryMonth, int expiryYear) {
        return new PassportControlInput(passages, arstotzkan, flight, 1, 1, 1990, expiryDay, expiryMonth, expiryYear);
    }

    private static BombEntity bomb() {
        BombEntity bomb = new BombEntity(); bomb.setSerialNumber("ARS999"); bomb.setAaBatteryCount(2); bomb.setDBatteryCount(1);
        bomb.replacePortPlates(List.of(new LinkedHashSet<>(List.of(PortType.PARALLEL, PortType.SERIAL))));
        return bomb;
    }
}
