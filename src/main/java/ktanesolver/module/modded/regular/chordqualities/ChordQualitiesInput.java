package ktanesolver.module.modded.regular.chordqualities;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record ChordQualitiesInput(List<String> notes) implements ModuleInput {}
