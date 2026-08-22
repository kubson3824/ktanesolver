package ktanesolver.module.modded.regular.colorfulinsanity;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record ColorfulInsanityOutput(
    List<String> reversedPair,
    List<String> identicalPair,
    List<Integer> allowedPatternCells,
    List<String> allowedColors,
    List<String> pressCoordinates,
    boolean pairFallback
) implements ModuleOutput {}
