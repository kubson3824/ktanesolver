package ktanesolver.module.modded.regular.modulehomework;

import ktanesolver.logic.ModuleOutput;

public record ModuleHomeworkOutput(String subject, String answer, int baseAnswer, int baseNumber, String school, int button) implements ModuleOutput {}
