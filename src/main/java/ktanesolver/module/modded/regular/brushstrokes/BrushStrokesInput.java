package ktanesolver.module.modded.regular.brushstrokes;

import ktanesolver.logic.ModuleInput;

public record BrushStrokesInput(KeyColor keyColor, Integer solvableModuleCount) implements ModuleInput {
    public enum KeyColor { RED, ORANGE, YELLOW, LIME, GREEN, CYAN, SKY, BLUE, PURPLE, MAGENTA, BROWN, WHITE, GRAY, BLACK, PINK }
}
