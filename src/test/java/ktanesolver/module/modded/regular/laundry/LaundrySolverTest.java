package ktanesolver.module.modded.regular.laundry;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.PortPlateEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.enums.PortType;
import ktanesolver.logic.SolveResult;
import ktanesolver.logic.SolveSuccess;

class LaundrySolverTest {

    private final LaundrySolver solver = new LaundrySolver();

    @Test
    void catalogUsesLaundryMetadataAndNoInputContract() {
        ModuleInfo moduleInfo = LaundrySolver.class.getAnnotation(ModuleInfo.class);

        assertThat(moduleInfo).isNotNull();
        assertThat(moduleInfo.name()).isEqualTo("Laundry");
        assertThat(moduleInfo.type()).isEqualTo(ModuleType.LAUNDRY);
        assertThat(moduleInfo.hasInput()).isFalse();
        assertThat(moduleInfo.hasOutput()).isTrue();
    }

    @Test
    void solveWrapsIndicesAboveAndBelowRange() {
        BombEntity bomb = bomb("BCDF11", 0, 1, indicators("CAR", true), List.of());
        addModules(bomb,
            module(ModuleType.WIRES, false),
            module(ModuleType.BUTTON, false),
            module(ModuleType.MEMORY, false),
            module(ModuleType.SIMON_SAYS, false),
            module(ModuleType.MORSE_CODE, false),
            module(ModuleType.WHOS_ON_FIRST, false)
        );

        LaundryOutput output = solve(bomb);

        assertThat(output.item()).isEqualTo(LaundryItem.SHIRT);
        assertThat(output.material()).isEqualTo(LaundryMaterial.LEATHER);
        assertThat(output.color()).isEqualTo(LaundryColor.SAPPHIRE_SPRINGS);
        assertThat(output.washingSymbol()).isEqualTo(LaundrySymbol.WASH_80F);
        assertThat(output.dryingSymbol()).isEqualTo(LaundrySymbol.TUMBLE_DRY);
        assertThat(output.ironingSymbol()).isEqualTo(LaundrySymbol.NO_STEAM);
        assertThat(output.specialSymbol()).isEqualTo(LaundrySymbol.NO_TETRACHLORETHYLENE);
    }

    @Test
    void solveUsesBobShortcutWhenBombMatchesSpecialCase() {
        BombEntity bomb = bomb("ABCD14", 4, 0, indicators("BOB", true), List.of(Set.of(PortType.DVI)));
        addModules(bomb, module(ModuleType.WIRES, false));

        LaundryOutput output = solve(bomb);

        assertThat(output.bobShortcut()).isTrue();
        assertThat(output.washingSymbol()).isNull();
        assertThat(output.dryingSymbol()).isNull();
        assertThat(output.ironingSymbol()).isNull();
        assertThat(output.specialSymbol()).isNull();
    }

    @Test
    void solveAppliesCloudedPearlBleachRuleBeforeSerialSpecialOverride() {
        BombEntity bomb = bomb("CLTH34", 0, 0, indicators(), List.of());
        addModules(bomb,
            module(ModuleType.WIRES, false),
            module(ModuleType.BUTTON, false),
            module(ModuleType.KEYPADS, false),
            module(ModuleType.MAZES, false)
        );

        LaundryOutput output = solve(bomb);

        assertThat(output.item()).isEqualTo(LaundryItem.SHORTS);
        assertThat(output.material()).isEqualTo(LaundryMaterial.POLYESTER);
        assertThat(output.color()).isEqualTo(LaundryColor.CLOUDED_PEARL);
        assertThat(output.specialSymbol()).isEqualTo(LaundrySymbol.NON_CHLORINE_BLEACH);
    }

    @Test
    void solveChangesResultWhenSolvedModuleCountChanges() {
        BombEntity bomb = bomb("ABCD11", 0, 0, indicators(), List.of(Set.of(PortType.DVI)));
        ModuleEntity firstModule = module(ModuleType.WIRES, false);
        ModuleEntity secondModule = module(ModuleType.BUTTON, false);
        addModules(bomb, firstModule, secondModule);

        LaundryOutput first = solve(bomb);
        firstModule.setSolved(true);
        LaundryOutput second = solve(bomb);

        assertThat(first.material()).isEqualTo(LaundryMaterial.COTTON);
        assertThat(second.material()).isEqualTo(LaundryMaterial.WOOL);
        assertThat(first.washingSymbol()).isEqualTo(LaundrySymbol.WASH_95F_DOTS);
        assertThat(second.washingSymbol()).isEqualTo(LaundrySymbol.HAND_WASH);
    }

    private LaundryOutput solve(BombEntity bomb) {
        ModuleEntity module = module(ModuleType.LAUNDRY, false);
        module.setBomb(bomb);

        SolveResult<LaundryOutput> result = solver.solve(new RoundEntity(), bomb, module, new LaundryInput());

        assertThat(result).isInstanceOf(SolveSuccess.class);
        assertThat(module.isSolved()).isTrue();

        LaundryOutput output = ((SolveSuccess<LaundryOutput>) result).output();
        assertThat(module.getSolution()).containsEntry("bobShortcut", output.bobShortcut());
        return output;
    }

    @SafeVarargs
    private static void addModules(BombEntity bomb, ModuleEntity... modules) {
        for (ModuleEntity module : modules) {
            module.setBomb(bomb);
            bomb.getModules().add(module);
        }
    }

    private static ModuleEntity module(ModuleType type, boolean solved) {
        ModuleEntity module = new ModuleEntity();
        module.setType(type);
        module.setSolved(solved);
        module.setState(new HashMap<>());
        module.setSolution(new HashMap<>());
        return module;
    }

    private static BombEntity bomb(
        String serialNumber,
        int aaBatteryCount,
        int dBatteryCount,
        java.util.Map<String, Boolean> indicators,
        List<Set<PortType>> portPlates
    ) {
        BombEntity bomb = new BombEntity();
        bomb.setSerialNumber(serialNumber);
        bomb.setAaBatteryCount(aaBatteryCount);
        bomb.setDBatteryCount(dBatteryCount);
        bomb.setIndicators(new HashMap<>(indicators));

        for (Set<PortType> ports : portPlates) {
            PortPlateEntity plate = new PortPlateEntity();
            plate.setBomb(bomb);
            plate.setPorts(ports);
            bomb.getPortPlates().add(plate);
        }

        return bomb;
    }

    private static java.util.Map<String, Boolean> indicators(Object... entries) {
        java.util.Map<String, Boolean> indicators = new HashMap<>();
        for (int i = 0; i < entries.length; i += 2) {
            indicators.put((String) entries[i], (Boolean) entries[i + 1]);
        }
        return indicators;
    }
}
