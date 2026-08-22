package ktanesolver.module.modded.regular.passportcontrol;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record PassportControlOutput(
    String ruleDate,
    List<String> activeRestrictions,
    String decision,
    List<String> reasons,
    int passageNumber
) implements ModuleOutput {}
