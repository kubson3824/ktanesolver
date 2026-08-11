package ktanesolver.module.modded.regular.numbernimbleness;

import ktanesolver.logic.ModuleOutput;

public record NumberNimblenessOutput(
    int press,
    int usedSequenceIndex,
    int nextSequenceIndex,
    int remainingAfterPress,
    String rule
) implements ModuleOutput {}
