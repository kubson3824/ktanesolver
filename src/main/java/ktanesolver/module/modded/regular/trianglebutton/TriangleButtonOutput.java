package ktanesolver.module.modded.regular.trianglebutton;

import ktanesolver.logic.ModuleOutput;

public record TriangleButtonOutput(String action, int targetDigit, int holdDigit, int releaseDigit) implements ModuleOutput {}
