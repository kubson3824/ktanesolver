package ktanesolver.module.modded.regular.squarebutton;

import ktanesolver.logic.ModuleInput;

public record SquareButtonInput(String color, String label, String ledColor, Boolean flickering) implements ModuleInput {}
