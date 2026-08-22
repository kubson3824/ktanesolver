package ktanesolver.module.modded.regular.coloredkeys;

import java.util.List;
import ktanesolver.logic.ModuleInput;

public record ColoredKeysInput(String displayedWord, String displayedColor, List<Key> keys) implements ModuleInput {
    public record Key(String color, String letter) {}
}
