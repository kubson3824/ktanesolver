package ktanesolver.module.modded.regular.hypercube;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record HypercubeInput(List<String> rotations, int stage, List<String> vertexColors) implements ModuleInput {}
