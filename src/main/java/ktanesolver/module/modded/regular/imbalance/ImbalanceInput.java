package ktanesolver.module.modded.regular.imbalance;

import ktanesolver.logic.ModuleInput;

public record ImbalanceInput(
    String topMarker, String topDigits, String bottomMarker, String bottomDigits
) implements ModuleInput {}
