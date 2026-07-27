package ktanesolver.module.modded.regular.legos;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record LegosOutput(List<String> cells, String face, String orientation) implements ModuleOutput {}
