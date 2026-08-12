package ktanesolver.module.modded.regular.labyrinth;

import ktanesolver.logic.ModuleInput;

public record LabyrinthInput(Integer layer, String current, String portal1, String portal2) implements ModuleInput {}
