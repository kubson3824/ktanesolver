package ktanesolver.module.modded.regular.thetriangle;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record TheTriangleInput(String rotation, String artwork, String letter, List<String> colors) implements ModuleInput {}
