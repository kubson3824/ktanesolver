package ktanesolver.module.modded.regular.knowyourway;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record KnowYourWayOutput(List<String> presses, List<String> indications, List<String> orientations) implements ModuleOutput {}
