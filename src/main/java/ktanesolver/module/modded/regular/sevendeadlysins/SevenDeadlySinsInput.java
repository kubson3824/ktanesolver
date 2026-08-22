package ktanesolver.module.modded.regular.sevendeadlysins;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record SevenDeadlySinsInput(List<Sin> sins) implements ModuleInput {
    public enum Sin { LUST, GLUTTONY, GREED, SLOTH, WRATH, ENVY, PRIDE }
}
