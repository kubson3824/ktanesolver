package ktanesolver.module.modded.regular.rockpaperscissorslizardspock;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record RockPaperScissorsLizardSpockOutput(String targetSign, List<String> signsToPress, String scoringRule) implements ModuleOutput {}
