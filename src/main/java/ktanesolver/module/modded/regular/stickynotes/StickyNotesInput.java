package ktanesolver.module.modded.regular.stickynotes;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record StickyNotesInput(String weekday, List<String> notes) implements ModuleInput {}
