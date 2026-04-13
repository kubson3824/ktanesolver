package ktanesolver.module.modded.regular.numberpad;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record NumberPadInput(List<NumberPadColor> buttonColors) implements ModuleInput {
}
