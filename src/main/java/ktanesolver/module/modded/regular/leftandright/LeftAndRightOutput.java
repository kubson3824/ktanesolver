package ktanesolver.module.modded.regular.leftandright;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record LeftAndRightOutput(
    String constructedNumber,
    String initialBinarySequence,
    int greenSwitchAfter,
    int blueSwitchAfter,
    List<String> pressSequence
) implements ModuleOutput {}
