package ktanesolver.module.modded.regular.mineseeker;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record MineseekerOutput(int calculatedNumber, String destinationImage, List<String> moves) implements ModuleOutput {}
