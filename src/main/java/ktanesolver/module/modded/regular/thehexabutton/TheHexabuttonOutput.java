package ktanesolver.module.modded.regular.thehexabutton;

import ktanesolver.logic.ModuleOutput;

public record TheHexabuttonOutput(
    String action,
    boolean needsLightObservation,
    String timingCondition,
    String suggestedTime,
    String lightType,
    String lightColor,
    String morseLetter
) implements ModuleOutput {}
