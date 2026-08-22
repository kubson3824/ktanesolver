package ktanesolver.module.modded.regular.gadgetronvendor;

import ktanesolver.logic.ModuleOutput;

public record GadgetronVendorOutput(
    int ammoUnitPrice,
    int refillCost,
    int boltsAfterRefill,
    boolean canBuyWeapon,
    int weaponPrice,
    int answer
) implements ModuleOutput {}
