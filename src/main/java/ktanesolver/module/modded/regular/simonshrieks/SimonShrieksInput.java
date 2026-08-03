package ktanesolver.module.modded.regular.simonshrieks;

import java.util.List;

import ktanesolver.logic.ModuleInput;

public record SimonShrieksInput(int stage, List<Integer> flashes) implements ModuleInput {}
