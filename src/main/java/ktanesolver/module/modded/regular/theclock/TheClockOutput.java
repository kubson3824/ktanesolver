package ktanesolver.module.modded.regular.theclock;

import ktanesolver.logic.ModuleOutput;

public record TheClockOutput(String addTime, String subtractTime, int offsetHours, int offsetMinutes) implements ModuleOutput {}
