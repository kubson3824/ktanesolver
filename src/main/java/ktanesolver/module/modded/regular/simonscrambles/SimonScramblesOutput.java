package ktanesolver.module.modded.regular.simonscrambles;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record SimonScramblesOutput(List<String> presses) implements ModuleOutput {}
