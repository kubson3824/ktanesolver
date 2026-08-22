package ktanesolver.module.modded.regular.subscribetopewdiepie;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.SolveFailure;
import ktanesolver.logic.SolveSuccess;

class SubscribeToPewdiepieSolverTest {
    private final SubscribeToPewdiepieSolver solver = new SubscribeToPewdiepieSolver();

    @Test void appliesEveryRuleInAuthoritativeSourceOrderAndPersistsSouvenirCounts() {
        BombEntity bomb = bomb("A1T2BC", 2,
            ModuleType.SUBSCRIBE_TO_PEWDIEPIE, ModuleType.T_WORDS, ModuleType.PIE,
            ModuleType.ONE_HUNDRED_AND_ONE_DALMATIANS, ModuleType.COOKING);
        ModuleEntity source = bomb.getModules().get(0);

        SubscribeToPewdiepieOutput output = solve(bomb, source, 40_000_000, 50_000_000);

        assertThat(output.adjustedPewdiepie()).isEqualTo(45_125_495);
        assertThat(output.adjustedTSeries()).isEqualTo(45_000_675);
        assertThat(output.subscriberGap()).isEqualTo(124_820);
        assertThat(output.submission()).isEqualTo("24820");
        assertThat(source.getState()).containsEntry("subscribePewdiepieStartingPewdiepie", 40_000_000)
            .containsEntry("subscribePewdiepieStartingTSeries", 50_000_000);
    }

    @Test void submitsZeroWhenTSeriesCatchesUpAndPadsShortPositiveGaps() {
        BombEntity zero = bomb("A1T2BC", 0, ModuleType.SUBSCRIBE_TO_PEWDIEPIE);
        assertThat(solve(zero, zero.getModules().get(0), 50_000_000, 49_000_000).submission()).isEqualTo("00000");

        BombEntity shortGap = bomb("A12BCD", 0, ModuleType.SUBSCRIBE_TO_PEWDIEPIE);
        assertThat(solve(shortGap, shortGap.getModules().get(0), 50_000_000, 49_999_500).submission()).isEqualTo("00510");
    }

    @Test void rejectsCountsOutsideTheModulesEightDigitGeneratorRange() {
        BombEntity bomb = bomb("A12BCD", 0, ModuleType.SUBSCRIBE_TO_PEWDIEPIE);
        assertThat(solver.solve(new RoundEntity(), bomb, bomb.getModules().get(0), new SubscribeToPewdiepieInput(9_999_999, 50_000_000)))
            .isInstanceOf(SolveFailure.class);
    }

    @SuppressWarnings("unchecked")
    private SubscribeToPewdiepieOutput solve(BombEntity bomb, ModuleEntity module, int pewdiepie, int tSeries) {
        return ((SolveSuccess<SubscribeToPewdiepieOutput>) solver.solve(
            new RoundEntity(), bomb, module, new SubscribeToPewdiepieInput(pewdiepie, tSeries))).output();
    }

    private static BombEntity bomb(String serial, int batteries, ModuleType... types) {
        BombEntity bomb = new BombEntity();
        bomb.setSerialNumber(serial);
        bomb.setAaBatteryCount(batteries);
        List<ModuleEntity> modules = new ArrayList<>();
        for (ModuleType type : types) { ModuleEntity module = new ModuleEntity(); module.setType(type); modules.add(module); }
        bomb.setModules(modules);
        return bomb;
    }
}
