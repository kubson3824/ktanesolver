package ktanesolver.module.modded.regular.gadgetronvendor;

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

class GadgetronVendorSolverTest {
    private final GadgetronVendorSolver solver = new GadgetronVendorSolver();

    @Test void appliesSpecialAmmoPdaPurchaseAndModuloRules() {
        ModuleEntity module = new ModuleEntity();
        GadgetronVendorOutput output = solve(module, new GadgetronVendorInput(25000, "Suck Cannon", 40, 50, "Blaster", true));
        assertThat(output).isEqualTo(new GadgetronVendorOutput(120, 1200, 23800, true, 2500, 1300));
        assertThat(module.getState()).containsEntry("gadgetronCurrentWeapon", "Suck Cannon").containsEntry("gadgetronWeaponForSale", "Blaster");
    }

    @Test void skipsAnUnaffordableWeaponBeforeModulo() {
        GadgetronVendorOutput output = solve(new ModuleEntity(), new GadgetronVendorInput(25000, "Suck Cannon", 40, 50, "R.Y.N.O.", true));
        assertThat(output.canBuyWeapon()).isFalse();
        assertThat(output.answer()).isEqualTo(3800);
    }

    @Test void rejectsImpossibleAmmoValues() {
        assertThat(result(new ModuleEntity(), new GadgetronVendorInput(100, "Blaster", 9, 8, "Taunter", false))).isInstanceOf(SolveFailure.class);
    }

    @SuppressWarnings("unchecked")
    private GadgetronVendorOutput solve(ModuleEntity module, GadgetronVendorInput input) {
        return ((SolveSuccess<GadgetronVendorOutput>) result(module, input)).output();
    }

    private Object result(ModuleEntity module, GadgetronVendorInput input) {
        BombEntity bomb = new BombEntity();
        bomb.setSerialNumber("A1B2C9"); bomb.setAaBatteryCount(2); bomb.setDBatteryCount(1);
        bomb.setIndicators(Map.of("CAR", true, "NSA", false));
        bomb.replacePortPlates(List.of(new LinkedHashSet<>(List.of(PortType.SERIAL, PortType.PARALLEL)), new LinkedHashSet<>(List.of(PortType.RJ45))));
        return solver.solve(new RoundEntity(), bomb, module, input);
    }
}
