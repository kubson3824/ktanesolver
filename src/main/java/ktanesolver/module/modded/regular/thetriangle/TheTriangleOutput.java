package ktanesolver.module.modded.regular.thetriangle;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record TheTriangleOutput(String color, String position, List<String> completedPositions) implements ModuleOutput {}
