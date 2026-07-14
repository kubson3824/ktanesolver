package ktanesolver.module.modded.regular.chordqualities;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record ChordQualitiesOutput(String givenChord, String answerChord, List<String> answerNotes) implements ModuleOutput {}
