package ktanesolver.module.modded.regular.xray;

import ktanesolver.logic.ModuleInput;

public record XRayInput(Integer column, Integer row, Integer movement) implements ModuleInput {}
