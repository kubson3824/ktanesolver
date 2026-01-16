package ktanesolver.module.modded.regular.orientationcube;

import ktanesolver.logic.ModuleOutput;

import java.util.List;

public record OrientationCubeOutput(List<OrientationCubeRotation> rotations, boolean needsUpdatedFace) implements ModuleOutput {
}
