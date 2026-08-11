package ktanesolver.module.modded.regular.partytime;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record PartyTimeOutput(List<Integer> dieSpaces, List<Integer> pressSpaces, List<String> actions) implements ModuleOutput {}
