package ktanesolver.module.modded.regular.simonspeaks;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record SimonSpeaksOutput(List<String> positions, List<String> commands, List<String> souvenirFacts) implements ModuleOutput {}
