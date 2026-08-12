package ktanesolver.module.modded.regular.regularcrazytalk;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record RegularCrazyTalkInput(List<RegularCrazyTalkPhrase> phrases) implements ModuleInput{}
