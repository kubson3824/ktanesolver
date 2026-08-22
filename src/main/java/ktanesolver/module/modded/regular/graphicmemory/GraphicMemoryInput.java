package ktanesolver.module.modded.regular.graphicmemory;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record GraphicMemoryInput(String pressedPosition, List<Shape> shapes, boolean resetHistory) implements ModuleInput {
    public record Shape(String color, String shape) {}
}
