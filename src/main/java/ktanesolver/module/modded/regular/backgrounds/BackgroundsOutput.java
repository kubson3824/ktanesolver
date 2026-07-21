package ktanesolver.module.modded.regular.backgrounds;

import ktanesolver.logic.ModuleOutput;

public record BackgroundsOutput(int targetCount, String letterPair, int firstRule, int secondRule) implements ModuleOutput {}
