package ktanesolver.module.modded.regular.xray;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record XRayInput(List<String> symbols) implements ModuleInput {}
