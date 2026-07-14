package ktanesolver.module.modded.regular.rubikscube;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record RubiksCubeInput(List<String> faceColors) implements ModuleInput {
}
