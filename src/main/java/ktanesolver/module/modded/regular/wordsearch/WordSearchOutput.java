package ktanesolver.module.modded.regular.wordsearch;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record WordSearchOutput(List<String> words) implements ModuleOutput {}
