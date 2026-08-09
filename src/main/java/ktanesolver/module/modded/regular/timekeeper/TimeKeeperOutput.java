package ktanesolver.module.modded.regular.timekeeper;

import ktanesolver.logic.ModuleOutput;

public record TimeKeeperOutput(int correctLed, int finalNumber) implements ModuleOutput {}
