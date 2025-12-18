package ktanesolver.module.vanilla.regular.button;

import ktanesolver.logic.ModuleOutput;

public record ButtonOutput(
        boolean hold,
        String instruction,
        Integer releaseDigit
) implements ModuleOutput {}
