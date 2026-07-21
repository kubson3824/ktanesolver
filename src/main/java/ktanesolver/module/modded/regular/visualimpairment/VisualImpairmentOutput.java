package ktanesolver.module.modded.regular.visualimpairment;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record VisualImpairmentOutput(List<String> positions, int pictureNumber, int stage) implements ModuleOutput {}
