package ktanesolver.module.modded.regular.streetfighter;

import java.util.List;
import ktanesolver.logic.ModuleOutput;

public record StreetFighterOutput(
    String requiredLetter, String fighter, String opponent, List<String> eligibleFighters
) implements ModuleOutput {}
