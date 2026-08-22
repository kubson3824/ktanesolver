package ktanesolver.module.modded.regular.graphicmemory;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record GraphicMemoryOutput(String pressedPosition, int pressesCompleted, List<String> nextValidPositions) implements ModuleOutput {}
