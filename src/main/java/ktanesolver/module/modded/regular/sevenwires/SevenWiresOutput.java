package ktanesolver.module.modded.regular.sevenwires;

import ktanesolver.logic.ModuleOutput;

public record SevenWiresOutput(int wirePosition, String wireColor, int rule) implements ModuleOutput {}
