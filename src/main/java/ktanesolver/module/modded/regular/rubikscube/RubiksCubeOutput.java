package ktanesolver.module.modded.regular.rubikscube;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record RubiksCubeOutput(List<String> moves) implements ModuleOutput {
}
