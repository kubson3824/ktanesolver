package ktanesolver.module.modded.regular.guitarchords;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record GuitarChordsOutput(int stage, String chord, int capoPosition, List<String> frets) implements ModuleOutput {}
