package ktanesolver.module.modded.regular.misorderedkeys;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record MisorderedKeysInput(List<Key> keys, int highlightedPosition) implements ModuleInput {
    public record Key(Color keyColor, Color labelColor, String label) {}
    public enum Color { RED, GREEN, BLUE, CYAN, MAGENTA, YELLOW }
}
