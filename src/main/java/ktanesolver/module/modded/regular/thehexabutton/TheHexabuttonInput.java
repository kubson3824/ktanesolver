package ktanesolver.module.modded.regular.thehexabutton;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record TheHexabuttonInput(
    String label,
    String buttonColor,
    List<Integer> twoFactorCodes,
    String lightType,
    String lightColor,
    String morseLetter
) implements ModuleInput {}
