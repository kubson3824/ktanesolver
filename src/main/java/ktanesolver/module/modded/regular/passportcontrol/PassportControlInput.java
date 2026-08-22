package ktanesolver.module.modded.regular.passportcontrol;

import ktanesolver.logic.ModuleInput;

public record PassportControlInput(
    int successfulPassages,
    boolean arstotzkan,
    String flightType,
    int birthDay,
    int birthMonth,
    int birthYear,
    int expirationDay,
    int expirationMonth,
    int expirationYear
) implements ModuleInput {}
