package ktanesolver.module.modded.regular.gadgetronvendor;

import ktanesolver.logic.ModuleInput;

public record GadgetronVendorInput(
    int bolts,
    String currentWeapon,
    int currentAmmo,
    int maximumAmmo,
    String weaponForSale,
    boolean pdaLit
) implements ModuleInput {}
