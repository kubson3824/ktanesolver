package ktanesolver.module.modded.regular.zoo;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record ZooOutput(List<String> animals) implements ModuleOutput {}
