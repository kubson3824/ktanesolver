package ktanesolver.module.modded.regular.sillyslots;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record SillySlotsInput(Keyword keyword, List<Slot> slots) implements ModuleInput {
}
