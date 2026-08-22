package ktanesolver.module.modded.regular.melodysequencer;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record MelodySequencerInput(List<Integer> slotParts) implements ModuleInput {}
