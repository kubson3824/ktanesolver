package ktanesolver.module.modded.regular.faultydigitalroot;

import ktanesolver.logic.ModuleInput;

public record FaultyDigitalRootInput(
    Integer first, Integer second, Integer third, Integer faulty
) implements ModuleInput {}
