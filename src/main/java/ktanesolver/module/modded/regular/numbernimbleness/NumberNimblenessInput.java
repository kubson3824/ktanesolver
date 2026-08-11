package ktanesolver.module.modded.regular.numbernimbleness;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record NumberNimblenessInput(
    Integer stage,
    String miniGame,
    Integer display,
    List<Integer> availableDigits,
    Integer sequenceIndex
) implements ModuleInput {}
