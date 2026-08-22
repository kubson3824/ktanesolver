package ktanesolver.module.modded.regular.tashasqueals;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record TashaSquealsInput(
    Color top, Color right, Color bottom, Color left, List<Color> flashedColors
) implements ModuleInput {
    public enum Color { PINK, GREEN, YELLOW, BLUE }
}
