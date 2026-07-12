package ktanesolver.module.modded.regular.squarebutton;

import ktanesolver.logic.ModuleOutput;

public record SquareButtonOutput(boolean hold, String instruction) implements ModuleOutput {}
