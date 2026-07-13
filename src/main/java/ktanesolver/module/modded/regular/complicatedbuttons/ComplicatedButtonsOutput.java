package ktanesolver.module.modded.regular.complicatedbuttons;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record ComplicatedButtonsOutput(List<Integer> pressOrder) implements ModuleOutput {}
