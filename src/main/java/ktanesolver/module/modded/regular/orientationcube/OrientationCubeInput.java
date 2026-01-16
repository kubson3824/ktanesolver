package ktanesolver.module.modded.regular.orientationcube;

import ktanesolver.logic.ModuleInput;

public record OrientationCubeInput(OrientationCubeFace initialFace, OrientationCubeFace updatedFace) implements ModuleInput {
}
