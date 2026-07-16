package ktanesolver.module.modded.regular.thescrew;

import ktanesolver.logic.ModuleOutput;

public record TheScrewOutput(int stage, int hole, String holeColor, int buttonPosition, String buttonLabel) implements ModuleOutput {}
