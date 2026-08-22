package ktanesolver.module.modded.regular.stickynotes;

import ktanesolver.logic.ModuleOutput;

public record StickyNotesOutput(int notePosition, String task, String category) implements ModuleOutput {}
