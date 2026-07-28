package ktanesolver.module.modded.regular.thesun;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record TheSunOutput(List<String> pressSequence) implements ModuleOutput {}
