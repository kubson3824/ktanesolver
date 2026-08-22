package ktanesolver.module.modded.regular.thestare;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record TheStareInput(List<Eye> eyes, int targetIndex, int initialMinutes, int disarmedModules, boolean confirm) implements ModuleInput {
    public record Eye(String color, String type, String background, boolean open) {}
}
