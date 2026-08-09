package ktanesolver.module.modded.regular.simonsstar;

import java.util.List;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.modded.regular.simonsstar.SimonsStarInput.Color;

public record SimonsStarOutput(int stage, List<Color> presses) implements ModuleOutput {}
