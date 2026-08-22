package ktanesolver.module.modded.regular.simonstores;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record SimonStoresInput(int stage, List<Color> buttonOrder, List<String> flashes) implements ModuleInput {
    public enum Color { R, G, B, C, M, Y }
}
