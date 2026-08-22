package ktanesolver.module.modded.regular.brushstrokes;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record BrushStrokesOutput(
    String referenceManual,
    int rawKeyNumber,
    int symbolNumber,
    List<String> strokes,
    String twitchCommand
) implements ModuleOutput {}
