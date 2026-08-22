package ktanesolver.module.modded.regular.gadgetronvendor;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;
import ktanesolver.annotation.ModuleInfo;
import ktanesolver.dto.ModuleCatalogDto;
import ktanesolver.entity.BombEntity;
import ktanesolver.entity.ModuleEntity;
import ktanesolver.entity.RoundEntity;
import ktanesolver.enums.ModuleType;
import ktanesolver.logic.AbstractModuleSolver;
import ktanesolver.logic.SolveResult;

@Service
@ModuleInfo(
    type = ModuleType.GADGETRON_VENDOR,
    id = "lgndGadgetronVendor",
    name = "Gadgetron Vendor",
    category = ModuleCatalogDto.ModuleCategory.MODDED_REGULAR,
    description = "Pay to refill the current weapon and buy the weapon for sale when affordable.",
    tags = {"weapons", "ammo", "bolts", "calculation", "ratchet"}
)
public class GadgetronVendorSolver extends AbstractModuleSolver<GadgetronVendorInput, GadgetronVendorOutput> {
    static final Map<String, Integer> WEAPON_PRICES = prices();
    private static final Map<String, Integer> FIXED_AMMO_PRICES = Map.ofEntries(
        Map.entry("BLASTER", 1), Map.entry("BOMB_GLOVE", 5), Map.entry("DECOY_GLOVE", 10),
        Map.entry("DEVASTATOR", 50), Map.entry("DRONE_DEVICE", 40), Map.entry("GLOVE_OF_DOOM", 40),
        Map.entry("MINE_GLOVE", 5), Map.entry("PYROCITOR", 1), Map.entry("RYNO", 20),
        Map.entry("TESLA_CLAW", 2), Map.entry("VISIBOMB", 100));

    @Override
    protected SolveResult<GadgetronVendorOutput> doSolve(
        RoundEntity round, BombEntity bomb, ModuleEntity module, GadgetronVendorInput input
    ) {
        if (input == null) return failure("Enter the displayed weapon and bolt information");
        String current = normalize(input.currentWeapon()), sale = normalize(input.weaponForSale());
        if (!WEAPON_PRICES.containsKey(current) || !WEAPON_PRICES.containsKey(sale)) return failure("Select valid current and sale weapons");
        if (input.bolts() < 0 || input.currentAmmo() < 0 || input.maximumAmmo() < 0 || input.currentAmmo() > input.maximumAmmo()) {
            return failure("Bolt and ammo values must be nonnegative, and current ammo cannot exceed maximum ammo");
        }
        int unitPrice = ammoPrice(current, bomb);
        if (input.pdaLit()) unitPrice *= 10;
        int refillCost = (input.maximumAmmo() - input.currentAmmo()) * unitPrice;
        int afterRefill = input.bolts() - refillCost;
        int weaponPrice = WEAPON_PRICES.get(sale);
        boolean canBuy = afterRefill >= weaponPrice;
        int remaining = canBuy ? afterRefill - weaponPrice : afterRefill;
        if (remaining < 0) return failure("The refill cost exceeds the displayed bolt count; recheck the inputs");
        int answer = remaining > 9999 ? remaining % 10000 : remaining;
        storeState(module, "gadgetronCurrentWeapon", display(current));
        storeState(module, "gadgetronWeaponForSale", display(sale));
        return success(new GadgetronVendorOutput(unitPrice, refillCost, afterRefill, canBuy, weaponPrice, answer));
    }

    private static int ammoPrice(String weapon, BombEntity bomb) {
        Integer fixed = FIXED_AMMO_PRICES.get(weapon);
        if (fixed != null) return fixed;
        return switch (weapon) {
            case "MORPH_O_RAY" -> bomb.getIndicators().size() + 1;
            case "SUCK_CANNON" -> (bomb.getBatteryCount() + bomb.getPortPlates().size() + 1) * 2;
            case "TAUNTER" -> bomb.getPortPlates().stream().mapToInt(plate -> plate.getPorts().size()).sum() + 1;
            case "WALLOPER" -> firstAndLastSerialDigits(bomb.getSerialNumber()) + 1;
            default -> throw new IllegalArgumentException("Unknown weapon");
        };
    }

    private static int firstAndLastSerialDigits(String serial) {
        String digits = serial == null ? "" : serial.replaceAll("\\D", "");
        return digits.isEmpty() ? 0 : digits.charAt(0) - '0' + digits.charAt(digits.length() - 1) - '0';
    }

    private static Map<String, Integer> prices() {
        Map<String, Integer> values = new LinkedHashMap<>();
        values.put("BLASTER", 2500); values.put("BOMB_GLOVE", 1000); values.put("DECOY_GLOVE", 7500);
        values.put("DEVASTATOR", 10000); values.put("DRONE_DEVICE", 7500); values.put("GLOVE_OF_DOOM", 7500);
        values.put("MINE_GLOVE", 7500); values.put("MORPH_O_RAY", 50000); values.put("PYROCITOR", 2500);
        values.put("RYNO", 150000); values.put("SUCK_CANNON", 15000); values.put("TAUNTER", 2500);
        values.put("TESLA_CLAW", 40000); values.put("VISIBOMB", 15000); values.put("WALLOPER", 7500);
        return Map.copyOf(values);
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT).replace("R.Y.N.O.", "RYNO").replaceAll("[^A-Z0-9]+", "_").replaceAll("^_|_$", "");
    }

    private static String display(String weapon) {
        return switch (weapon) {
            case "RYNO" -> "R.Y.N.O.";
            case "MORPH_O_RAY" -> "Morph-O-Ray";
            default -> {
                String[] words = weapon.toLowerCase(Locale.ROOT).split("_");
                StringBuilder result = new StringBuilder();
                for (String word : words) {
                    if (!result.isEmpty()) result.append(' ');
                    result.append(Character.toUpperCase(word.charAt(0))).append(word.substring(1));
                }
                yield result.toString();
            }
        };
    }
}
