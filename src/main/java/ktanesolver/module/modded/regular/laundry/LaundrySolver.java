package ktanesolver.module.modded.regular.laundry;

import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;
import org.springframework.stereotype.Service;

import ktanesolver.enums.ModuleType;

@Service
@ModuleInfo(
    type = ModuleType.LAUNDRY,
    id = "laundry",
    name = "Laundry",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Compute the washing, drying, ironing, and special instructions from the bomb's current state.",
    tags = { "modded", "laundry", "edgework" },
    hasInput = false,
    hasOutput = true
)
public class LaundrySolver extends AbstractModuleSolver<LaundryInput, LaundryOutput> {

    @Override
    protected SolveResult<LaundryOutput> doSolve(RoundEntity round, BombEntity bomb, ModuleEntity module, LaundryInput input) {
        LaundryItem item = indexedValue(LaundryItem.values(), getUnsolvedRegularModuleCount(bomb) + bomb.getIndicators().size());
        LaundryMaterial material = indexedValue(
            LaundryMaterial.values(),
            getTotalPortCount(bomb) + getSolvedModuleCount(bomb) - bomb.getBatteryHolders()
        );
        LaundryColor color = indexedValue(LaundryColor.values(), bomb.getLastDigit() + bomb.getBatteryCount());

        if (hasBobShortcut(bomb)) {
            return success(new LaundryOutput(true, null, null, null, null, item, material, color));
        }

        LaundrySymbol washingSymbol = material.washingSymbol();
        LaundrySymbol dryingSymbol = color.dryingSymbol();
        LaundrySymbol ironingSymbol = item.ironingSymbol();
        LaundrySymbol specialSymbol = item.specialSymbol();
        boolean specialLocked = false;

        if (color == LaundryColor.CLOUDED_PEARL) {
            specialSymbol = LaundrySymbol.NON_CHLORINE_BLEACH;
            specialLocked = true;
        }

        if (material == LaundryMaterial.LEATHER || color == LaundryColor.JADE_CLUSTER) {
            washingSymbol = LaundrySymbol.WASH_80F;
        }

        if (!specialLocked && (item == LaundryItem.CORSET || material == LaundryMaterial.CORDUROY)) {
            specialSymbol = material.specialSymbol();
            specialLocked = true;
        }

        if (material == LaundryMaterial.WOOL || color == LaundryColor.STAR_LEMON_QUARTZ) {
            dryingSymbol = LaundrySymbol.HIGH_HEAT;
        }

        if (!specialLocked && materialSharesLetterWithSerial(material, bomb.getSerialNumber())) {
            specialSymbol = color.specialSymbol();
        }

        return success(new LaundryOutput(false, washingSymbol, dryingSymbol, ironingSymbol, specialSymbol, item, material, color));
    }

    private static boolean hasBobShortcut(BombEntity bomb) {
        return bomb.getBatteryCount() == 4 && bomb.getBatteryHolders() == 2 && bomb.isIndicatorLit("BOB");
    }

    private static boolean materialSharesLetterWithSerial(LaundryMaterial material, String serialNumber) {
        if (serialNumber == null || serialNumber.isBlank()) {
            return false;
        }
        String uppercaseSerial = serialNumber.toUpperCase();
        for (char character : material.label().toUpperCase().toCharArray()) {
            if (Character.isLetter(character) && uppercaseSerial.indexOf(character) >= 0) {
                return true;
            }
        }
        return false;
    }

    private static int getSolvedModuleCount(BombEntity bomb) {
        return (int) bomb.getModules().stream()
            .filter(ModuleEntity::isSolved)
            .count();
    }

    private static int getUnsolvedRegularModuleCount(BombEntity bomb) {
        return (int) bomb.getModules().stream()
            .filter(module -> !module.isSolved())
            .filter(module -> !module.getType().isNeedy())
            .count();
    }

    private static int getTotalPortCount(BombEntity bomb) {
        return bomb.getPortPlates().stream()
            .mapToInt(plate -> plate.getPorts().size())
            .sum();
    }

    private static <T> T indexedValue(T[] values, int rawIndex) {
        int normalized = ((rawIndex % values.length) + values.length) % values.length;
        return values[normalized];
    }
}
