package ktanesolver.module.modded.regular.ultracube;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record UltracubeInput(List<String> rotations, int stage, List<String> vertexColors) implements ModuleInput {}
