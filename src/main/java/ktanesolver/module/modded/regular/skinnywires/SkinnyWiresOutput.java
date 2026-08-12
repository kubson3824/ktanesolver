package ktanesolver.module.modded.regular.skinnywires;

import ktanesolver.logic.ModuleOutput;
import ktanesolver.module.modded.regular.skinnywires.SkinnyWiresInput.WireColor;

public record SkinnyWiresOutput(String coordinate, WireColor color, int ruleNumber) implements ModuleOutput {}
