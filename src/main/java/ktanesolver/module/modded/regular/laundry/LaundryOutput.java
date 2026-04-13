package ktanesolver.module.modded.regular.laundry;

import ktanesolver.logic.ModuleOutput;

public record LaundryOutput(
    boolean bobShortcut,
    LaundrySymbol washingSymbol,
    LaundrySymbol dryingSymbol,
    LaundrySymbol ironingSymbol,
    LaundrySymbol specialSymbol,
    LaundryItem item,
    LaundryMaterial material,
    LaundryColor color
) implements ModuleOutput {
}
