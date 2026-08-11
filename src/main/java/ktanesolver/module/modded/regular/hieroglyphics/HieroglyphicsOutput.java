package ktanesolver.module.modded.regular.hieroglyphics;

import java.util.Map;
import ktanesolver.logic.ModuleOutput;

public record HieroglyphicsOutput(
    Map<String, Integer> values, String anubisPosition, String horusPosition,
    String priorityGlyph, int priorityOccurrences, int timerDigit
) implements ModuleOutput {}
