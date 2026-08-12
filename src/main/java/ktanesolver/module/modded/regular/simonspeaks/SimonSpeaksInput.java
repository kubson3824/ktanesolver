package ktanesolver.module.modded.regular.simonspeaks;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record SimonSpeaksInput(List<SimonSpeaksBubble> bubbles, List<String> flashes) implements ModuleInput {}
