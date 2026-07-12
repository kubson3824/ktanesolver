package ktanesolver.module.modded.regular.monsplodefight;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record MonsplodeFightInput(String opponent, List<String> moves, Integer minutesRemaining) implements ModuleInput {
}
