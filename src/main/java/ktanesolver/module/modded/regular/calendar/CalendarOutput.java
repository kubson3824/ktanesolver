package ktanesolver.module.modded.regular.calendar;

import ktanesolver.logic.ModuleOutput;

public record CalendarOutput(int targetMonth, int targetDay, int pressCount, String holiday) implements ModuleOutput {}
