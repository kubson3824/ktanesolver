package ktanesolver.module.modded.regular.morsewar;

import java.util.List;

import ktanesolver.logic.ModuleOutput;

public record MorseWarOutput(int tableNumber, List<String> presses) implements ModuleOutput {}
