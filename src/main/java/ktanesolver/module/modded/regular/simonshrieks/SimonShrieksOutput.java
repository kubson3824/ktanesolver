package ktanesolver.module.modded.regular.simonshrieks;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record SimonShrieksOutput(List<String> presses) implements ModuleOutput {}
