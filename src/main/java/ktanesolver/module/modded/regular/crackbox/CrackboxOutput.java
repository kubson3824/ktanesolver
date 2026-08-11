package ktanesolver.module.modded.regular.crackbox;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record CrackboxOutput(List<String> solution, List<String> twitchTokens) implements ModuleOutput {}
